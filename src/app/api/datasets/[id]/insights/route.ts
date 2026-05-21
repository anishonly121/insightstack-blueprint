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

const idSchema = z.string().uuid("Invalid dataset id");
const MAX_TRANSACTIONS = 200;
const MAX_DESCRIPTION_LENGTH = 180;
const MAX_OPENAI_TRANSACTIONS = 100;
const MAX_OPENAI_CHARS = 50_000;
const DAILY_INSIGHTS_QUOTA = 30;
const INSIGHTS_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const INSIGHTS_MODEL = "gpt-4o-mini";
const listInsightsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  sort: z.enum(["createdAt"]).default("createdAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
});

type InsightPayload = {
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

type RedactionCounts = {
  email: number;
  phone: number;
  nric: number;
  longNumber: number;
};

type RedactionResult = {
  text: string;
  counts: RedactionCounts;
};

type PromptBuildResult = {
  promptParams: {
    dataset: {
      id: string;
      name: string;
      status: string;
      rowCount: number;
      originalFilename: string | null;
      createdAt: string;
    };
    transactions: Array<{
      date: string;
      description: string;
      category: string;
      amount: string;
    }>;
    instruction: string;
  };
  transactionsIncluded: number;
  totalCharsSent: number;
  redactionCounts: RedactionCounts;
};

const EMAIL_REGEX = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const PHONE_REGEX = /(?:\+?\d[\d\s().-]{7,}\d)/g;
const NRIC_REGEX = /\b[STFG]\d{7}[A-Z]\b/gi;
const LONG_DIGIT_REGEX = /\b\d{9,}\b/g;

const insightPayloadSchema = z.object({
  summary: z.string().min(1),
  topSpendingCategories: z
    .array(
      z.object({
        category: z.string().min(1),
        amount: z.number().finite(),
        reason: z.string().min(1),
      }),
    )
    .default([]),
  anomalies: z
    .array(
      z.object({
        date: z.string().min(1),
        description: z.string().min(1),
        category: z.string().min(1),
        amount: z.number().finite(),
        reason: z.string().min(1),
      }),
    )
    .default([]),
  recommendations: z
    .array(z.string().min(1))
    .min(3)
    .transform((arr) => [arr[0], arr[1], arr[2]] as [string, string, string]),
});

const normalizeRecommendations = (recommendations: string[]): [string, string, string] => {
  const defaults = [
    "Set a monthly budget cap for your highest spending category.",
    "Review high-value transactions and tag expected one-off expenses.",
    "Track category trends weekly to catch overspending early.",
  ];
  const merged = [...recommendations.filter((r) => r.trim().length > 0), ...defaults];
  return [merged[0], merged[1], merged[2]];
};

const toShortSummary = (summary: string): string => {
  const clean = summary.replace(/\s+/g, " ").trim();
  if (clean.length <= 280) {
    return clean;
  }
  return `${clean.slice(0, 277)}...`;
};

const truncateDescription = (value: string): string => {
  if (value.length <= MAX_DESCRIPTION_LENGTH) {
    return value;
  }
  return `${value.slice(0, MAX_DESCRIPTION_LENGTH - 3)}...`;
};

const redactPattern = (
  input: string,
  pattern: RegExp,
  replacement: string,
): { text: string; count: number } => {
  let count = 0;
  const text = input.replace(pattern, () => {
    count += 1;
    return replacement;
  });
  return { text, count };
};

const redactPiiText = (value: string): RedactionResult => {
  const counts: RedactionCounts = {
    email: 0,
    phone: 0,
    nric: 0,
    longNumber: 0,
  };

  let text = value;

  const nric = redactPattern(text, NRIC_REGEX, "[REDACTED_NRIC]");
  text = nric.text;
  counts.nric += nric.count;

  const email = redactPattern(text, EMAIL_REGEX, "[REDACTED_EMAIL]");
  text = email.text;
  counts.email += email.count;

  const phone = redactPattern(text, PHONE_REGEX, "[REDACTED_PHONE]");
  text = phone.text;
  counts.phone += phone.count;

  const longNumber = redactPattern(text, LONG_DIGIT_REGEX, "[REDACTED_NUMBER]");
  text = longNumber.text;
  counts.longNumber += longNumber.count;

  return { text, counts };
};

const mergeCounts = (target: RedactionCounts, source: RedactionCounts): void => {
  target.email += source.email;
  target.phone += source.phone;
  target.nric += source.nric;
  target.longNumber += source.longNumber;
};

const getUtcDayWindow = (): { start: Date; end: Date } => {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start, end };
};

