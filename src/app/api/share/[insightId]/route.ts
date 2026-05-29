import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getRequestId, jsonWithRequestId, errorResponseWithRequestId } from "@/lib/http";

const idSchema = z.string().uuid();

export async function GET(
  req: Request,
  { params }: { params: Promise<{ insightId: string }> },
): Promise<NextResponse> {
  const requestId = getRequestId(req);
  const { insightId } = await params;

  if (!idSchema.safeParse(insightId).success) {
    return errorResponseWithRequestId(requestId, 400, "VALIDATION_ERROR", "Invalid insight ID");
  }

  const insight = await prisma.insight.findFirst({
    where: { id: insightId, shared: true },
    select: {
      id: true, createdAt: true, model: true, insightText: true, insightJson: true,
      dataset: { select: { name: true } },
    },
  });

  if (!insight) {
    return errorResponseWithRequestId(requestId, 404, "NOT_FOUND", "Insight not found or not shared");
  }

  return jsonWithRequestId(requestId, {
    data: {
      id: insight.id,
      createdAt: insight.createdAt.toISOString(),
      model: insight.model,
      insightText: insight.insightText,
      insightJson: insight.insightJson,
      datasetName: insight.dataset.name,
    },
  });
}
