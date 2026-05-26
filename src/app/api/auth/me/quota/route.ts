import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";
import { errorResponseWithRequestId, getRequestId, jsonWithRequestId } from "@/lib/http";

const DAILY_INSIGHTS_QUOTA = 30;

function getUtcDayWindow() {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start, end };
}

export async function GET(req: Request): Promise<NextResponse> {
  const requestId = getRequestId(req);
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return errorResponseWithRequestId(requestId, 401, "UNAUTHORIZED", "Not authenticated");
    }

    const { start, end } = getUtcDayWindow();
    const insightsToday = await prisma.auditLog.count({
      where: {
        userId: user.id,
        action: "INSIGHTS_GENERATE",
        createdAt: { gte: start, lt: end },
      },
    });

    return jsonWithRequestId(requestId, {
      data: {
        insightsToday,
        quota: DAILY_INSIGHTS_QUOTA,
        remaining: Math.max(0, DAILY_INSIGHTS_QUOTA - insightsToday),
      },
    });
  } catch {
    return errorResponseWithRequestId(requestId, 500, "INTERNAL_SERVER_ERROR", "Something went wrong");
  }
}
