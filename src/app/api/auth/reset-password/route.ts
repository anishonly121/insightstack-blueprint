import { createHash } from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getRequestIp, rateLimitOrThrow } from "@/lib/rateLimit";
import { getAuditRequestMeta, logAudit } from "@/lib/audit";
import { errorResponseWithRequestId, getRequestId, jsonWithRequestId } from "@/lib/http";

const resetPasswordSchema = z.object({
  email: z.string().email("Invalid email"),
  token: z.string().min(1, "Token is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
});

const hashToken = (rawToken: string): string => {
  return createHash("sha256").update(rawToken).digest("hex");
};

export async function POST(req: Request): Promise<NextResponse> {
  const requestId = getRequestId(req);
  try {
    const requestMeta = getAuditRequestMeta(req);
    const ip = getRequestIp(req);
    const { allowed } = await rateLimitOrThrow({
      key: `auth:reset-password:${ip}`,
      limit: 5,
      windowMs: 10 * 60 * 1000,
    });
    if (!allowed) {
      return errorResponseWithRequestId(
        requestId,
        429,
        "RATE_LIMITED",
        "Too many requests. Try again later.",
      );
    }

    const contentType = (req.headers.get("content-type") ?? "").toLowerCase();
    if (!contentType.includes("application/json")) {
      return errorResponseWithRequestId(
        requestId,
        415,
        "UNSUPPORTED_MEDIA_TYPE",
        "Content-Type must be application/json",
      );
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return errorResponseWithRequestId(requestId, 400, "BAD_REQUEST", "Invalid JSON body");
    }
    const parsed = resetPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponseWithRequestId(
        requestId,
        400,
        "VALIDATION_ERROR",
        parsed.error.issues[0]?.message ?? "Invalid input",
      );
    }

    const email = parsed.data.email.toLowerCase().trim();
    const tokenHash = hashToken(parsed.data.token);

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (!user) {
      return errorResponseWithRequestId(requestId, 400, "INVALID_TOKEN", "Invalid reset token");
    }

    const resetToken = await prisma.passwordResetToken.findFirst({
      where: {
        userId: user.id,
        tokenHash,
        usedAt: null,
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        expiresAt: true,
      },
    });

    if (!resetToken) {
      await logAudit({
        userId: user.id,
        action: "RESET_PASSWORD_FAIL",
        entityType: "Auth",
        entityId: user.id,
        meta: {
          reason: "INVALID_TOKEN",
          ...requestMeta,
        },
      });
      return errorResponseWithRequestId(requestId, 400, "INVALID_TOKEN", "Invalid reset token");
    }

    if (resetToken.expiresAt.getTime() <= Date.now()) {
      await logAudit({
        userId: user.id,
        action: "RESET_PASSWORD_FAIL",
        entityType: "Auth",
        entityId: user.id,
        meta: {
          reason: "TOKEN_EXPIRED",
          ...requestMeta,
        },
      });
      return errorResponseWithRequestId(requestId, 400, "TOKEN_EXPIRED", "Reset token has expired");
    }

    const passwordHash = await bcrypt.hash(parsed.data.newPassword, 10);

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: { passwordHash },
      });

      await tx.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      });
    });

    await logAudit({
      userId: user.id,
      action: "RESET_PASSWORD_SUCCESS",
      entityType: "Auth",
      entityId: user.id,
      meta: requestMeta,
    });

    return jsonWithRequestId(requestId, { data: { ok: true } });
  } catch (err) {
    console.error("RESET_PASSWORD_ERROR", err);
    return errorResponseWithRequestId(requestId, 500, "INTERNAL_SERVER_ERROR", "Something went wrong");
  }
}
