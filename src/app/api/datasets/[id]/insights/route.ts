import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";
import { enforceCsrfIfCookieAuth } from "@/lib/csrf";
import { getRequestIp, rateLimitOrThrow } from "@/lib/rateLimit";
import { getAuditRequestMeta, logAudit } from "@/lib/audit";
import { env } from "@/lib/env";
import { errorResponseWithRequestId, getRequestId, jsonWithRequestId } from "@/lib/http";
import { logger } from "@/lib/logger";
import { computeMetrics, detectAnomalies, type AnomalyStat, type CategoryStat } from "@/lib/metrics";
import { getInsightsQuota } from "@/lib/subscription";

const idSchema = z.string().uuid("Invalid dataset id");
const INSIGHTS_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const INSIGHTS_MODEL = "gpt-4o-mini";

const listInsightsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  sort: z.enum(["createdAt"]).default("createdAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
});

export type InsightPayload = {
  summary: string;
  topSpendingCategories: Array<{ category: string; amount: number; reason: string }>;
  anomalies: Array<{
    date: string;
    description: string;
    category: string;
    amount: number;
    reason: string;
  }>;
  recommendations: [string, string, string];
  openaiError?: string;
};

// Schema for what we ask the LLM to return — narrative text only, no numbers
const llmNarrativeSchema = z.object({
  summary: z.string().min(1),
  categoryReasons: z.array(z.string()).default([]),
  anomalyReasons: z.array(z.string()).default([]),
  recommendations: z
    .array(z.string().min(1))
    .min(3)
    .transform((arr): [string, string, string] => [arr[0], arr[1], arr[2]]),
});

const EMAIL_REGEX = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const PHONE_REGEX = /(?:\+?\d[\d\s().-]{7,}\d)/g;
const NRIC_REGEX = /\b[STFG]\d{7}[A-Z]\b/gi;
const LONG_DIGIT_REGEX = /\b\d{9,}\b/g;

function redactPii(value: string): string {
  return value
    .replace(NRIC_REGEX, "[REDACTED]")
    .replace(EMAIL_REGEX, "[REDACTED]")
    .replace(PHONE_REGEX, "[REDACTED]")
    .replace(LONG_DIGIT_REGEX, "[REDACTED]");
}

function defaultCategoryReason(cat: CategoryStat): string {
  return `${cat.category} totalled ${cat.total.toFixed(2)} across ${cat.count} transaction${cat.count !== 1 ? "s" : ""}.`;
}

function defaultAnomalyReason(a: AnomalyStat): string {
  return `This transaction is ${a.zScore.toFixed(1)} standard deviations above your average spend.`;
}

function buildFallbackInsight(
  categories: CategoryStat[],
  anomalies: AnomalyStat[],
  totalExpenses: number,
  transactionCount: number,
  openaiError?: string,
): InsightPayload {
  const top = categories[0];
  const summaryParts = [
    `Analysed ${transactionCount} transactions with total expenses of ${totalExpenses.toFixed(2)}.`,
    top ? `Your highest spend category is ${top.category} at ${top.total.toFixed(2)}.` : "",
    anomalies.length > 0
      ? `Detected ${anomalies.length} high-value transaction${anomalies.length !== 1 ? "s" : ""}.`
      : "No unusual transactions detected.",
  ].filter(Boolean);

  return {
    summary: summaryParts.join(" "),
    topSpendingCategories: categories.slice(0, 5).map((cat) => ({
      category: cat.category,
      amount: cat.total,
      reason: defaultCategoryReason(cat),
    })),
    anomalies: anomalies.map((a) => ({
      date: a.date,
      description: a.description,
      category: a.category,
      amount: a.amount,
      reason: defaultAnomalyReason(a),
    })),
    recommendations: [
      top ? `Set a monthly budget cap for ${top.category} to manage your largest expense category.` : "Review your spending categories and set monthly limits.",
      "Flag any high-value transactions you didn't expect to catch billing errors early.",
      "Track your monthly net savings rate — aim for at least 20% of income.",
    ],
    ...(openaiError ? { openaiError } : {}),
  };
}

