import "server-only";
import { prisma } from "@/lib/prisma";

/** Emails are stored and compared in lowercase with surrounding spaces removed. */
export const normalizeEmail = (email: string): string => email.trim().toLowerCase();

/**
 * Find a user by email without caring about letter case.
 * New accounts are stored in lowercase, but accounts created before that rule
 * may have mixed case, so fall back to a case-insensitive match.
 */
export async function findUserIdByEmail(email: string): Promise<string | null> {
  const normalized = normalizeEmail(email);
  const exact = await prisma.user.findUnique({ where: { email: normalized }, select: { id: true } });
  if (exact) return exact.id;
  const loose = await prisma.user.findFirst({
    where: { email: { equals: normalized, mode: "insensitive" } },
    select: { id: true },
  });
  return loose?.id ?? null;
}
