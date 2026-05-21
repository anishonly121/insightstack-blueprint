import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";
import { enforceCsrfIfCookieAuth } from "@/lib/csrf";
import { getAuditRequestMeta, logAudit } from "@/lib/audit";
import { errorResponseWithRequestId, getRequestId, jsonWithRequestId } from "@/lib/http";

const renameDatasetSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
});

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
      where: {
        id: parsedId.data,
        userId: user.id,
      },
      select: {
        id: true,
        userId: true,
        name: true,
        status: true,
        originalFilename: true,
        rowCount: true,
        previewJson: true,
        createdAt: true,
        insights: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            createdAt: true,
            model: true,
            insightText: true,
            insightJson: true,
          },
        },
      },
    });

    if (!dataset) {
      return errorResponseWithRequestId(requestId, 404, "NOT_FOUND", "Dataset not found");
    }

    const txStats = await prisma.transaction.aggregate({
      where: { datasetId: dataset.id },
      _count: { id: true },
      _sum: { amount: true },
      _avg: { amount: true },
    });

    return jsonWithRequestId(requestId, {
      data: {
        ...dataset,
        transactionStats: {
          count: txStats._count.id,
          totalAmount: txStats._sum.amount?.toString() ?? "0",
          averageAmount: txStats._avg.amount?.toString() ?? "0",
        },
      },
    });
  } catch {
    return errorResponseWithRequestId(requestId, 500, "INTERNAL_SERVER_ERROR", "Something went wrong");
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const requestId = getRequestId(req);
  const csrfError = enforceCsrfIfCookieAuth(req, requestId);
  if (csrfError) return csrfError;

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

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return errorResponseWithRequestId(requestId, 400, "BAD_REQUEST", "Invalid JSON body");
    }

    const parsed = renameDatasetSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponseWithRequestId(
        requestId,
        400,
        "VALIDATION_ERROR",
        parsed.error.issues[0]?.message ?? "Invalid input",
      );
    }

    const dataset = await prisma.dataset.findFirst({
      where: { id: parsedId.data, userId: user.id },
      select: { id: true },
    });

    if (!dataset) {
      return errorResponseWithRequestId(requestId, 404, "NOT_FOUND", "Dataset not found");
    }

    const updated = await prisma.dataset.update({
      where: { id: dataset.id },
      data: { name: parsed.data.name },
      select: { id: true, name: true, status: true, rowCount: true, createdAt: true },
    });

    const requestMeta = getAuditRequestMeta(req);
    await logAudit({
      userId: user.id,
      action: "DATASET_RENAMED",
      entityType: "Dataset",
      entityId: dataset.id,
      meta: { name: parsed.data.name, ...requestMeta },
    });

    return jsonWithRequestId(requestId, { data: updated });
  } catch {
    return errorResponseWithRequestId(requestId, 500, "INTERNAL_SERVER_ERROR", "Something went wrong");
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const requestId = getRequestId(req);
  const csrfError = enforceCsrfIfCookieAuth(req, requestId);
  if (csrfError) {
    return csrfError;
  }
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
      where: {
        id: parsedId.data,
        userId: user.id,
      },
      select: { id: true },
    });

    if (!dataset) {
      return errorResponseWithRequestId(requestId, 404, "NOT_FOUND", "Dataset not found");
    }

    await prisma.dataset.delete({ where: { id: dataset.id } });

    return jsonWithRequestId(requestId, { data: { id: dataset.id } });
  } catch {
    return errorResponseWithRequestId(requestId, 500, "INTERNAL_SERVER_ERROR", "Something went wrong");
  }
}
