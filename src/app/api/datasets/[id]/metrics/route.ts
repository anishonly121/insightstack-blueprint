import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";
import { errorResponseWithRequestId, getRequestId, jsonWithRequestId } from "@/lib/http";
import { computeMetrics } from "@/lib/metrics";

export type { MetricsJson } from "@/lib/metrics";

const idSchema = z.string().uuid("Invalid dataset id");

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const requestId = getRequestId(req);
  try {
    const { id } = await params;
    const user = await getUserFromRequest(req);
    if (!user) {
      return errorResponseWithRequestId(requestId, 401, "UNAUTHORIZED", "Missing or invalid token");
    }

    const parsedId = idSchema.safeParse(id);
    if (!parsedId.success) {
      return errorResponseWithRequestId(requestId, 400, "VALIDATION_ERROR", "Invalid dataset id");
    }

    const dataset = await prisma.dataset.findFirst({
      where: { id: parsedId.data, userId: user.id },
      select: { id: true, status: true },
    });

    if (!dataset) {
      return errorResponseWithRequestId(requestId, 404, "NOT_FOUND", "Dataset not found");
    }

    // Return cached snapshot if computed within the last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const cached = await prisma.metricSnapshot.findFirst({
      where: { datasetId: dataset.id, computedAt: { gte: oneHourAgo } },
      orderBy: { computedAt: "desc" },
      select: { id: true, computedAt: true, metricsJson: true },
    });

    if (cached) {
      return jsonWithRequestId(requestId, {
        data: { ...cached, cached: true },
      });
    }

    const transactions = await prisma.transaction.findMany({
      where: { datasetId: dataset.id },
      select: { date: true, category: true, amount: true },
    });

    const metrics = computeMetrics(transactions);

    const snapshot = await prisma.metricSnapshot.create({
      data: {
        datasetId: dataset.id,
        metricsJson: metrics as unknown as Prisma.InputJsonValue,
      },
      select: { id: true, computedAt: true, metricsJson: true },
    });

    return jsonWithRequestId(requestId, {
      data: { ...snapshot, cached: false },
    });
  } catch {
    return errorResponseWithRequestId(requestId, 500, "INTERNAL_SERVER_ERROR", "Something went wrong");
  }
}
