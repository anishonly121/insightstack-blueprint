import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/requireRole";
import { getAuditRequestMeta, logAudit } from "@/lib/audit";
import { errorResponseWithRequestId, getRequestId, jsonWithRequestId } from "@/lib/http";

export async function GET(req: Request): Promise<NextResponse> {
  const requestId = getRequestId(req);
  try {
    const requestMeta = getAuditRequestMeta(req);
    const admin = await requireAdmin(req);
    if (admin.error) {
      return admin.error;
    }

    const datasets = await prisma.dataset.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        status: true,
        rowCount: true,
        originalFilename: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    await logAudit({
      userId: admin.user.id,
      action: "ADMIN_ACTION",
      entityType: "Admin",
      meta: {
        operation: "LIST_DATASETS",
        ...requestMeta,
      },
    });

    return jsonWithRequestId(requestId, { data: datasets });
  } catch {
    return errorResponseWithRequestId(requestId, 500, "INTERNAL_SERVER_ERROR", "Something went wrong");
  }
}
