import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";
import { errorResponseWithRequestId, getRequestId, jsonWithRequestId } from "@/lib/http";

const idSchema = z.string().uuid("Invalid dataset id");

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(50),
  sort: z.enum(["date", "amount", "category"]).default("date"),
  order: z.enum(["asc", "desc"]).default("desc"),
  search: z.string().max(200).optional(),
  category: z.string().max(100).optional(),
});

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const requestId = getRequestId(req);
  try {
    const { id } = await params;
    const user = await getUserFromRequest(req);

    if (!user) {
      return errorResponseWithRequestId(requestId, 401, "UNAUTHORIZED", "Missing or invalid token");
    }

    const parsedId = idSchema.safeParse(id);
    if (!parsedId.success) {
      return errorResponseWithRequestId(requestId, 400, "VALIDATION_ERROR", "Invalid dataset id");
    }

    const url = new URL(req.url);
    const parsedQuery = querySchema.safeParse({
      page: url.searchParams.get("page") ?? undefined,
      pageSize: url.searchParams.get("pageSize") ?? undefined,
      sort: url.searchParams.get("sort") ?? undefined,
      order: url.searchParams.get("order") ?? undefined,
      search: url.searchParams.get("search") ?? undefined,
      category: url.searchParams.get("category") ?? undefined,
    });

    if (!parsedQuery.success) {
      return errorResponseWithRequestId(
        requestId,
        400,
        "VALIDATION_ERROR",
        parsedQuery.error.issues[0]?.message ?? "Invalid query params",
      );
    }

    const dataset = await prisma.dataset.findFirst({
      where: { id: parsedId.data, userId: user.id },
      select: { id: true },
    });

    if (!dataset) {
      return errorResponseWithRequestId(requestId, 404, "NOT_FOUND", "Dataset not found");
    }

    const { page, pageSize, sort, order, search, category } = parsedQuery.data;

    const where = {
      datasetId: dataset.id,
      ...(search
        ? { description: { contains: search, mode: "insensitive" as const } }
        : {}),
      ...(category ? { category: { equals: category, mode: "insensitive" as const } } : {}),
    };

    const [total, transactions] = await Promise.all([
      prisma.transaction.count({ where }),
      prisma.transaction.findMany({
        where,
        orderBy: { [sort]: order },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: { id: true, date: true, category: true, description: true, amount: true },
      }),
    ]);

    // Also return distinct categories for the filter dropdown
    const categories = await prisma.transaction.groupBy({
      by: ["category"],
      where: { datasetId: dataset.id },
      orderBy: { category: "asc" },
    });

    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    return jsonWithRequestId(requestId, {
      data: transactions.map((tx) => ({
        id: tx.id,
        date: tx.date.toISOString(),
        category: tx.category,
        description: tx.description,
        amount: tx.amount.toString(),
      })),
      meta: { page, pageSize, total, totalPages },
      categories: categories.map((c) => c.category),
    });
  } catch {
    return errorResponseWithRequestId(requestId, 500, "INTERNAL_SERVER_ERROR", "Something went wrong");
  }
}
