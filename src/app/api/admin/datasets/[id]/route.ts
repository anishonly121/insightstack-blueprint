import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { enforceCsrfIfCookieAuth } from "@/lib/csrf";
import { requireAdmin } from "@/lib/requireRole";
import { getAuditRequestMeta, logAudit } from "@/lib/audit";
import { errorResponseWithRequestId, getRequestId, jsonWithRequestId } from "@/lib/http";

const idSchema = z.string().uuid("Invalid dataset id");

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
    const requestMeta = getAuditRequestMeta(req);
    const admin = await requireAdmin(req);
    if (admin.error) {
      return admin.error;
    }

    const { id } = await params;
    const parsedId = idSchema.safeParse(id);

    if (!parsedId.success) {
      return errorResponseWithRequestId(requestId, 400, "VALIDATION_ERROR", "Invalid dataset id");
    }

    const existing = await prisma.dataset.findUnique({
      where: { id: parsedId.data },
      select: { id: true },
    });

    if (!existing) {
      return errorResponseWithRequestId(requestId, 404, "NOT_FOUND", "Dataset not found");
    }

    await prisma.dataset.delete({ where: { id: existing.id } });

    await logAudit({
      userId: admin.user.id,
      action: "ADMIN_ACTION",
      entityType: "Dataset",
      entityId: existing.id,
      meta: {
        operation: "DELETE_DATASET",
        ...requestMeta,
      },
    });

    return jsonWithRequestId(requestId, { data: { id: existing.id } });
  } catch {
    return errorResponseWithRequestId(requestId, 500, "INTERNAL_SERVER_ERROR", "Something went wrong");
  }
}
