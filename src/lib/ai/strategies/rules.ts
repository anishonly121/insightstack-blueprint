import type { Finding, MetricsJson, AnomalyStat, EnhancedStats } from '../types';

export interface Rule {
  id: string;
  evaluate(metrics: MetricsJson, anomalies: AnomalyStat[], stats: EnhancedStats): Finding | null;
}

const RULES: Rule[] = [
  // ── Savings health ──────────────────────────────────────────────────────────
  {
    id: 'deficit',
    evaluate(metrics) {
      if (metrics.totalIncome === 0 || metrics.netSavings >= 0) return null;
      return {
        id: 'deficit',
        type: 'rule',
        severity: 'critical',
        title: 'Spending exceeds income',
        body: `Your expenses ($${metrics.totalExpenses.toFixed(2)}) exceed your income ($${metrics.totalIncome.toFixed(2)}) by $${Math.abs(metrics.netSavings).toFixed(2)}. This gap must be closed before any other financial goal is meaningful.`,
        amount: Math.abs(metrics.netSavings),
        confidence: 1,
        tags: ['savings', 'deficit', 'critical'],
      };
    },
  },
  {
    id: 'savings-critically-low',
    evaluate(metrics) {
      if (metrics.totalIncome === 0 || metrics.savingsRate < 0 || metrics.savingsRate >= 10) return null;
      return {
        id: 'savings-critically-low',
        type: 'rule',
        severity: 'warning',
        title: 'Savings rate critically low',
        body: `Your savings rate is ${metrics.savingsRate.toFixed(1)}% — well below the recommended 20%. At this rate, long-term financial goals (retirement, property, emergency fund) are at risk.`,
        confidence: 0.95,
        tags: ['savings', 'warning', 'low'],
      };
    },
  },
  {
    id: 'savings-below-target',
    evaluate(metrics) {
      if (metrics.totalIncome === 0 || metrics.savingsRate < 10 || metrics.savingsRate >= 20) return null;
      return {
        id: 'savings-below-target',
        type: 'rule',
        severity: 'info',
        title: 'Savings rate below 20% target',
        body: `Your savings rate is ${metrics.savingsRate.toFixed(1)}%. The standard benchmark is 20%. Closing the gap by $${((0.20 * metrics.totalIncome) - metrics.netSavings).toFixed(2)} per month would hit the target.`,
        confidence: 0.9,
        tags: ['savings', 'info', 'target'],
      };
    },
  },
  {
    id: 'savings-healthy',
    evaluate(metrics) {
      if (metrics.totalIncome === 0 || metrics.savingsRate < 20 || metrics.savingsRate >= 35) return null;
      return {
        id: 'savings-healthy',
        type: 'rule',
        severity: 'info',
        title: 'Healthy savings rate',
        body: `Your savings rate of ${metrics.savingsRate.toFixed(1)}% meets the standard 20% benchmark. Ensure these savings are deployed into interest-bearing accounts or investments rather than sitting idle.`,
        confidence: 0.85,
        tags: ['savings', 'info', 'positive'],
      };
    },
  },
  {
    id: 'savings-excellent',
    evaluate(metrics) {
      if (metrics.totalIncome === 0 || metrics.savingsRate < 35) return null;
      return {
        id: 'savings-excellent',
        type: 'rule',
        severity: 'info',
        title: 'Excellent savings rate',
        body: `Your savings rate of ${metrics.savingsRate.toFixed(1)}% significantly exceeds the 20% target. At this rate you are on a strong path to financial independence. Confirm these savings are invested, not sitting in a low-yield account.`,
        confidence: 0.9,
        tags: ['savings', 'info', 'excellent'],
      };
    },
  },

  // ── Spending concentration ───────────────────────────────────────────────────
  {
    id: 'concentration-high',
    evaluate(metrics, _anomalies, stats) {
      if (stats.topCategoryShare < 0.40 || metrics.totalExpenses === 0) return null;
      const top = metrics.topCategories[0];
      if (!top) return null;
      return {
        id: 'concentration-high',
        type: 'rule',
        severity: 'warning',
        category: top.category,
        title: `High spending concentration in ${top.category}`,
        body: `${top.category} represents ${(stats.topCategoryShare * 100).toFixed(0)}% of total expenses ($${Math.abs(top.total).toFixed(2)}). A single category dominating over 40% of spend creates budget fragility — any increase in this category has an outsized impact.`,
        amount: Math.abs(top.total),
        confidence: 0.9,
        tags: ['concentration', 'warning', top.category.toLowerCase()],
      };
    },
  },
  {
    id: 'concentration-extreme',
    evaluate(metrics, _anomalies, stats) {
      if (stats.topCategoryShare < 0.60 || metrics.totalExpenses === 0) return null;
      const top = metrics.topCategories[0];
      if (!top) return null;
      return {
        id: 'concentration-extreme',
        type: 'rule',
        severity: 'critical',
        category: top.category,
        title: `Extreme concentration — ${top.category} is over 60% of spending`,
        body: `${top.category} absorbs ${(stats.topCategoryShare * 100).toFixed(0)}% of all expenses. This is an extreme concentration that leaves no resilience against cost increases in this category.`,
        amount: Math.abs(top.total),
        confidence: 0.95,
        tags: ['concentration', 'critical', top.category.toLowerCase()],
      };
    },
  },

  // ── Anomalies ────────────────────────────────────────────────────────────────
  {
    id: 'anomaly-multiple',
    evaluate(_metrics, anomalies) {
      if (anomalies.length < 3) return null;
      const total = anomalies.reduce((s, a) => s + Math.abs(a.amount), 0);
      return {
        id: 'anomaly-multiple',
        type: 'statistical',
        severity: 'warning',
        title: `${anomalies.length} statistically unusual transactions`,
        body: `${anomalies.length} transactions are more than 2 standard deviations above your average spend, totalling $${total.toFixed(2)}. Review each for legitimacy — billing errors and subscription price increases are common causes.`,
        amount: total,
        confidence: 0.85,
        tags: ['anomaly', 'warning', 'review'],
      };
    },
  },
  {
    id: 'anomaly-single-large',
    evaluate(_metrics, anomalies) {
      if (anomalies.length === 0) return null;
      const top = anomalies[0]!;
      if (top.zScore < 3) return null;
      return {
        id: 'anomaly-single-large',
        type: 'statistical',
        severity: 'warning',
        title: 'Highly unusual transaction detected',
        body: `"${top.description}" ($${Math.abs(top.amount).toFixed(2)}) is ${top.zScore.toFixed(1)} standard deviations above your average spend — statistically rare. Confirm this was intentional and the amount is correct.`,
        amount: Math.abs(top.amount),
        confidence: 0.88,
        tags: ['anomaly', 'warning', 'large'],
      };
    },
  },

  // ── Spending trend ───────────────────────────────────────────────────────────
  {
    id: 'trend-increasing',
    evaluate(_metrics, _anomalies, stats) {
      if (stats.trend.direction !== 'increasing') return null;
      return {
        id: 'trend-increasing',
        type: 'statistical',
        severity: 'warning',
        title: 'Expenses trending upward',
        body: `Your monthly expenses are growing by approximately $${Math.abs(stats.trend.slope).toFixed(0)} per month. Unchecked, this is a classic sign of lifestyle inflation — spending silently expanding to match income growth.`,
        confidence: stats.monthCount >= 3 ? 0.8 : 0.55,
        tags: ['trend', 'increasing', 'warning'],
      };
    },
  },
  {
    id: 'trend-decreasing',
    evaluate(_metrics, _anomalies, stats) {
      if (stats.trend.direction !== 'decreasing') return null;
      return {
        id: 'trend-decreasing',
        type: 'statistical',
        severity: 'info',
        title: 'Expenses trending downward',
        body: `Your monthly expenses are falling by approximately $${Math.abs(stats.trend.slope).toFixed(0)} per month — a positive signal. Automate the freed-up cash into savings or investment so the gains are locked in.`,
        confidence: stats.monthCount >= 3 ? 0.8 : 0.55,
        tags: ['trend', 'decreasing', 'positive'],
      };
    },
  },

  // ── No income data ───────────────────────────────────────────────────────────
  {
    id: 'no-income',
    evaluate(metrics) {
      if (metrics.totalIncome > 0) return null;
      return {
        id: 'no-income',
        type: 'pattern',
        severity: 'info',
        title: 'No income transactions in dataset',
        body: 'This dataset contains only expense transactions. Savings rate and income-relative metrics cannot be computed. Include salary credits or tag income rows to unlock full analysis.',
        confidence: 1,
        tags: ['income', 'info', 'missing'],
      };
    },
  },
];

export function evaluateRules(
  metrics: MetricsJson,
  anomalies: AnomalyStat[],
  stats: EnhancedStats,
): Finding[] {
  return RULES.map((rule) => rule.evaluate(metrics, anomalies, stats)).filter(
    (f): f is Finding => f !== null,
  );
}
