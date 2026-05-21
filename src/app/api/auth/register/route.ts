import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { AUTH_COOKIE_NAME, AUTH_TOKEN_MAX_AGE_SECONDS, signToken } from "@/lib/auth";
import { getAuditRequestMeta, logAudit } from "@/lib/audit";
import { errorResponseWithRequestId, getRequestId, jsonWithRequestId } from "@/lib/http";

const registerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
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
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return errorResponseWithRequestId(requestId, 400, "BAD_REQUEST", "Invalid JSON body");
    }
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponseWithRequestId(
        requestId,
        400,
        "VALIDATION_ERROR",
        parsed.error.issues[0]?.message ?? "Invalid input",
      );
    }

    const { name, email, password } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      await logAudit({
        userId: existing.id,
        action: "REGISTER_FAIL",
        entityType: "Auth",
        entityId: existing.id,
        meta: {
          reason: "EMAIL_IN_USE",
          email,
          ...requestMeta,
        },
      });
      return errorResponseWithRequestId(requestId, 409, "EMAIL_IN_USE", "Email is already registered");
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    const token = signToken(user);

    await logAudit({
      userId: user.id,
      action: "REGISTER_SUCCESS",
      entityType: "Auth",
      entityId: user.id,
      meta: requestMeta,
    });

    const response = jsonWithRequestId(requestId, { token, user }, { status: 201 });
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
    console.error("REGISTER_ERROR", err);
    return errorResponseWithRequestId(requestId, 500, "INTERNAL_SERVER_ERROR", "Something went wrong");
  }
}