function buildGroundedPrompt(
  datasetName: string,
  categories: CategoryStat[],
  anomalies: AnomalyStat[],
  totalIncome: number,
  totalExpenses: number,
  netSavings: number,
  savingsRate: number,
  transactionCount: number,
): string {
  return JSON.stringify({
    datasetName: redactPii(datasetName),
    metrics: {
      totalIncome,
      totalExpenses,
      netSavings,
      savingsRate,
      transactionCount,
    },
    topCategories: categories.slice(0, 5).map((c) => ({
      category: redactPii(c.category),
      total: c.total,
      count: c.count,
    })),
    anomalies: anomalies.map((a) => ({
      date: a.date,
      description: redactPii(a.description),
      category: redactPii(a.category),
      amount: a.amount,
      zScore: a.zScore,
    })),
    task: [
      "Using ONLY the exact figures above (do not recalculate or estimate), write a financial analysis.",
      "Return JSON with keys:",
      "  summary: 2-3 sentence narrative using the exact figures.",
      `  categoryReasons: array of ${Math.min(categories.length, 5)} short strings, one insight per category.`,
      `  anomalyReasons: array of ${anomalies.length} short strings explaining why each transaction is notable.`,
      "  recommendations: array of exactly 3 specific, actionable advice strings.",
    ].join(" "),
  });
}

const resolveAuthorizedDataset = async (
  req: Request,
  id: string,
  requestId: string,
): Promise<
  | { error: NextResponse }
  | {
      userId: string;
      dataset: {
        id: string;
        name: string;
        status: string;
        rowCount: number;
        originalFilename: string | null;
        createdAt: Date;
      };
    }
> => {
  const user = await getUserFromRequest(req);
  if (!user) {
    return { error: errorResponseWithRequestId(requestId, 401, "UNAUTHORIZED", "Missing or invalid token") };
  }

  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success) {
    return { error: errorResponseWithRequestId(requestId, 400, "VALIDATION_ERROR", "Invalid dataset id") };
  }

  const dataset = await prisma.dataset.findFirst({
    where: { id: parsedId.data, userId: user.id },
    select: { id: true, name: true, status: true, rowCount: true, originalFilename: true, createdAt: true },
  });

  if (!dataset) {
    return { error: errorResponseWithRequestId(requestId, 404, "NOT_FOUND", "Dataset not found") };
  }

  return { dataset, userId: user.id };
};


