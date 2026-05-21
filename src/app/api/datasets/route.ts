import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";
import { enforceCsrfIfCookieAuth } from "@/lib/csrf";
import { errorResponseWithRequestId, getRequestId, jsonWithRequestId } from "@/lib/http";
const createDatasetSchema = z.object({
  name: z.string().trim().min(1, "Dataset name is required").max(120),
});

const listDatasetQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  sort: z.enum(["createdAt"]).default("createdAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
});

export async function POST(req: Request): Promise<NextResponse> {
  const requestId = getRequestId(req);
  const csrfError = enforceCsrfIfCookieAuth(req, requestId);
  if (csrfError) {
    return csrfError;
  }
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return errorResponseWithRequestId(requestId, 401, "UNAUTHORIZED", "Missing or invalid token");
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
    const parsed = createDatasetSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponseWithRequestId(
        requestId,
        400,
        "VALIDATION_ERROR",
        parsed.error.issues[0]?.message ?? "Invalid input",
      );
    }

    const dataset = await prisma.dataset.create({
      data: {
        userId: user.id,
        name: parsed.data.name,
      },
      select: {
        id: true,
        userId: true,
        name: true,
        status: true,
        originalFilename: true,
        rowCount: true,
        createdAt: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "DATASET_CREATED",
        entityType: "Dataset",
        entityId: dataset.id,
        meta: {
          name: dataset.name,
          status: dataset.status,
        },
      },
    });

    return jsonWithRequestId(requestId, { data: dataset }, { status: 201 });
  } catch {
    return errorResponseWithRequestId(requestId, 500, "INTERNAL_SERVER_ERROR", "Something went wrong");
  }
}

export async function GET(req: Request): Promise<NextResponse> {
  const requestId = getRequestId(req);
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return errorResponseWithRequestId(requestId, 401, "UNAUTHORIZED", "Missing or invalid token");
    }

    const searchParams = new URL(req.url).searchParams;
    const parsedQuery = listDatasetQuerySchema.safeParse({
      page: searchParams.get("page") ?? undefined,
      pageSize: searchParams.get("pageSize") ?? undefined,
      sort: searchParams.get("sort") ?? undefined,
      order: searchParams.get("order") ?? undefined,
    });

    if (!parsedQuery.success) {
      return errorResponseWithRequestId(
        requestId,
        400,
        "VALIDATION_ERROR",
        parsedQuery.error.issues[0]?.message ?? "Invalid query params",
      );
    }

    const { page, pageSize, sort, order } = parsedQuery.data;
    const where = { userId: user.id };
    const [total, datasets] = await Promise.all([
      prisma.dataset.count({ where }),
      prisma.dataset.findMany({
        where,
        orderBy: { [sort]: order },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          userId: true,
          name: true,
          status: true,
          originalFilename: true,
          rowCount: true,
          createdAt: true,
        },
      }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    return jsonWithRequestId(requestId, {
      data: datasets,
      meta: {
        page,
        pageSize,
        total,
        totalPages,
      },
    });
  } catch {
    return errorResponseWithRequestId(requestId, 500, "INTERNAL_SERVER_ERROR", "Something went wrong");
  }
}
