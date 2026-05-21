import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";
import { errorResponseWithRequestId, getRequestId, jsonWithRequestId } from "@/lib/http";

export async function GET(req: Request): Promise<NextResponse> {
  const requestId = getRequestId(req);
  try {
    await prisma.user.count();

    const user = await getUserFromRequest(req);
    const appName = process.env.NEXT_PUBLIC_APP_NAME ?? "App";

    return jsonWithRequestId(requestId, {
      appName,
      database: "ok",
      user,
    });
  } catch {
    return errorResponseWithRequestId(requestId, 500, "HEALTH_CHECK_FAILED", "Health check failed");
  }
}
