import "server-only";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

type RateLimitInput = {
  key: string;
  limit: number;
  windowMs: number;
};

const RATE_LIMIT_RETENTION_MS = 7 * 24 * 60 * 60 * 1000;
const CLEANUP_PROBABILITY = 0.01;

export const getRequestIp = (req: Request): string => {
  const forwarded = req.headers.get("x-forwarded-for") ?? "";
  const realIp = req.headers.get("x-real-ip") ?? "";
  const firstForwarded = forwarded.split(",")[0]?.trim();
  return firstForwarded || realIp || "unknown";
};

export async function cleanupExpiredRateLimitBuckets(): Promise<void> {
  const cutoff = new Date(Date.now() - RATE_LIMIT_RETENTION_MS);
  await prisma.rateLimitBucket.deleteMany({
    where: {
      updatedAt: { lt: cutoff },
      windowStart: { lt: cutoff },
    },
  });
}

export async function rateLimitOrThrow(
  input: RateLimitInput,
): Promise<{ allowed: boolean }> {
  if (Math.random() < CLEANUP_PROBABILITY) {
    try {
      await cleanupExpiredRateLimitBuckets();
    } catch (err) {
      logger.error("RATE_LIMIT_CLEANUP_ERROR", {
        errorName: err instanceof Error ? err.name : "UnknownError",
      });
    }
  }

  const now = new Date();
  const windowStart = new Date(now.getTime() - input.windowMs);

  const allowed = await prisma.$transaction(
    async (tx) => {
      const existing = await tx.rateLimitBucket.findUnique({
        where: { key: input.key },
        select: { id: true, windowStart: true, count: true },
      });

      if (!existing) {
        await tx.rateLimitBucket.create({
          data: {
            key: input.key,
            windowStart: now,
            count: 1,
          },
        });
        return true;
      }

      if (existing.windowStart <= windowStart) {
        await tx.rateLimitBucket.update({
          where: { id: existing.id },
          data: {
            windowStart: now,
            count: 1,
          },
        });
        return true;
      }

      if (existing.count >= input.limit) {
        return false;
      }

      await tx.rateLimitBucket.update({
        where: { id: existing.id },
        data: {
          count: { increment: 1 },
        },
      });
      return true;
    },
    { isolationLevel: "Serializable" },
  );

  return { allowed };
}
