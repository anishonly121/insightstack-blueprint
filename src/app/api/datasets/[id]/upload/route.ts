import { NextResponse, after } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";
import { enforceCsrfIfCookieAuth } from "@/lib/csrf";
import { getRequestIp, rateLimitOrThrow } from "@/lib/rateLimit";
import { getAuditRequestMeta, logAudit } from "@/lib/audit";
import { errorResponseWithRequestId, getRequestId, jsonWithRequestId } from "@/lib/http";
import { sendBudgetAlertEmail } from "@/lib/alerts";
import { logger } from "@/lib/logger";
import { computeMetrics, monthlySpendForCategory } from "@/lib/metrics";
import { parseTransactionsCsv } from "@/lib/csv";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_ROWS = 50_000;

const idSchema = z.string().uuid("Invalid dataset id");
const fileSchema = z.object({
  name: z.string().min(1, "File name is required"),
  size: z.number().max(MAX_FILE_SIZE, "File size must be 5MB or less"),
});

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
    const parsed = parseTransactionsCsv(text);

    if (!parsed.ok) {
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

      return errorResponseWithRequestId(requestId, 400, "CSV_PARSE_ERROR", parsed.message);
    }

    if (parsed.rows.length > MAX_ROWS) {
      return errorResponseWithRequestId(
        requestId,
        400,
        "VALIDATION_ERROR",
        `This file has ${parsed.rows.length.toLocaleString()} transactions. The limit is ${MAX_ROWS.toLocaleString()} per dataset.`,
      );
    }

    const previewJson = parsed.preview as Prisma.InputJsonValue;
    const rowsToInsert = parsed.rows.map((row) => ({ datasetId: dataset.id, ...row }));
    const insertedCount = rowsToInsert.length;
    const nextStatus = insertedCount > 0 ? "PARSED" : "FAILED";

    const updated = await prisma.$transaction(async (tx) => {
      await tx.transaction.deleteMany({
        where: { datasetId: dataset.id },
      });
      // Cached metrics describe the old file, so drop them.
      await tx.metricSnapshot.deleteMany({
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
    }, { timeout: 30_000 });

    await logAudit({
      userId: user.id,
      action: "DATASET_UPLOAD",
      entityType: "Dataset",
      entityId: dataset.id,
      meta: {
        originalFilename: fileValue.name,
        rowCount: insertedCount,
        skippedRows: parsed.skippedRows,
        status: nextStatus,
        ...requestMeta,
      },
    });

    // After the response is sent, check budgets and email an alert if any
    // category has reached 80% of its monthly limit. `after` keeps the work
    // alive on serverless platforms, where a plain un-awaited promise can be cut off.
    if (nextStatus === "PARSED" && rowsToInsert.length > 0) {
      after(async () => {
        try {
          const [budgets, fullUser, datasetRecord] = await Promise.all([
            prisma.budget.findMany({ where: { userId: user.id } }),
            prisma.user.findUnique({ where: { id: user.id }, select: { emailDigestEnabled: true } }),
            prisma.dataset.findUnique({ where: { id: dataset.id }, select: { name: true } }),
          ]);

          if (!budgets.length || !fullUser?.emailDigestEnabled) return;

          const metrics = computeMetrics(rowsToInsert);
          const alerts = budgets
            .map((b) => {
              const spent = monthlySpendForCategory(metrics, b.category);
              const limit = Number(b.monthlyLimit.toString());
              const pct = limit > 0 ? (spent / limit) * 100 : 0;
              return { category: b.category, spent, limit, pct };
            })
            .filter((a) => a.pct >= 80);

          if (!alerts.length) return;

          const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://insightstack-peach.vercel.app";
          await sendBudgetAlertEmail({
            to: user.email,
            name: user.name.split(" ")[0] ?? user.name,
            datasetName: datasetRecord?.name ?? "your dataset",
            dashboardUrl: appUrl,
            alerts,
          });

          logger.info("BUDGET_ALERT_SENT", { userId: user.id, alertCount: alerts.length });
        } catch (err) {
          logger.error("BUDGET_ALERT_FAILED", { userId: user.id, error: err instanceof Error ? err.message : String(err) });
        }
      });
    }

    return jsonWithRequestId(requestId, {
      data: { ...updated, skippedRows: parsed.skippedRows, totalRows: parsed.totalRows },
    });
  } catch (err) {
    logger.error("DATASET_UPLOAD_ERROR", {
      requestId,
      datasetId: dataset.id,
      errorName: err instanceof Error ? err.name : "UnknownError",
    });
    await prisma.dataset
      .update({ where: { id: dataset.id }, data: { status: "FAILED" }, select: { id: true } })
      .catch(() => undefined);

    return errorResponseWithRequestId(requestId, 500, "INTERNAL_SERVER_ERROR", "Something went wrong");
  }
}
