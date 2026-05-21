import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getRequestIp } from "@/lib/rateLimit";

type LogAuditInput = {
  userId: string;
  action: string;
  entityType: string;
  entityId?: string;
  meta?: Prisma.InputJsonValue;
};

export const getAuditRequestMeta = (req: Request): Record<string, string> => {
  const ip = getRequestIp(req);
  const userAgent = req.headers.get("user-agent") ?? "unknown";
  return { ip, userAgent };
};

export async function logAudit(input: LogAuditInput): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: input.userId,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        meta: input.meta,
      },
    });
  } catch {
    // Best-effort logging: do not break request flow on audit write failures.
  }
}