export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const requestId = getRequestId(req);
  const { id } = await params;
  const resolved = await resolveAuthorizedDataset(req, id, requestId);
  if ("error" in resolved) return resolved.error;

  try {
    const searchParams = new URL(req.url).searchParams;
    const parsedQuery = listInsightsQuerySchema.safeParse({
      page: searchParams.get("page") ?? undefined,
      pageSize: searchParams.get("pageSize") ?? undefined,
      sort: searchParams.get("sort") ?? undefined,
      order: searchParams.get("order") ?? undefined,
    });

    if (!parsedQuery.success) {
      return errorResponseWithRequestId(requestId, 400, "VALIDATION_ERROR", parsedQuery.error.issues[0]?.message ?? "Invalid query params");
    }

    const { page, pageSize, sort, order } = parsedQuery.data;
    const where = { datasetId: resolved.dataset.id };
    const [total, insights] = await Promise.all([
      prisma.insight.count({ where }),
      prisma.insight.findMany({ where, orderBy: { [sort]: order }, skip: (page - 1) * pageSize, take: pageSize }),
    ]);

    return jsonWithRequestId(requestId, {
      data: insights,
      meta: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) },
    });
  } catch {
    return errorResponseWithRequestId(requestId, 500, "INTERNAL_SERVER_ERROR", "Something went wrong");
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const requestId = getRequestId(req);
  const csrfError = enforceCsrfIfCookieAuth(req, requestId);
  if (csrfError) return csrfError;

  const { id } = await params;
  const resolved = await resolveAuthorizedDataset(req, id, requestId);
  if ("error" in resolved) return resolved.error;

  const apiKey = env.OPENAI_API_KEY;
  if (!apiKey) {
    return errorResponseWithRequestId(requestId, 500, "OPENAI_KEY_MISSING", "OPENAI_API_KEY is not configured");
  }

  const { dataset, userId } = resolved;
  const ip = getRequestIp(req);
  const requestMeta = getAuditRequestMeta(req);
  const isStubbed = process.env.NODE_ENV === "test" || apiKey === "test";

  const { allowed } = await rateLimitOrThrow({
    key: `datasets:insights:${dataset.id}:${userId}:${ip}`,
    limit: 20,
    windowMs: 60 * 1000,
  });
  if (!allowed) {
    return errorResponseWithRequestId(requestId, 429, "RATE_LIMITED", "Too many requests. Try again later.");
  }

  // Fetch ALL transactions — metrics must be computed from complete data
  const transactions = await prisma.transaction.findMany({
    where: { datasetId: dataset.id },
    orderBy: { date: "desc" },
    select: { date: true, description: true, category: true, amount: true },
  });

  // Compute exact metrics and anomalies deterministically from the database
  const metrics = computeMetrics(transactions);
  const anomalies = detectAnomalies(transactions);

  const cacheKey = createHash("sha256")
    .update(JSON.stringify({ datasetId: dataset.id, model: INSIGHTS_MODEL, metrics, anomalies }))
    .digest("hex");

  const cachedInsight = await prisma.insight.findFirst({
    where: { datasetId: dataset.id, cacheKey, createdAt: { gte: new Date(Date.now() - INSIGHTS_CACHE_TTL_MS) } },
    orderBy: { createdAt: "desc" },
  });

  if (cachedInsight) {
    return jsonWithRequestId(requestId, { data: cachedInsight });
  }

  const quota = await getInsightsQuota(userId);
  if (quota.remaining <= 0) {
    return errorResponseWithRequestId(
      requestId, 429, "QUOTA_EXCEEDED",
      quota.isPro
        ? "Daily insights quota exceeded. Resets at midnight UTC."
        : `Free plan allows ${quota.limit} insights per month. Upgrade to Pro for 30/day.`,
    );
  }

  logger.info("INSIGHTS_GROUNDED_COMPUTE", {
    requestId,
    datasetId: dataset.id,
    transactionCount: metrics.transactionCount,
    anomalyCount: anomalies.length,
    topCategories: metrics.topCategories.slice(0, 3).map((c) => c.category),
  });

  let insightPayload: InsightPayload;
  let model = INSIGHTS_MODEL;

  if (isStubbed) {
    logger.info("OPENAI_STUBBED_IN_TEST", { requestId, datasetId: dataset.id });
    insightPayload = buildFallbackInsight(metrics.topCategories, anomalies, metrics.totalExpenses, metrics.transactionCount);
    model = "stub-test-v1";
  } else {
    const groundedPrompt = buildGroundedPrompt(
      dataset.name,
      metrics.topCategories,
      anomalies,
      metrics.totalIncome,
      metrics.totalExpenses,
      metrics.netSavings,
      metrics.savingsRate,
      metrics.transactionCount,
    );

    try {
      const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: INSIGHTS_MODEL,
          temperature: 0.3,
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content:
                "You are a personal finance analyst. You will receive pre-computed financial metrics. " +
                "Your only job is to write clear, specific, actionable narrative text. " +
                "Do NOT recalculate, estimate, or invent any numbers — use only the exact figures provided. " +
                "Return valid JSON only.",
            },
            { role: "user", content: groundedPrompt },
          ],
        }),
      });

      if (!openaiRes.ok) {
        const errText = await openaiRes.text();
        logger.warn("OPENAI_REQUEST_FAILED", { requestId, status: openaiRes.status, errText });
        insightPayload = buildFallbackInsight(metrics.topCategories, anomalies, metrics.totalExpenses, metrics.transactionCount, errText || "OpenAI request failed");
        model = "fallback-local-v1";
      } else {
        const completion = (await openaiRes.json()) as { choices?: Array<{ message?: { content?: string } }> };
        const content = completion.choices?.[0]?.message?.content ?? "";

        const parsed = llmNarrativeSchema.safeParse(JSON.parse(content));
        if (!parsed.success) {
          logger.warn("OPENAI_INVALID_SCHEMA", { requestId, issue: parsed.error.issues[0]?.message });
          insightPayload = buildFallbackInsight(metrics.topCategories, anomalies, metrics.totalExpenses, metrics.transactionCount, "Invalid LLM response schema");
          model = "fallback-local-v1";
        } else {
          const narrative = parsed.data;
          // Merge: numbers always from computation, text from LLM
          insightPayload = {
            summary: narrative.summary,
            topSpendingCategories: metrics.topCategories.slice(0, 5).map((cat, i) => ({
              category: cat.category,
              amount: cat.total,
              reason: narrative.categoryReasons[i] ?? defaultCategoryReason(cat),
            })),
            anomalies: anomalies.map((a, i) => ({
              date: a.date,
              description: a.description,
              category: a.category,
              amount: a.amount,
              reason: narrative.anomalyReasons[i] ?? defaultAnomalyReason(a),
            })),
            recommendations: narrative.recommendations,
          };
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      logger.error("OPENAI_UNEXPECTED_ERROR", { requestId, msg });
      insightPayload = buildFallbackInsight(metrics.topCategories, anomalies, metrics.totalExpenses, metrics.transactionCount, msg);
      model = "fallback-local-v1";
    }
  }

  const savedInsight = await prisma.$transaction(async (tx) => {
    return tx.insight.create({
      data: {
        datasetId: dataset.id,
        model,
        cacheKey,
        insightText: insightPayload.summary,
        insightJson: insightPayload,
      },
    });
  });

  await logAudit({
    userId,
    action: "INSIGHTS_GENERATE",
    entityType: "Dataset",
    entityId: dataset.id,
    meta: { insightId: savedInsight.id, model, ...requestMeta },
  });

  return jsonWithRequestId(requestId, { data: savedInsight });
}
