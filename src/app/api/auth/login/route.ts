import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { AUTH_COOKIE_NAME, AUTH_TOKEN_MAX_AGE_SECONDS, signToken } from "@/lib/auth";
import { getRequestIp, rateLimitOrThrow } from "@/lib/rateLimit";
import { getAuditRequestMeta, logAudit } from "@/lib/audit";
import { errorResponseWithRequestId, getRequestId, jsonWithRequestId } from "@/lib/http";

const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password is required"),
});

export async function POST(req: Request): Promise<NextResponse> {
  const requestId = getRequestId(req);
  try {
    const contentType = (req.headers.get("content-type") ?? "").toLowerCase();
    if (!contentType.includes("application/json")) {
      return errorResponseWithRequestId(
        requestId,
        415,
        "UNSUPPORTED_MEDIA_TYPE",
        "Content-Type must be application/json",
      );
    }

    const requestMeta = getAuditRequestMeta(req);
    const ip = getRequestIp(req);
    const { allowed } = await rateLimitOrThrow({
      key: `auth:login:${ip}`,
      limit: 10,
      windowMs: 60 * 1000,
    });
    if (!allowed) {
      return errorResponseWithRequestId(
        requestId,
        429,
        "RATE_LIMITED",
        "Too many requests. Try again later.",
      );
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return errorResponseWithRequestId(requestId, 400, "BAD_REQUEST", "Invalid JSON body");
    }
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponseWithRequestId(
        requestId,
        400,
        "VALIDATION_ERROR",
        parsed.error.issues[0]?.message ?? "Invalid input",
      );
    }

    const { email, password } = parsed.data;

    const dbUser = await prisma.user.findUnique({ where: { email } });
    if (!dbUser) {
      return errorResponseWithRequestId(
        requestId,
        401,
        "INVALID_CREDENTIALS",
        "Invalid email or password",
      );
    }

    const isValid = await bcrypt.compare(password, dbUser.passwordHash);
    if (!isValid) {
      await logAudit({
        userId: dbUser.id,
        action: "LOGIN_FAIL",
        entityType: "Auth",
        entityId: dbUser.id,
        meta: {
          reason: "INVALID_CREDENTIALS",
          ...requestMeta,
        },
      });
      return errorResponseWithRequestId(
        requestId,
        401,
        "INVALID_CREDENTIALS",
        "Invalid email or password",
      );
    }

    const user = {
      id: dbUser.id,
      name: dbUser.name,
      email: dbUser.email,
      role: dbUser.role,
    };

    const token = signToken(user);

    await logAudit({
      userId: user.id,
      action: "LOGIN_SUCCESS",
      entityType: "Auth",
      entityId: user.id,
      meta: requestMeta,
    });

    const response = jsonWithRequestId(requestId, { token, user });
    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
      maxAge: AUTH_TOKEN_MAX_AGE_SECONDS,
    });

    return response;
  } catch (err) {
    console.error("LOGIN_ERROR", err);
    return errorResponseWithRequestId(requestId, 500, "INTERNAL_SERVER_ERROR", "Something went wrong");
  }
}
