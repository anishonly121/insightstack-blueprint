import type { NextResponse } from "next/server";
import { createHash } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";
import { enforceCsrfIfCookieAuth } from "@/lib/csrf";
import { getRequestIp, rateLimitOrThrow } from "@/lib/rateLimit";
import { getAuditRequestMeta, logAudit } from "@/lib/audit";
import { env } from "@/lib/env";
import { getRequestId, errorResponseWithRequestId } from "@/lib/http";
import { logger } from "@/lib/logger";
import { computeMetrics, detectAnomalies, type MetricsJson, type AnomalyStat, type CategoryStat } from "@/lib/metrics";
import { getInsightsQuota } from "@/lib/subscription";

const idSchema = z.string().uuid("Invalid dataset id");
const INSIGHTS_MODEL = "gpt-4o-mini";
const INSIGHTS_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

type StreamEvent =
  | { type: "step"; message: string; status: "running" | "done" }
  | { type: "delta"; text: string }
  | { type: "done"; insightId: string; insight: object }
  | { type: "error"; message: string; code?: string };

function encode(event: StreamEvent): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify(event)}\n\n`);
}

function buildSmartRecommendations(
  metrics: MetricsJson,
  anomalies: AnomalyStat[],
): [string, string, string] {
  const recs: string[] = [];
  const topCat = metrics.topCategories[0];

  if (topCat && metrics.totalExpenses > 0) {
    const pct = ((Math.abs(topCat.total) / metrics.totalExpenses) * 100).toFixed(0);
    recs.push(
      `Set a monthly cap for ${topCat.category} — it represents ${pct}% of your total expenses at $${Math.abs(topCat.total).toFixed(2)}.`,
    );
  }

  if (anomalies.length > 0) {
    const total = anomalies.reduce((s, a) => s + Math.abs(a.amount), 0);
    recs.push(
      `Review ${anomalies.length} high-value transaction${anomalies.length > 1 ? "s" : ""} totalling $${total.toFixed(2)} — confirm each was intended.`,
    );
  }

  if (metrics.totalIncome > 0) {
    if (metrics.savingsRate < 20) {
      const gap = topCat ? `Cutting ${topCat.category} by 15% would add $${(Math.abs(topCat.total) * 0.15).toFixed(2)} to savings.` : "";
      recs.push(`Your savings rate is ${metrics.savingsRate.toFixed(1)}% — below the recommended 20%. ${gap}`.trim());
    } else {
      recs.push(
        `Your ${metrics.savingsRate.toFixed(1)}% savings rate is healthy. Consider moving the surplus into an index fund rather than leaving it in cash.`,
      );
    }
  }

  const fallbacks = [
    "Track spending weekly — catching category creep early is easier than reversing it.",
    "Audit recurring subscriptions quarterly; unused ones are silent budget drains.",
    "Automate a fixed savings transfer on payday so saving happens before spending.",
  ];
  while (recs.length < 3) recs.push(fallbacks[recs.length]!);
  return [recs[0]!, recs[1]!, recs[2]!];
}

function buildCategoryReason(cat: CategoryStat, totalExpenses: number): string {
  const abs = Math.abs(cat.total);
  const pct = totalExpenses > 0 ? ((abs / totalExpenses) * 100).toFixed(0) : "0";
  return `$${abs.toFixed(2)} across ${cat.count} transaction${cat.count !== 1 ? "s" : ""} — ${pct}% of total expenses.`;
}

function buildAnomalyReason(a: AnomalyStat): string {
  return `${a.zScore.toFixed(1)} standard deviations above your average spend — statistically significant.`;
}

async function* parseOpenAiStream(body: ReadableStream<Uint8Array>): AsyncGenerator<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const data = line.slice(6).trim();
        if (data === "[DONE]") return;
        try {
          const chunk = JSON.parse(data) as { choices?: Array<{ delta?: { content?: string } }> };
          const text = chunk.choices?.[0]?.delta?.content;
          if (text) yield text;
        } catch { /* skip malformed chunks */ }
      }
    }
  } finally {
    reader.releaseLock();
  }
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

  const apiKey = env.OPENAI_API_KEY;
  if (!apiKey) return errorResponseWithRequestId(requestId, 500, "OPENAI_KEY_MISSING", "OPENAI_API_KEY is not configured");

  const ip = getRequestIp(req);
  const requestMeta = getAuditRequestMeta(req);
  const isStubbed = process.env.NODE_ENV === "test" || apiKey === "test";

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
          .update(JSON.stringify({ datasetId: dataset.id, model: INSIGHTS_MODEL, metrics, anomalies }))
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

        emit({ type: "step", message: "Sending exact metrics to AI — requesting narrative analysis…", status: "running" });

        const recommendations = buildSmartRecommendations(metrics, anomalies);

        let summaryText = "";

        if (isStubbed) {
          const top = metrics.topCategories[0];
          summaryText = `Analysed ${metrics.transactionCount} transactions totalling $${metrics.totalExpenses.toFixed(2)} in expenses. ` +
            (top ? `Your largest category is ${top.category} at $${Math.abs(top.total).toFixed(2)}. ` : "") +
            `Savings rate: ${metrics.savingsRate.toFixed(1)}%.`;

          for (const word of summaryText.split(" ")) {
            emit({ type: "delta", text: word + " " });
            await new Promise((r) => setTimeout(r, 30));
          }
        } else {
          const metricsPrompt = JSON.stringify({
            datasetName: dataset.name,
            totalIncome: metrics.totalIncome,
            totalExpenses: metrics.totalExpenses,
            netSavings: metrics.netSavings,
            savingsRate: `${metrics.savingsRate.toFixed(1)}%`,
            transactionCount: metrics.transactionCount,
            topCategories: metrics.topCategories.slice(0, 5).map((c) => ({
              category: c.category,
              total: `$${Math.abs(c.total).toFixed(2)}`,
              transactions: c.count,
            })),
            statisticalAnomalies: anomalies.map((a) => ({
              date: a.date,
              description: a.description,
              amount: `$${Math.abs(a.amount).toFixed(2)}`,
              standardDeviationsAboveAverage: a.zScore.toFixed(1),
            })),
          });

          const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
            body: JSON.stringify({
              model: INSIGHTS_MODEL,
              temperature: 0.4,
              stream: true,
              messages: [
                {
                  role: "system",
                  content:
                    "You are a personal finance analyst. Write a clear, direct 2-3 paragraph analysis using ONLY the exact figures provided. " +
                    "No JSON, no lists, no headers, no markdown — flowing narrative only. " +
                    "Reference specific dollar amounts and percentages. Start immediately with the analysis.",
                },
                { role: "user", content: metricsPrompt },
              ],
            }),
          });

          if (!openaiRes.ok || !openaiRes.body) {
            emit({ type: "step", message: "AI unavailable — using computed analysis", status: "done" });
            const top = metrics.topCategories[0];
            summaryText = `Analysed ${metrics.transactionCount} transactions totalling $${metrics.totalExpenses.toFixed(2)} in expenses. ` +
              (top ? `Top category: ${top.category} at $${Math.abs(top.total).toFixed(2)}. ` : "") +
              `Savings rate: ${metrics.savingsRate.toFixed(1)}%.`;
            emit({ type: "delta", text: summaryText });
          } else {
            emit({ type: "step", message: "Streaming AI analysis…", status: "running" });
            for await (const chunk of parseOpenAiStream(openaiRes.body)) {
              summaryText += chunk;
              emit({ type: "delta", text: chunk });
            }
          }
        }

        emit({ type: "step", message: "Saving insight to database…", status: "running" });

        const insightPayload = {
          summary: summaryText.trim(),
          topSpendingCategories: metrics.topCategories.slice(0, 5).map((cat) => ({
            category: cat.category,
            amount: Math.abs(cat.total),
            reason: buildCategoryReason(cat, metrics.totalExpenses),
          })),
          anomalies: anomalies.map((a) => ({
            date: a.date,
            description: a.description,
            category: a.category,
            amount: a.amount,
            reason: buildAnomalyReason(a),
          })),
          recommendations,
        };

        const savedInsight = await prisma.insight.create({
          data: {
            datasetId: dataset.id,
            model: isStubbed ? "stub-test-v1" : INSIGHTS_MODEL,
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
          meta: { insightId: savedInsight.id, model: isStubbed ? "stub-test-v1" : INSIGHTS_MODEL, streamed: true, ...requestMeta },
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