const createInsightCacheKey = (
  datasetId: string,
  model: string,
  promptParams: unknown,
): string => {
  return createHash("sha256")
    .update(JSON.stringify({ datasetId, model, promptParams }))
    .digest("hex");
};

const buildPromptParams = (
  dataset: {
    id: string;
    name: string;
    status: string;
    rowCount: number;
    originalFilename: string | null;
    createdAt: Date;
  },
  transactions: Array<{ date: Date; description: string; category: string; amount: { toString: () => string } }>,
  promptInstruction: string,
): PromptBuildResult => {
  const redactionCounts: RedactionCounts = {
    email: 0,
    phone: 0,
    nric: 0,
    longNumber: 0,
  };

  const datasetName = redactPiiText(dataset.name);
  mergeCounts(redactionCounts, datasetName.counts);

  const originalFilename = dataset.originalFilename
    ? redactPiiText(dataset.originalFilename)
    : null;
  if (originalFilename) {
    mergeCounts(redactionCounts, originalFilename.counts);
  }

  const promptDataset = {
    id: dataset.id,
    name: datasetName.text,
    status: dataset.status,
    rowCount: dataset.rowCount,
    originalFilename: originalFilename?.text ?? null,
    createdAt: dataset.createdAt.toISOString(),
  };

  const promptTransactions: Array<{
    date: string;
    description: string;
    category: string;
    amount: string;
  }> = [];

  const baseChars = JSON.stringify({
    dataset: promptDataset,
    transactions: [],
    instruction: promptInstruction,
  }).length;
  let totalChars = baseChars;

  for (const tx of transactions) {
    if (promptTransactions.length >= MAX_OPENAI_TRANSACTIONS) {
      break;
    }

    const redactedDescription = redactPiiText(truncateDescription(tx.description));
    const redactedCategory = redactPiiText(tx.category);
    mergeCounts(redactionCounts, redactedDescription.counts);
    mergeCounts(redactionCounts, redactedCategory.counts);

    const txEntry = {
      date: tx.date.toISOString(),
      description: redactedDescription.text,
      category: redactedCategory.text,
      amount: tx.amount.toString(),
    };

    const txChars = JSON.stringify(txEntry).length;
    if (totalChars + txChars > MAX_OPENAI_CHARS) {
      break;
    }

    promptTransactions.push(txEntry);
    totalChars += txChars;
  }

  return {
    promptParams: {
      dataset: promptDataset,
      transactions: promptTransactions,
      instruction: promptInstruction,
    },
    transactionsIncluded: promptTransactions.length,
    totalCharsSent: totalChars,
    redactionCounts,
  };
};

