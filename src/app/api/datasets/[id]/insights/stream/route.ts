import type { NextResponse } from "next/server";
import { createHash } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";
import { enforceCsrfIfCookieAuth } from "@/lib/csrf";
import { getRequestIp, rateLimitOrThrow } from "@/lib/rateLimit";
import { getAuditRequestMeta, logAudit } from "@/lib/audit";
import { getRequestId, errorResponseWithRequestId } from "@/lib/http";
import { logger } from "@/lib/logger";
import { computeMetrics, detectAnomalies } from "@/lib/metrics";
import { getInsightsQuota } from "@/lib/subscription";
import { generateInsights, streamInsightSummary, FINANCE_AI_MODEL } from "@/lib/ai";

const idSchema = z.string().uuid("Invalid dataset id");
const INSIGHTS_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

type StreamEvent =
  | { type: "step"; message: string; status: "running" | "done" }
  | { type: "delta"; text: string }
  | { type: "done"; insightId: string; insight: object }
  | { type: "error"; message: string; code?: string };

function encode(event: StreamEvent): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify(event)}\n\n`);
}


export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response | NextResponse> {
  const requestId = getRequestId(req);

  const csrfError = enforceCsrfIfCookieAuth(req, requestId);
  if (csrfError) return csrfError;

  const user = await getUserFromRequest(req);
  if (!user) return errorResponseWithRequestId(requestId, 401, "UNAUTHORIZED", "Missing or invalid token");

  const { id } = await params;
  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success) return errorResponseWithRequestId(requestId, 400, "VALIDATION_ERROR", "Invalid dataset id");

  const dataset = await prisma.dataset.findFirst({
    where: { id: parsedId.data, userId: user.id },
    select: { id: true, name: true, status: true, rowCount: true, originalFilename: true, createdAt: true },
  });
  if (!dataset) return errorResponseWithRequestId(requestId, 404, "NOT_FOUND", "Dataset not found");

  const ip = getRequestIp(req);
  const requestMeta = getAuditRequestMeta(req);

  try {
    await rateLimitOrThrow({ key: `datasets:insights:${dataset.id}:${user.id}:${ip}`, limit: 20, windowMs: 60_000 });
  } catch {
    return errorResponseWithRequestId(requestId, 429, "RATE_LIMITED", "Too many requests. Try again later.");
  }

  const quota = await getInsightsQuota(user.id);
  if (quota.remaining <= 0) {
    return errorResponseWithRequestId(
      requestId, 429, "QUOTA_EXCEEDED",
      quota.isPro
        ? "Daily insights quota exceeded. Resets at midnight UTC."
        : `Free plan allows ${quota.limit} insights per month. Upgrade to Pro for 30/day.`,
    );
  }

  // All checks passed — build the stream
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const emit = (event: StreamEvent) => controller.enqueue(encode(event));

      try {
        emit({ type: "step", message: `Fetching ${dataset.rowCount.toLocaleString()} transactions from database…`, status: "running" });

        const transactions = await prisma.transaction.findMany({
          where: { datasetId: dataset.id },
          orderBy: { date: "desc" },
          select: { date: true, description: true, category: true, amount: true },
        });

        emit({ type: "step", message: `Fetched ${transactions.length.toLocaleString()} transactions`, status: "done" });
        emit({ type: "step", message: "Computing exact metrics — income, expenses, savings rate, category totals…", status: "running" });

        const metrics = computeMetrics(transactions);
        const anomalies = detectAnomalies(transactions);

        emit({ type: "step", message: `Metrics computed — $${metrics.totalExpenses.toFixed(2)} expenses across ${metrics.topCategories.length} categories`, status: "done" });
        emit({ type: "step", message: `Anomaly detection complete — ${anomalies.length} unusual transaction${anomalies.length !== 1 ? "s" : ""} found`, status: "done" });

        const cacheKey = createHash("sha256")
          .update(JSON.stringify({ datasetId: dataset.id, model: FINANCE_AI_MODEL, metrics, anomalies }))
          .digest("hex");

        const cached = await prisma.insight.findFirst({
          where: { datasetId: dataset.id, cacheKey, createdAt: { gte: new Date(Date.now() - INSIGHTS_CACHE_TTL_MS) } },
          orderBy: { createdAt: "desc" },
        });

        if (cached) {
          emit({ type: "step", message: "Serving from cache (same data, recent analysis)", status: "done" });
          emit({ type: "done", insightId: cached.id, insight: cached.insightJson as object });
          controller.close();
          return;
        }

        emit({ type: "step", message: "Running FinanceAI — BM25 retrieval, rule engine, statistical analysis…", status: "running" });

        const engineOutput = generateInsights(metrics, anomalies);

        emit({ type: "step", message: "Composing analysis…", status: "running" });

        let summaryText = "";
        for await (const chunk of streamInsightSummary(metrics, anomalies)) {
          summaryText += chunk;
          emit({ type: "delta", text: chunk });
        }

        emit({ type: "step", message: "Saving insight to database…", status: "running" });

        const insightPayload = {
          summary: engineOutput.summary,
          topSpendingCategories: engineOutput.topSpendingCategories,
          anomalies: engineOutput.anomalies,
          recommendations: engineOutput.recommendations,
        };

        const savedInsight = await prisma.insight.create({
          data: {
            datasetId: dataset.id,
            model: FINANCE_AI_MODEL,
            cacheKey,
            insightText: insightPayload.summary,
            insightJson: insightPayload,
          },
        });

        await logAudit({
          userId: user.id,
          action: "INSIGHTS_GENERATE",
          entityType: "Dataset",
          entityId: dataset.id,
          meta: { insightId: savedInsight.id, model: FINANCE_AI_MODEL, streamed: true, ...requestMeta },
        });

        logger.info("INSIGHTS_STREAM_DONE", {
          requestId,
          datasetId: dataset.id,
          insightId: savedInsight.id,
          summaryLength: summaryText.length,
          anomalyCount: anomalies.length,
        });

        emit({ type: "step", message: "Analysis complete", status: "done" });
        emit({ type: "done", insightId: savedInsight.id, insight: { ...savedInsight, insightJson: insightPayload } });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unexpected error during analysis";
        logger.error("INSIGHTS_STREAM_ERROR", { requestId, datasetId: dataset.id, message });
        emit({ type: "error", message, code: "STREAM_ERROR" });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
