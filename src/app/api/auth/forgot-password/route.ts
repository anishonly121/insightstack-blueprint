import { createHash, randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { sendResetPasswordTemplateEmail } from "@/lib/mail";
import { prisma } from "@/lib/prisma";
import { getRequestIp, rateLimitOrThrow } from "@/lib/rateLimit";
import { getAuditRequestMeta, logAudit } from "@/lib/audit";
import { errorResponseWithRequestId, getRequestId, jsonWithRequestId } from "@/lib/http";
import { logger } from "@/lib/logger";

const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email"),
});

const hashToken = (rawToken: string): string => {
  return createHash("sha256").update(rawToken).digest("hex");
};

const hashEmailForLog = (email: string): string => {
  return createHash("sha256").update(email).digest("hex");
};

const logSendGridError = (
  code: "SENDGRID_NOT_CONFIGURED" | "SENDGRID_SEND_FAILED",
  emailHash: string,
  requestMeta: Record<string, string>,
  err?: unknown,
): void => {
  logger.error("FORGOT_PASSWORD_SENDGRID_ERROR", {
    code,
    emailHash,
    ip: requestMeta.ip,
    userAgent: requestMeta.userAgent,
    errorName: err instanceof Error ? err.name : "UnknownError",
  });
};

export async function POST(req: Request): Promise<NextResponse> {
  const requestId = getRequestId(req);
  try {
    const requestMeta = getAuditRequestMeta(req);
    const ip = getRequestIp(req);
    const { allowed } = await rateLimitOrThrow({
      key: `auth:forgot-password:${ip}`,
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
    const parsed = forgotPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponseWithRequestId(
        requestId,
        400,
        "VALIDATION_ERROR",
        parsed.error.issues[0]?.message ?? "Invalid input",
      );
    }

    const email = parsed.data.email.toLowerCase().trim();
    const emailHash = hashEmailForLog(email);

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true },
    });

    if (user) {
      await logAudit({
        userId: user.id,
        action: "FORGOT_PASSWORD_REQUESTED",
        entityType: "Auth",
        entityId: user.id,
        meta: requestMeta,
      });
    }

    if (user) {
      const rawToken = randomBytes(48).toString("hex");
      const tokenHash = hashToken(rawToken);
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

      await prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash,
          expiresAt,
        },
      });

      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
      const resetLink = `${appUrl}/reset-password?token=${rawToken}&email=${encodeURIComponent(
        user.email,
      )}`;

      try {
        await sendResetPasswordTemplateEmail({
          to: user.email,
          name: user.name,
          resetLink,
        });
      } catch (err) {
        if (err instanceof Error && err.message === "SENDGRID_NOT_CONFIGURED") {
          logSendGridError("SENDGRID_NOT_CONFIGURED", emailHash, requestMeta, err);
          // Keep forgot-password behavior stable in local/dev even without SendGrid keys.
        } else {
          logSendGridError("SENDGRID_SEND_FAILED", emailHash, requestMeta, err);
          return errorResponseWithRequestId(
            requestId,
            502,
            "SENDGRID_SEND_FAILED",
            "Failed to send email",
          );
        }
      }
    }

    return jsonWithRequestId(requestId, { data: { ok: true } });
  } catch (err) {
    logger.error("FORGOT_PASSWORD_ERROR", { errorName: err instanceof Error ? err.name : "UnknownError" });
    return errorResponseWithRequestId(requestId, 500, "INTERNAL_SERVER_ERROR", "Something went wrong");
  }
}
