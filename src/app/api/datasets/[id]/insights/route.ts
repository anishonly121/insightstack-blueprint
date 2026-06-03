import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";
import { enforceCsrfIfCookieAuth } from "@/lib/csrf";
import { getRequestIp, rateLimitOrThrow } from "@/lib/rateLimit";
import { getAuditRequestMeta, logAudit } from "@/lib/audit";
import { errorResponseWithRequestId, getRequestId, jsonWithRequestId } from "@/lib/http";
import { logger } from "@/lib/logger";
import { computeMetrics, detectAnomalies } from "@/lib/metrics";
import { getInsightsQuota } from "@/lib/subscription";
import { generateInsights, FINANCE_AI_MODEL } from "@/lib/ai";

const idSchema = z.string().uuid("Invalid dataset id");
const INSIGHTS_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

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

  const { dataset, userId } = resolved;
  const ip = getRequestIp(req);
  const requestMeta = getAuditRequestMeta(req);

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
    .update(JSON.stringify({ datasetId: dataset.id, model: FINANCE_AI_MODEL, metrics, anomalies }))
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

  logger.info("INSIGHTS_FINANCE_AI_COMPUTE", {
    requestId,
    datasetId: dataset.id,
    transactionCount: metrics.transactionCount,
    anomalyCount: anomalies.length,
    topCategories: metrics.topCategories.slice(0, 3).map((c) => c.category),
  });

  const engineOutput = generateInsights(metrics, anomalies);
  const insightPayload: InsightPayload = {
    summary: engineOutput.summary,
    topSpendingCategories: engineOutput.topSpendingCategories,
    anomalies: engineOutput.anomalies,
    recommendations: engineOutput.recommendations,
  };
  const model = FINANCE_AI_MODEL;

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
