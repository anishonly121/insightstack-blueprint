import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";
import { enforceCsrfIfCookieAuth } from "@/lib/csrf";
import { getRequestIp, rateLimitOrThrow } from "@/lib/rateLimit";
import { getRequestId, errorResponseWithRequestId } from "@/lib/http";
import { logger } from "@/lib/logger";
import { computeMetrics, detectAnomalies } from "@/lib/metrics";
import { streamChatAnswer } from "@/lib/ai";
import { computeEnhancedStats } from "@/lib/ai";
import type { ChatContext } from "@/lib/ai";

const idSchema = z.string().uuid("Invalid dataset id");
const MAX_HISTORY = 10;

const bodySchema = z.object({
  message: z.string().min(1).max(500),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().max(2000),
      }),
    )
    .max(MAX_HISTORY)
    .default([]),
});

type StreamEvent =
  | { type: "delta"; text: string }
  | { type: "done" }
  | { type: "error"; message: string };

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
    select: { id: true, name: true },
  });
  if (!dataset) return errorResponseWithRequestId(requestId, 404, "NOT_FOUND", "Dataset not found");

  let body: z.infer<typeof bodySchema>;
  try {
    const raw = await req.json();
    const parsed = bodySchema.safeParse(raw);
    if (!parsed.success) {
      return errorResponseWithRequestId(requestId, 400, "VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid request body");
    }
    body = parsed.data;
  } catch {
    return errorResponseWithRequestId(requestId, 400, "BAD_REQUEST", "Invalid JSON body");
  }

  const ip = getRequestIp(req);
  try {
    await rateLimitOrThrow({ key: `datasets:chat:${dataset.id}:${user.id}:${ip}`, limit: 30, windowMs: 60_000 });
  } catch {
    return errorResponseWithRequestId(requestId, 429, "RATE_LIMITED", "Too many requests. Try again later.");
  }

  // Load metrics — from cache if available, otherwise compute fresh
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const cachedSnapshot = await prisma.metricSnapshot.findFirst({
    where: { datasetId: dataset.id, computedAt: { gte: oneHourAgo } },
    orderBy: { computedAt: "desc" },
    select: { metricsJson: true },
  });

  let ctx: ChatContext;
  if (cachedSnapshot?.metricsJson) {
    const metrics = cachedSnapshot.metricsJson as ReturnType<typeof computeMetrics>;
    ctx = {
      datasetName: dataset.name,
      metrics,
      anomalies: [],
      enhancedStats: computeEnhancedStats(metrics),
    };
  } else {
    const transactions = await prisma.transaction.findMany({
      where: { datasetId: dataset.id },
      select: { date: true, category: true, amount: true, description: true },
    });
    const metrics = computeMetrics(transactions);
    const anomalies = detectAnomalies(transactions);
    ctx = {
      datasetName: dataset.name,
      metrics,
      anomalies,
      enhancedStats: computeEnhancedStats(metrics),
    };
  }

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const emit = (event: StreamEvent) => controller.enqueue(encode(event));

      try {
        for await (const chunk of streamChatAnswer(body.message, body.history, ctx)) {
          emit({ type: "delta", text: chunk });
        }
        emit({ type: "done" });
        logger.info("CHAT_STREAM_DONE", { requestId, datasetId: dataset.id, messageLength: body.message.length });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unexpected error";
        logger.error("CHAT_STREAM_ERROR", { requestId, datasetId: dataset.id, message });
        emit({ type: "error", message: "Something went wrong. Please try again." });
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
