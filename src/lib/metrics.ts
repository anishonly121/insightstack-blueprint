import { Prisma } from "@prisma/client";

export type CategoryStat = { category: string; total: number; count: number };
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
  avgTransaction: number;
  topCategories: CategoryStat[];
  monthlyBreakdown: MonthStat[];
};

type MetricsTx = { date: Date; category: string; amount: Prisma.Decimal };
type AnomalyTx = { date: Date; description: string; category: string; amount: Prisma.Decimal };

export function computeMetrics(transactions: MetricsTx[]): MetricsJson {
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
    transactionCount > 0 ? (totalIncome - totalExpenses) / transactionCount : 0;

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

export function detectAnomalies(transactions: AnomalyTx[], topN = 5): AnomalyStat[] {
  if (transactions.length < 3) return [];

  const amounts = transactions.map((t) => Math.abs(Number(t.amount.toString())));
  const avg = amounts.reduce((a, b) => a + b, 0) / amounts.length;
  const variance = amounts.reduce((sum, a) => sum + Math.pow(a - avg, 2), 0) / amounts.length;
  const stddev = Math.sqrt(variance);

  if (stddev === 0) return [];

  return transactions
    .map((t) => {
      const amount = Number(t.amount.toString());
      const absAmount = Math.abs(amount);
      const zScore = (absAmount - avg) / stddev;
      return {
        date: t.date.toISOString().slice(0, 10),
        description: t.description,
        category: t.category,
        amount: Number(amount.toFixed(2)),
        zScore: Number(zScore.toFixed(2)),
      };
    })
    .filter((t) => t.zScore > 2)
    .sort((a, b) => b.zScore - a.zScore)
    .slice(0, topN);
}
