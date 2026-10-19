import type { Prisma } from "@prisma/client";

/**
 * A spending category. `total` is the net amount for the category and is
 * negative (money out). Income categories are not included.
 * `latestMonthTotal` is the spend in the most recent month of the dataset,
 * as a positive number. It is optional so older stored snapshots still parse.
 */
export type CategoryStat = {
  category: string;
  total: number;
  count: number;
  latestMonthTotal?: number;
};
export type MonthStat = { month: string; income: number; expenses: number; net: number };
export type AnomalyStat = {
  date: string;
  description: string;
  category: string;
  amount: number;
  zScore: number;
};

export type MetricsJson = {
  totalIncome: number;
  totalExpenses: number;
  netSavings: number;
  savingsRate: number;
  transactionCount: number;
  /** Average size of a spending transaction (positive). */
  avgTransaction: number;
  /** Spending categories only, largest spend first. */
  topCategories: CategoryStat[];
  monthlyBreakdown: MonthStat[];
  /** Most recent month in the data (YYYY-MM), or null when empty. */
  latestMonth?: string | null;
};

type Amount = Prisma.Decimal | number | string;
type MetricsTx = { date: Date; category: string; amount: Amount };
type AnomalyTx = { date: Date; description: string; category: string; amount: Amount };

const toNumber = (amount: Amount): number => Number(amount.toString());
const round2 = (n: number): number => Number(n.toFixed(2));
const monthKey = (date: Date): string => date.toISOString().slice(0, 7);

export const TOP_CATEGORY_LIMIT = 10;

export function computeMetrics(transactions: MetricsTx[]): MetricsJson {
  let totalIncome = 0;
  let totalExpenses = 0;
  let expenseCount = 0;
  let latestMonth: string | null = null;

  const categoryMap = new Map<string, { total: number; count: number; byMonth: Map<string, number> }>();
  const monthMap = new Map<string, { income: number; expenses: number }>();

  for (const tx of transactions) {
    const amount = toNumber(tx.amount);
    if (!Number.isFinite(amount)) continue;

    if (amount >= 0) {
      totalIncome += amount;
    } else {
      totalExpenses += Math.abs(amount);
      expenseCount += 1;
    }

    const month = monthKey(tx.date);
    if (latestMonth === null || month > latestMonth) latestMonth = month;

    const cat = tx.category.trim() || "Uncategorized";
    const entry = categoryMap.get(cat) ?? { total: 0, count: 0, byMonth: new Map<string, number>() };
    entry.total += amount;
    entry.count += 1;
    entry.byMonth.set(month, (entry.byMonth.get(month) ?? 0) + amount);
    categoryMap.set(cat, entry);

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
  const avgTransaction = expenseCount > 0 ? totalExpenses / expenseCount : 0;

  // Only categories where money went out on balance count as spending.
  // A refund inside a category reduces its spend; a pure income category is excluded.
  const topCategories: CategoryStat[] = [...categoryMap.entries()]
    .filter(([, v]) => v.total < 0)
    .map(([category, v]) => {
      const latest = latestMonth ? v.byMonth.get(latestMonth) ?? 0 : 0;
      return {
        category,
        total: round2(v.total),
        count: v.count,
        latestMonthTotal: round2(Math.max(0, -latest)),
      };
    })
    .sort((a, b) => a.total - b.total)
    .slice(0, TOP_CATEGORY_LIMIT);

  const monthlyBreakdown: MonthStat[] = [...monthMap.entries()]
    .map(([month, v]) => ({
      month,
      income: round2(v.income),
      expenses: round2(v.expenses),
      net: round2(v.income - v.expenses),
    }))
    .sort((a, b) => a.month.localeCompare(b.month));

  return {
    totalIncome: round2(totalIncome),
    totalExpenses: round2(totalExpenses),
    netSavings: round2(netSavings),
    savingsRate: Number(savingsRate.toFixed(1)),
    transactionCount,
    avgTransaction: round2(avgTransaction),
    topCategories,
    monthlyBreakdown,
    latestMonth,
  };
}

/** Number of calendar months the data covers (at least 1). */
export function monthsCovered(metrics: Pick<MetricsJson, "monthlyBreakdown">): number {
  return Math.max(1, metrics.monthlyBreakdown.length);
}

/** Convert a total across the whole dataset into a per-month figure. */
export function perMonth(value: number, metrics: Pick<MetricsJson, "monthlyBreakdown">): number {
  return round2(value / monthsCovered(metrics));
}

/**
 * Spend for a category to compare against a monthly budget: the latest month
 * when available, otherwise the average month across the dataset.
 */
export function monthlySpendForCategory(metrics: MetricsJson, category: string): number {
  const cat = metrics.topCategories.find((c) => c.category === category);
  if (!cat) return 0;
  if (typeof cat.latestMonthTotal === "number") return cat.latestMonthTotal;
  const months = Math.max(1, metrics.monthlyBreakdown.length);
  return round2(Math.abs(cat.total) / months);
}

export function detectAnomalies(transactions: AnomalyTx[], topN = 5): AnomalyStat[] {
  // Only look at money going out. Regular income such as salary is large but
  // expected, so it should never be reported as an unusual charge.
  const expenses = transactions
    .map((t) => ({ t, amount: toNumber(t.amount) }))
    .filter(({ amount }) => Number.isFinite(amount) && amount < 0);

  if (expenses.length < 3) return [];

  const sizes = expenses.map(({ amount }) => Math.abs(amount));
  const avg = sizes.reduce((a, b) => a + b, 0) / sizes.length;
  const variance = sizes.reduce((sum, a) => sum + Math.pow(a - avg, 2), 0) / sizes.length;
  const stddev = Math.sqrt(variance);

  if (stddev === 0) return [];

  return expenses
    .map(({ t, amount }) => {
      const zScore = (Math.abs(amount) - avg) / stddev;
      return {
        date: t.date.toISOString().slice(0, 10),
        description: t.description,
        category: t.category,
        amount: round2(amount),
        zScore: Number(zScore.toFixed(2)),
      };
    })
    .filter((t) => t.zScore > 2)
    .sort((a, b) => b.zScore - a.zScore)
    .slice(0, topN);
}
