import { NextResponse } from "next/server";
import { z } from "zod";
import Papa from "papaparse";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";
import { enforceCsrfIfCookieAuth } from "@/lib/csrf";
import { getRequestIp, rateLimitOrThrow } from "@/lib/rateLimit";
import { getAuditRequestMeta, logAudit } from "@/lib/audit";
import { errorResponseWithRequestId, getRequestId, jsonWithRequestId } from "@/lib/http";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const idSchema = z.string().uuid("Invalid dataset id");
const fileSchema = z.object({
  name: z.string().min(1, "File name is required"),
  size: z.number().max(MAX_FILE_SIZE, "File size must be 5MB or less"),
});

type CsvRow = Record<string, unknown>;

type TransactionInput = {
  datasetId: string;
  date: Date;
  description: string;
  category: string;
  amount: string;
};

const toStringValue = (value: unknown): string => {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return "";
};

const parseDateValue = (value: unknown): Date | null => {
  const raw = toStringValue(value);
  if (!raw) return null;
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const parseAmountValue = (value: unknown): string | null => {
  const raw = toStringValue(value).replace(/,/g, "");
  if (!raw) return null;
  const numeric = Number(raw);
  if (!Number.isFinite(numeric)) return null;
  return numeric.toFixed(2);
};

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const requestId = getRequestId(req);
  const csrfError = enforceCsrfIfCookieAuth(req, requestId);
  if (csrfError) {
    return csrfError;
  }
  const { id } = await params;
  const requestMeta = getAuditRequestMeta(req);
  const user = await getUserFromRequest(req);
  if (!user) {
    return errorResponseWithRequestId(requestId, 401, "UNAUTHORIZED", "Missing or invalid token");
  }

  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success) {
    return errorResponseWithRequestId(requestId, 400, "VALIDATION_ERROR", "Invalid dataset id");
  }

  const dataset = await prisma.dataset.findFirst({
    where: { id: parsedId.data, userId: user.id },
    select: { id: true },
  });

  if (!dataset) {
    return errorResponseWithRequestId(requestId, 404, "NOT_FOUND", "Dataset not found");
  }

  const ip = getRequestIp(req);
  const { allowed } = await rateLimitOrThrow({
    key: `datasets:upload:${dataset.id}:${user.id}:${ip}`,
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

  try {
    const formData = await req.formData();
    const fileValue = formData.get("file");

    if (!(fileValue instanceof File)) {
      return errorResponseWithRequestId(requestId, 400, "VALIDATION_ERROR", "Missing file field");
    }

    const fileMeta = fileSchema.safeParse({
      name: fileValue.name,
      size: fileValue.size,
    });

    if (!fileMeta.success) {
      return errorResponseWithRequestId(
        requestId,
        400,
        "VALIDATION_ERROR",
        fileMeta.error.issues[0]?.message ?? "Invalid file",
      );
    }

    if (!fileValue.name.toLowerCase().endsWith(".csv")) {
      return errorResponseWithRequestId(
        requestId,
        400,
        "VALIDATION_ERROR",
        "Only .csv files are allowed",
      );
    }

    const text = await fileValue.text();
    const parsed = Papa.parse<CsvRow>(text, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
    });

    if (parsed.errors.length > 0) {
      await prisma.dataset.update({
        where: { id: dataset.id },
        data: {
          originalFilename: fileValue.name,
          rowCount: 0,
          status: "FAILED",
          previewJson: Prisma.JsonNull,
        },
        select: { id: true },
      });

      return errorResponseWithRequestId(requestId, 400, "CSV_PARSE_ERROR", "Unable to parse CSV file");
    }

    const parsedRows = parsed.data as CsvRow[];
    const previewJson = parsedRows.slice(0, 20) as Prisma.InputJsonValue;
    const rowsToInsert: TransactionInput[] = parsedRows
      .map((row) => {
        const date = parseDateValue(row.date);
        const description = toStringValue(row.description);
        const category = toStringValue(row.category);
        const amount = parseAmountValue(row.amount);

        if (!date || !description || !category || !amount) {
          return null;
        }

        return {
          datasetId: dataset.id,
          date,
          description,
          category,
          amount,
        };
      })
      .filter((row): row is TransactionInput => row !== null);

    const insertedCount = rowsToInsert.length;
    const nextStatus = insertedCount > 0 ? "PARSED" : "FAILED";

    const updated = await prisma.$transaction(async (tx) => {
      await tx.transaction.deleteMany({
        where: { datasetId: dataset.id },
      });

      if (rowsToInsert.length > 0) {
        await tx.transaction.createMany({
          data: rowsToInsert,
        });
      }
      const updatedDataset = await tx.dataset.update({
        where: { id: dataset.id },
        data: {
          originalFilename: fileValue.name,
          rowCount: insertedCount,
          status: nextStatus,
          previewJson,
        },
        select: {
          id: true,
          status: true,
          rowCount: true,
          originalFilename: true,
          previewJson: true,
        },
      });

      return updatedDataset;
    });

    await logAudit({
      userId: user.id,
      action: "DATASET_UPLOAD",
      entityType: "Dataset",
      entityId: dataset.id,
      meta: {
        originalFilename: fileValue.name,
        rowCount: insertedCount,
        status: nextStatus,
        ...requestMeta,
      },
    });

    return jsonWithRequestId(requestId, { data: updated });
  } catch {
    await prisma.dataset.update({
      where: { id: dataset.id },
      data: {
        status: "FAILED",
      },
      select: { id: true },
    });

    return errorResponseWithRequestId(requestId, 500, "INTERNAL_SERVER_ERROR", "Something went wrong");
  }
}
