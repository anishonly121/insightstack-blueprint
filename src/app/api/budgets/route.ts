import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";
import { enforceCsrfIfCookieAuth } from "@/lib/csrf";
import { getRequestId, jsonWithRequestId, errorResponseWithRequestId } from "@/lib/http";

const upsertSchema = z.object({
  category: z.string().min(1).max(100).trim(),
  monthlyLimit: z.number().positive().finite().max(1_000_000),
});

const deleteSchema = z.object({
  category: z.string().min(1).max(100).trim(),
});

export async function GET(req: Request): Promise<NextResponse> {
  const requestId = getRequestId(req);
  const user = await getUserFromRequest(req);
  if (!user) return errorResponseWithRequestId(requestId, 401, "UNAUTHORIZED", "Missing or invalid token");

  const budgets = await prisma.budget.findMany({
    where: { userId: user.id },
    orderBy: { category: "asc" },
    select: { id: true, category: true, monthlyLimit: true, updatedAt: true },
  });

  return jsonWithRequestId(requestId, {
    data: budgets.map((b) => ({
      id: b.id,
      category: b.category,
      monthlyLimit: Number(b.monthlyLimit.toString()),
      updatedAt: b.updatedAt.toISOString(),
    })),
  });
}

export async function POST(req: Request): Promise<NextResponse> {
  const requestId = getRequestId(req);
  const csrfError = enforceCsrfIfCookieAuth(req, requestId);
  if (csrfError) return csrfError;

  const user = await getUserFromRequest(req);
  if (!user) return errorResponseWithRequestId(requestId, 401, "UNAUTHORIZED", "Missing or invalid token");

  let body: z.infer<typeof upsertSchema>;
  try {
    const raw = await req.json();
    const parsed = upsertSchema.safeParse(raw);
    if (!parsed.success) {
      return errorResponseWithRequestId(requestId, 400, "VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid body");
    }
    body = parsed.data;
  } catch {
    return errorResponseWithRequestId(requestId, 400, "BAD_REQUEST", "Invalid JSON body");
  }

  const budget = await prisma.budget.upsert({
    where: { userId_category: { userId: user.id, category: body.category } },
    update: { monthlyLimit: body.monthlyLimit },
    create: { userId: user.id, category: body.category, monthlyLimit: body.monthlyLimit },
    select: { id: true, category: true, monthlyLimit: true, updatedAt: true },
  });

  return jsonWithRequestId(requestId, {
    data: {
      id: budget.id,
      category: budget.category,
      monthlyLimit: Number(budget.monthlyLimit.toString()),
      updatedAt: budget.updatedAt.toISOString(),
    },
  });
}

export async function DELETE(req: Request): Promise<NextResponse> {
  const requestId = getRequestId(req);
  const csrfError = enforceCsrfIfCookieAuth(req, requestId);
  if (csrfError) return csrfError;

  const user = await getUserFromRequest(req);
  if (!user) return errorResponseWithRequestId(requestId, 401, "UNAUTHORIZED", "Missing or invalid token");

  let body: z.infer<typeof deleteSchema>;
  try {
    const raw = await req.json();
    const parsed = deleteSchema.safeParse(raw);
    if (!parsed.success) {
      return errorResponseWithRequestId(requestId, 400, "VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid body");
    }
    body = parsed.data;
  } catch {
    return errorResponseWithRequestId(requestId, 400, "BAD_REQUEST", "Invalid JSON body");
  }

  await prisma.budget.deleteMany({
    where: { userId: user.id, category: body.category },
  });

  return jsonWithRequestId(requestId, { data: { ok: true } });
}
