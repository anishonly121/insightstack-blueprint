import type { MetricsJson, CategoryStat } from '../types';

export interface TrendResult {
  slope: number;
  direction: 'increasing' | 'decreasing' | 'stable';
}

/**
 * Ordinary-least-squares linear regression on monthly expense data.
 * Returns the slope ($/month change) and a directional label.
 *
 * A slope threshold of $20/month is used to distinguish real trends from noise:
 * small datasets with high variance shouldn't be labelled "increasing".
 */
export function detectTrend(monthlyBreakdown: MetricsJson['monthlyBreakdown']): TrendResult {
  const n = monthlyBreakdown.length;
  if (n < 2) return { slope: 0, direction: 'stable' };

  const x = Array.from({ length: n }, (_, i) => i);
  const y = monthlyBreakdown.map((m) => m.expenses);

  const xMean = x.reduce((a, b) => a + b, 0) / n;
  const yMean = y.reduce((a, b) => a + b, 0) / n;

  const numerator = x.reduce((sum, xi, i) => sum + (xi - xMean) * (y[i]! - yMean), 0);
  const denominator = x.reduce((sum, xi) => sum + Math.pow(xi - xMean, 2), 0);

  const slope = denominator === 0 ? 0 : numerator / denominator;
  const direction =
    slope > 20 ? 'increasing' : slope < -20 ? 'decreasing' : 'stable';

  return { slope: Number(slope.toFixed(2)), direction };
}

/**
 * Herfindahl-Hirschman Index adapted for spending concentration.
 *
 * HHI is used by the US DOJ to measure market concentration.
 * Here each spending category is treated as a "market participant".
 * Returns a value between 0 (perfectly diversified) and 1 (all spending in one category).
 *
 * Interpretation:
 *   < 0.15  — well diversified
 *   0.15–0.25 — moderate concentration
 *   > 0.25  — high concentration, single-category dominance risk
 */
export function computeHHI(categories: CategoryStat[], totalExpenses: number): number {
  if (totalExpenses === 0 || categories.length === 0) return 0;
  return categories
    .filter((c) => c.total < 0)
    .reduce((sum, c) => {
      const share = Math.abs(c.total) / totalExpenses;
      return sum + share * share;
    }, 0);
}

/**
 * Coefficient of Variation of monthly expenses: stddev / mean.
 * Higher values indicate more volatile month-to-month spending.
 * > 0.3 is considered high volatility for a spending pattern.
 */
export function computeMonthlyVolatility(
  monthlyBreakdown: MetricsJson['monthlyBreakdown'],
): number {
  const values = monthlyBreakdown.map((m) => m.expenses);
  const n = values.length;
  if (n < 2) return 0;

  const mean = values.reduce((a, b) => a + b, 0) / n;
  if (mean === 0) return 0;

  const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / n;
  return Number((Math.sqrt(variance) / mean).toFixed(3));
}

/**
 * Month-over-month expense change for the last two recorded months.
 * Returns null when fewer than 2 months of data exist.
 */
export function lastMonthChange(
  monthlyBreakdown: MetricsJson['monthlyBreakdown'],
): { absolute: number; percent: number } | null {
  if (monthlyBreakdown.length < 2) return null;
  const sorted = [...monthlyBreakdown].sort((a, b) => a.month.localeCompare(b.month));
  const prev = sorted[sorted.length - 2]!.expenses;
  const curr = sorted[sorted.length - 1]!.expenses;
  const absolute = Number((curr - prev).toFixed(2));
  const percent = prev === 0 ? 0 : Number(((absolute / prev) * 100).toFixed(1));
  return { absolute, percent };
}
