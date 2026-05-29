import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";
import { enforceCsrfIfCookieAuth } from "@/lib/csrf";
import { getRequestId, jsonWithRequestId, errorResponseWithRequestId } from "@/lib/http";

const idSchema = z.string().uuid();

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string; insightId: string }> },
): Promise<NextResponse> {
  const requestId = getRequestId(req);
  const csrfError = enforceCsrfIfCookieAuth(req, requestId);
  if (csrfError) return csrfError;

  const user = await getUserFromRequest(req);
  if (!user) return errorResponseWithRequestId(requestId, 401, "UNAUTHORIZED", "Missing or invalid token");

  const { id: datasetId, insightId } = await params;
  if (!idSchema.safeParse(datasetId).success || !idSchema.safeParse(insightId).success) {
    return errorResponseWithRequestId(requestId, 400, "VALIDATION_ERROR", "Invalid IDs");
  }

  // Verify ownership
  const insight = await prisma.insight.findFirst({
    where: { id: insightId, datasetId, dataset: { userId: user.id } },
    select: { id: true, shared: true },
  });
  if (!insight) return errorResponseWithRequestId(requestId, 404, "NOT_FOUND", "Insight not found");

  const toggled = await prisma.insight.update({
    where: { id: insightId },
    data: { shared: !insight.shared },
    select: { id: true, shared: true },
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://insightstack-peach.vercel.app";

  return jsonWithRequestId(requestId, {
    data: {
      shared: toggled.shared,
      url: toggled.shared ? `${appUrl}/share/${insightId}` : null,
    },
  });
}
