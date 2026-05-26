import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { AUTH_COOKIE_NAME, getTokenFromRequest, getUserFromRequest } from "@/lib/auth";
import { getAuditRequestMeta, logAudit } from "@/lib/audit";
import { enforceCsrfIfCookieAuth } from "@/lib/csrf";
import { errorResponseWithRequestId, getRequestId, jsonWithRequestId } from "@/lib/http";
import { logger } from "@/lib/logger";

export async function GET(req: Request): Promise<NextResponse> {
  const requestId = getRequestId(req);
  try {
    const token = getTokenFromRequest(req);
    if (!token) {
      return errorResponseWithRequestId(requestId, 401, "UNAUTHORIZED", "Missing or invalid token");
    }

    const user = await getUserFromRequest(req);

    if (!user) {
      return errorResponseWithRequestId(requestId, 401, "UNAUTHORIZED", "Missing or invalid token");
    }

    return jsonWithRequestId(requestId, { token, user });
  } catch {
    return errorResponseWithRequestId(requestId, 500, "INTERNAL_SERVER_ERROR", "Something went wrong");
  }
}

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
});

export async function PATCH(req: Request): Promise<NextResponse> {
  const requestId = getRequestId(req);
  try {
    const csrfError = enforceCsrfIfCookieAuth(req, requestId);
    if (csrfError) return csrfError;

    const contentType = (req.headers.get("content-type") ?? "").toLowerCase();
    if (!contentType.includes("application/json")) {
      return errorResponseWithRequestId(requestId, 415, "UNSUPPORTED_MEDIA_TYPE", "Content-Type must be application/json");
    }

    const user = await getUserFromRequest(req);
    if (!user) return errorResponseWithRequestId(requestId, 401, "UNAUTHORIZED", "Not authenticated");

    let body: unknown;
    try { body = await req.json(); } catch {
      return errorResponseWithRequestId(requestId, 400, "BAD_REQUEST", "Invalid JSON body");
    }

    const parsed = changePasswordSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponseWithRequestId(requestId, 400, "VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid input");
    }

    const { currentPassword, newPassword } = parsed.data;

    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    if (!dbUser) return errorResponseWithRequestId(requestId, 404, "NOT_FOUND", "User not found");

    const passwordMatch = await bcrypt.compare(currentPassword, dbUser.passwordHash);
    if (!passwordMatch) {
      return errorResponseWithRequestId(requestId, 400, "INVALID_CREDENTIALS", "Current password is incorrect");
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash: newHash } });

    await logAudit({
      userId: user.id,
      action: "PASSWORD_CHANGED",
      entityType: "User",
      entityId: user.id,
      meta: getAuditRequestMeta(req),
    });

    return jsonWithRequestId(requestId, { data: { ok: true } });
  } catch (err) {
    logger.error("CHANGE_PASSWORD_ERROR", { errorName: err instanceof Error ? err.name : "UnknownError" });
    return errorResponseWithRequestId(requestId, 500, "INTERNAL_SERVER_ERROR", "Something went wrong");
  }
}

const deleteAccountSchema = z.object({
  password: z.string().min(1, "Password is required to confirm deletion"),
});

export async function DELETE(req: Request): Promise<NextResponse> {
  const requestId = getRequestId(req);
  try {
    const csrfError = enforceCsrfIfCookieAuth(req, requestId);
    if (csrfError) return csrfError;

    const contentType = (req.headers.get("content-type") ?? "").toLowerCase();
    if (!contentType.includes("application/json")) {
      return errorResponseWithRequestId(requestId, 415, "UNSUPPORTED_MEDIA_TYPE", "Content-Type must be application/json");
    }

    const user = await getUserFromRequest(req);
    if (!user) return errorResponseWithRequestId(requestId, 401, "UNAUTHORIZED", "Not authenticated");

    let body: unknown;
    try { body = await req.json(); } catch {
      return errorResponseWithRequestId(requestId, 400, "BAD_REQUEST", "Invalid JSON body");
    }

    const parsed = deleteAccountSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponseWithRequestId(requestId, 400, "VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid input");
    }

    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    if (!dbUser) return errorResponseWithRequestId(requestId, 404, "NOT_FOUND", "User not found");

    const passwordMatch = await bcrypt.compare(parsed.data.password, dbUser.passwordHash);
    if (!passwordMatch) {
      return errorResponseWithRequestId(requestId, 400, "INVALID_CREDENTIALS", "Password is incorrect");
    }

    // Cascade delete — Prisma schema handles related rows
    await prisma.user.delete({ where: { id: user.id } });

    const response = jsonWithRequestId(requestId, { data: { ok: true } });
    response.cookies.set(AUTH_COOKIE_NAME, "", { maxAge: 0, path: "/" });
    return response;
  } catch (err) {
    logger.error("DELETE_ACCOUNT_ERROR", { errorName: err instanceof Error ? err.name : "UnknownError" });
    return errorResponseWithRequestId(requestId, 500, "INTERNAL_SERVER_ERROR", "Something went wrong");
  }
}