const buildFallbackInsight = (
  transactions: Array<{ date: Date; description: string; category: string; amount: { toString: () => string } }>,
  openaiError?: string,
): InsightPayload => {
  const categoryTotals = new Map<string, number>();
  const normalized = transactions.map((t) => {
    const amount = Number(t.amount.toString());
    categoryTotals.set(t.category, (categoryTotals.get(t.category) ?? 0) + amount);
    return {
      date: t.date.toISOString().slice(0, 10),
      description: truncateDescription(t.description),
      category: t.category,
      amount,
    };
  });

  const topSpendingCategories = [...categoryTotals.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([category, amount]) => ({
      category,
      amount: Number(amount.toFixed(2)),
      reason: "Highest total spend based on uploaded transactions.",
    }));

  const avg = normalized.length
    ? normalized.reduce((sum, t) => sum + t.amount, 0) / normalized.length
    : 0;
  const anomalies = normalized
    .filter((t) => t.amount > avg * 2 && t.amount > 0)
    .slice(0, 5)
    .map((t) => ({
      date: t.date,
      description: t.description,
      category: t.category,
      amount: t.amount,
      reason: "Amount is significantly above dataset average.",
    }));

  const summaryLines = [
    `Processed ${normalized.length} transactions for analysis.`,
    topSpendingCategories[0]
      ? `Top category is ${topSpendingCategories[0].category} at ${topSpendingCategories[0].amount.toFixed(2)}.`
      : "No category totals available.",
    anomalies.length > 0
      ? `Detected ${anomalies.length} high-value transaction(s).`
      : "No clear anomalies detected in this sample.",
  ];

  return {
    summary: toShortSummary(summaryLines.join(" ")),
    topSpendingCategories,
    anomalies,
    recommendations: normalizeRecommendations([]),
    ...(openaiError ? { openaiError } : {}),
  };
};

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
    return {
      error: errorResponseWithRequestId(
        requestId,
        401,
        "UNAUTHORIZED",
        "Missing or invalid token",
      ),
    };
  }

  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success) {
    return {
      error: errorResponseWithRequestId(requestId, 400, "VALIDATION_ERROR", "Invalid dataset id"),
    };
  }

  const dataset = await prisma.dataset.findFirst({
    where: { id: parsedId.data, userId: user.id },
    select: {
      id: true,
      name: true,
      status: true,
      rowCount: true,
      originalFilename: true,
      createdAt: true,
    },
  });

  if (!dataset) {
    return {
      error: errorResponseWithRequestId(requestId, 404, "NOT_FOUND", "Dataset not found"),
    };
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
  if ("error" in resolved) {
    return resolved.error;
  }

  try {
    const searchParams = new URL(req.url).searchParams;
    const parsedQuery = listInsightsQuerySchema.safeParse({
      page: searchParams.get("page") ?? undefined,
      pageSize: searchParams.get("pageSize") ?? undefined,
      sort: searchParams.get("sort") ?? undefined,
      order: searchParams.get("order") ?? undefined,
    });

    if (!parsedQuery.success) {
      return errorResponseWithRequestId(
        requestId,
        400,
        "VALIDATION_ERROR",
        parsedQuery.error.issues[0]?.message ?? "Invalid query params",
      );
    }

    const { page, pageSize, sort, order } = parsedQuery.data;
    const where = { datasetId: resolved.dataset.id };
    const [total, insights] = await Promise.all([
      prisma.insight.count({ where }),
      prisma.insight.findMany({
        where,
        orderBy: { [sort]: order },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    return jsonWithRequestId(requestId, {
      data: insights,
      meta: {
        page,
        pageSize,
        total,
        totalPages,
      },
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
  if (csrfError) {
    return csrfError;
  }
  const { id } = await params;
  const resolved = await resolveAuthorizedDataset(req, id, requestId);
  if ("error" in resolved) {
    return resolved.error;
  }

  const apiKey = env.OPENAI_API_KEY;
  if (!apiKey) {
    return errorResponseWithRequestId(
      requestId,
      500,
      "OPENAI_KEY_MISSING",
      "OPENAI_API_KEY is not configured",
    );
  }
  const dataset = resolved.dataset;
  const userId = resolved.userId;
  const ip = getRequestIp(req);
  const requestMeta = getAuditRequestMeta(req);
  const isOpenAiStubbed = process.env.NODE_ENV === "test" || apiKey === "test";

  const { allowed } = await rateLimitOrThrow({
    key: `datasets:insights:${dataset.id}:${userId}:${ip}`,
    limit: 20,
    windowMs: 60 * 1000,
  });
  if (!allowed) {
    return errorResponseWithRequestId(
      requestId,
      429,
      "RATE_LIMITED",
      "Too many requests. Try again later.",
    );
  }

  try {
    const transactions = await prisma.transaction.findMany({
      where: { datasetId: dataset.id },
      orderBy: { date: "desc" },
      take: MAX_TRANSACTIONS,
      select: {
        date: true,
        description: true,
        category: true,
        amount: true,
      },
    });

    const promptInstruction =
      "Return strict JSON with keys: summary (string), topSpendingCategories (array), anomalies (array), recommendations (array of exactly 3 strings).";
    const promptBuild = buildPromptParams(dataset, transactions, promptInstruction);
    const promptParams = promptBuild.promptParams;
    const cacheKey = createInsightCacheKey(dataset.id, INSIGHTS_MODEL, promptParams);
    const cachedInsight = await prisma.insight.findFirst({
      where: {
        datasetId: dataset.id,
        cacheKey,
        createdAt: {
          gte: new Date(Date.now() - INSIGHTS_CACHE_TTL_MS),
        },
      },
      orderBy: { createdAt: "desc" },
    });

    if (cachedInsight) {
      return jsonWithRequestId(requestId, { data: cachedInsight });
    }

    const { start, end } = getUtcDayWindow();
    const insightsUsedToday = await prisma.auditLog.count({
      where: {
        userId,
        action: "INSIGHTS_GENERATE",
        createdAt: {
          gte: start,
          lt: end,
        },
      },
    });

    if (insightsUsedToday >= DAILY_INSIGHTS_QUOTA) {
      return errorResponseWithRequestId(
        requestId,
        429,
        "QUOTA_EXCEEDED",
        "Daily insights quota exceeded",
      );
    }

    const prompt = {
      dataset: promptParams.dataset,
      transactions: promptParams.transactions,
      instruction: promptInstruction,
    };

    console.info("INSIGHTS_PROMPT_STATS", {
      requestId,
      datasetId: dataset.id,
      transactionsIncluded: promptBuild.transactionsIncluded,
      totalCharsSent: promptBuild.totalCharsSent,
      redactionCounts: promptBuild.redactionCounts,
    });

    let insightJson: InsightPayload;
    let summary = "Generated insights";
    let model = INSIGHTS_MODEL;

    if (isOpenAiStubbed) {
      console.info("OPENAI_STUBBED_IN_TEST", { requestId, datasetId: dataset.id });
      insightJson = buildFallbackInsight(transactions);
      summary = insightJson.summary;
      model = "stub-test-v1";
    } else {
      const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: INSIGHTS_MODEL,
          temperature: 0.2,
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content:
                "You are a finance analyst. Output valid JSON only with keys: summary, topSpendingCategories, anomalies, recommendations. recommendations must contain exactly 3 strings.",
            },
            {
              role: "user",
              content: JSON.stringify(prompt),
            },
          ],
        }),
      });

      if (!openaiRes.ok) {
        const errText = await openaiRes.text();
        insightJson = buildFallbackInsight(transactions, errText || "OpenAI request failed");
        summary = insightJson.summary;
        model = "fallback-local-v1";
      } else {
        const completion = (await openaiRes.json()) as {
          choices?: Array<{ message?: { content?: string } }>;
        };
        const content = completion.choices?.[0]?.message?.content ?? "";

        try {
          const parsed = JSON.parse(content) as unknown;
          const normalized = insightPayloadSchema.safeParse(parsed);
          if (!normalized.success) {
            insightJson = buildFallbackInsight(
              transactions,
              `OPENAI_INVALID_JSON: ${normalized.error.issues[0]?.message ?? "Invalid schema"}`,
            );
            model = "fallback-local-v1";
          } else {
            const data = normalized.data;
            insightJson = {
              summary: toShortSummary(data.summary),
              topSpendingCategories: data.topSpendingCategories.map((c) => ({
                category: c.category,
                amount: Number(c.amount.toFixed(2)),
                reason: c.reason,
              })),
              anomalies: data.anomalies.map((a) => ({
                date: a.date,
                description: truncateDescription(a.description),
                category: a.category,
                amount: Number(a.amount.toFixed(2)),
                reason: a.reason,
              })),
              recommendations: normalizeRecommendations(data.recommendations),
            };
          }
        } catch {
          insightJson = buildFallbackInsight(transactions, "OPENAI_PARSE_ERROR: Failed to parse JSON response");
          model = "fallback-local-v1";
        }
        summary = insightJson.summary;
      }
    }

    const savedInsight = await prisma.$transaction(async (tx) => {
      const createdInsight = await tx.insight.create({
        data: {
          datasetId: dataset.id,
          model,
          cacheKey,
          insightText: summary,
          insightJson,
        },
      });

      return createdInsight;
    });

    await logAudit({
      userId,
      action: "INSIGHTS_GENERATE",
      entityType: "Dataset",
      entityId: dataset.id,
      meta: {
        insightId: savedInsight.id,
        model,
        ...requestMeta,
      },
    });

    return jsonWithRequestId(requestId, { data: savedInsight });
  } catch {
    try {
      const transactions = await prisma.transaction.findMany({
        where: { datasetId: dataset.id },
        orderBy: { date: "desc" },
        take: MAX_TRANSACTIONS,
        select: {
          date: true,
          description: true,
          category: true,
          amount: true,
        },
      });
      const insightJson = buildFallbackInsight(transactions, "OPENAI_REQUEST_ERROR: Network or runtime failure");
      const fallbackPromptInstruction =
        "Return strict JSON with keys: summary (string), topSpendingCategories (array), anomalies (array), recommendations (array of exactly 3 strings).";
      const fallbackPromptBuild = buildPromptParams(
        dataset,
        transactions,
        fallbackPromptInstruction,
      );
      const fallbackPromptParams = fallbackPromptBuild.promptParams;
      const fallbackCacheKey = createInsightCacheKey(
        dataset.id,
        "fallback-local-v1",
        fallbackPromptParams,
      );
      const savedInsight = await prisma.$transaction(async (tx) => {
        const createdInsight = await tx.insight.create({
          data: {
            datasetId: dataset.id,
            model: "fallback-local-v1",
            cacheKey: fallbackCacheKey,
            insightText: insightJson.summary,
            insightJson,
          },
        });

        return createdInsight;
      });

      await logAudit({
        userId,
        action: "INSIGHTS_GENERATE",
        entityType: "Dataset",
        entityId: dataset.id,
        meta: {
          insightId: savedInsight.id,
          model: "fallback-local-v1",
          ...requestMeta,
        },
      });
      return jsonWithRequestId(requestId, { data: savedInsight });
    } catch {
      return errorResponseWithRequestId(requestId, 500, "INTERNAL_SERVER_ERROR", "Something went wrong");
    }
  }
}
