import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";
import { enforceCsrfIfCookieAuth } from "@/lib/csrf";
import { getRequestIp, rateLimitOrThrow } from "@/lib/rateLimit";
import { env } from "@/lib/env";
import { getRequestId, errorResponseWithRequestId } from "@/lib/http";
import { logger } from "@/lib/logger";
import { computeMetrics, detectAnomalies } from "@/lib/metrics";

const idSchema = z.string().uuid("Invalid dataset id");
const CHAT_MODEL = "gpt-4o-mini";
const MAX_HISTORY = 10; // keep last N exchanges to stay within token limits

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
        } catch { /* skip */ }
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
    select: { id: true, name: true },
  });
  if (!dataset) return errorResponseWithRequestId(requestId, 404, "NOT_FOUND", "Dataset not found");

  const apiKey = env.OPENAI_API_KEY;
  if (!apiKey) return errorResponseWithRequestId(requestId, 500, "OPENAI_KEY_MISSING", "OPENAI_API_KEY is not configured");

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

  const isStubbed = process.env.NODE_ENV === "test" || apiKey === "test";

  // Get latest metrics snapshot from cache, or compute fresh
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const cachedSnapshot = await prisma.metricSnapshot.findFirst({
    where: { datasetId: dataset.id, computedAt: { gte: oneHourAgo } },
    orderBy: { computedAt: "desc" },
    select: { metricsJson: true },
  });

  let metricsContext: string;
  if (cachedSnapshot?.metricsJson) {
    metricsContext = JSON.stringify(cachedSnapshot.metricsJson, null, 2);
  } else {
    const transactions = await prisma.transaction.findMany({
      where: { datasetId: dataset.id },
      select: { date: true, category: true, amount: true, description: true },
    });
    const metrics = computeMetrics(transactions);
    const anomalies = detectAnomalies(transactions);
    metricsContext = JSON.stringify({ ...metrics, anomalies }, null, 2);
  }

  const systemPrompt =
    `You are a personal finance analyst assistant for InsightStack. ` +
    `The user is asking about their dataset: "${dataset.name}".\n\n` +
    `Here are the EXACT pre-computed financial metrics for this dataset:\n\n` +
    `\`\`\`json\n${metricsContext}\n\`\`\`\n\n` +
    `Rules:\n` +
    `- Answer using ONLY data from the metrics above. Reference exact figures.\n` +
    `- If something cannot be answered from this data, say so honestly.\n` +
    `- Keep answers concise: 2-4 sentences unless more detail is clearly needed.\n` +
    `- Never invent numbers, trends, or patterns not present in the data.\n` +
    `- Respond in plain text, no markdown.`;

  const messages = [
    { role: "system" as const, content: systemPrompt },
    ...body.history.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
    { role: "user" as const, content: body.message },
  ];

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const emit = (event: StreamEvent) => controller.enqueue(encode(event));

      try {
        if (isStubbed) {
          const reply = `Based on your dataset "${dataset.name}", I can see the computed metrics. Ask me anything about your spending patterns, categories, or anomalies.`;
          for (const word of reply.split(" ")) {
            emit({ type: "delta", text: word + " " });
            await new Promise((r) => setTimeout(r, 30));
          }
          emit({ type: "done" });
          controller.close();
          return;
        }

        const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
          body: JSON.stringify({
            model: CHAT_MODEL,
            temperature: 0.4,
            stream: true,
            max_tokens: 400,
            messages,
          }),
        });

        if (!openaiRes.ok || !openaiRes.body) {
          emit({ type: "error", message: "AI service temporarily unavailable. Try again in a moment." });
          controller.close();
          return;
        }

        for await (const chunk of parseOpenAiStream(openaiRes.body)) {
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
