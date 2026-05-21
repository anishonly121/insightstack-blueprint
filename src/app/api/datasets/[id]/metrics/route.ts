import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";
import { errorResponseWithRequestId, getRequestId, jsonWithRequestId } from "@/lib/http";

const idSchema = z.string().uuid("Invalid dataset id");

type CategoryStat = { category: string; total: number; count: number };
type MonthStat = { month: string; income: number; expenses: number; net: number };

export type MetricsJson = {
  totalIncome: number;
  totalExpenses: number;
  netSavings: number;
  savingsRate: number;
  transactionCount: number;
  avgTransaction: number;
  topCategories: CategoryStat[];
  monthlyBreakdown: MonthStat[];
};

function computeMetrics(
  transactions: Array<{ date: Date; category: string; amount: Prisma.Decimal }>,
): MetricsJson {
  let totalIncome = 0;
  let totalExpenses = 0;

  const categoryMap = new Map<string, { total: number; count: number }>();
  const monthMap = new Map<string, { income: number; expenses: number }>();

  for (const tx of transactions) {
    const amount = Number(tx.amount.toString());
    if (amount >= 0) {
      totalIncome += amount;
    } else {
      totalExpenses += Math.abs(amount);
    }

    const cat = tx.category.trim() || "Uncategorized";
    const existing = categoryMap.get(cat) ?? { total: 0, count: 0 };
    categoryMap.set(cat, { total: existing.total + amount, count: existing.count + 1 });

    const month = tx.date.toISOString().slice(0, 7);
    const m = monthMap.get(month) ?? { income: 0, expenses: 0 };
    if (amount >= 0) {
      monthMap.set(month, { ...m, income: m.income + amount });
    } else {
      monthMap.set(month, { ...m, expenses: m.expenses + Math.abs(amount) });
    }
  }

  const netSavings = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;
  const transactionCount = transactions.length;
  const avgTransaction =
    transactionCount > 0
      ? (totalIncome - totalExpenses) / transactionCount
      : 0;

  const topCategories: CategoryStat[] = [...categoryMap.entries()]
    .map(([category, v]) => ({
      category,
      total: Number(v.total.toFixed(2)),
      count: v.count,
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  const monthlyBreakdown: MonthStat[] = [...monthMap.entries()]
    .map(([month, v]) => ({
      month,
      income: Number(v.income.toFixed(2)),
      expenses: Number(v.expenses.toFixed(2)),
      net: Number((v.income - v.expenses).toFixed(2)),
    }))
    .sort((a, b) => a.month.localeCompare(b.month));

  return {
    totalIncome: Number(totalIncome.toFixed(2)),
    totalExpenses: Number(totalExpenses.toFixed(2)),
    netSavings: Number(netSavings.toFixed(2)),
    savingsRate: Number(savingsRate.toFixed(1)),
    transactionCount,
    avgTransaction: Number(avgTransaction.toFixed(2)),
    topCategories,
    monthlyBreakdown,
  };
}

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

    const dataset = await prisma.dataset.findFirst({
      where: { id: parsedId.data, userId: user.id },
      select: { id: true, status: true },
    });

    if (!dataset) {
      return errorResponseWithRequestId(requestId, 404, "NOT_FOUND", "Dataset not found");
    }

    // Return cached snapshot if computed within the last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const cached = await prisma.metricSnapshot.findFirst({
      where: { datasetId: dataset.id, computedAt: { gte: oneHourAgo } },
      orderBy: { computedAt: "desc" },
      select: { id: true, computedAt: true, metricsJson: true },
    });

    if (cached) {
      return jsonWithRequestId(requestId, {
        data: { ...cached, cached: true },
      });
    }

    const transactions = await prisma.transaction.findMany({
      where: { datasetId: dataset.id },
      select: { date: true, category: true, amount: true },
    });

    const metrics = computeMetrics(transactions);

    const snapshot = await prisma.metricSnapshot.create({
      data: {
        datasetId: dataset.id,
        metricsJson: metrics as unknown as Prisma.InputJsonValue,
      },
      select: { id: true, computedAt: true, metricsJson: true },
    });

    return jsonWithRequestId(requestId, {
      data: { ...snapshot, cached: false },
    });
  } catch {
    return errorResponseWithRequestId(requestId, 500, "INTERNAL_SERVER_ERROR", "Something went wrong");
  }
}
