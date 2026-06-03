import type { MetricsJson, AnomalyStat, CategoryStat, Finding, EnhancedStats } from '../types';
import type { KnowledgeDoc } from '../knowledge/base';

// ── Summary templates ──────────────────────────────────────────────────────────
// Each variant targets a different financial health profile.
// Selecting among multiple templates avoids repetitive identical phrasing.

type SummaryContext = {
  metrics: MetricsJson;
  anomalies: AnomalyStat[];
  findings: Finding[];
  stats: EnhancedStats;
};

const SUMMARY_VARIANTS: Array<(ctx: SummaryContext) => string> = [
  // Variant A: lead with top category
  ({ metrics, anomalies, stats }) => {
    const top = metrics.topCategories[0];
    const savingsClause =
      metrics.totalIncome > 0
        ? metrics.savingsRate >= 20
          ? `a healthy ${metrics.savingsRate.toFixed(1)}% savings rate`
          : metrics.savingsRate > 0
          ? `a savings rate of ${metrics.savingsRate.toFixed(1)}% — below the recommended 20%`
          : `a deficit of $${Math.abs(metrics.netSavings).toFixed(2)}`
        : 'no income data';

    const trendClause =
      stats.trend.direction !== 'stable'
        ? ` Monthly expenses are ${stats.trend.direction} by ~$${Math.abs(stats.trend.slope).toFixed(0)} per month.`
        : '';

    return (
      `Across ${metrics.transactionCount} transactions, total spending reached $${metrics.totalExpenses.toFixed(2)}` +
      (metrics.totalIncome > 0
        ? ` against $${metrics.totalIncome.toFixed(2)} in income, yielding ${savingsClause}.`
        : `, with ${savingsClause}.`) +
      (top
        ? ` ${top.category} was your largest expense category at $${Math.abs(top.total).toFixed(2)}, representing ${((Math.abs(top.total) / Math.max(metrics.totalExpenses, 1)) * 100).toFixed(0)}% of total outgoings.`
        : '') +
      (anomalies.length > 0
        ? ` ${anomalies.length} statistically unusual transaction${anomalies.length > 1 ? 's were' : ' was'} detected.`
        : ' No unusual transactions were detected.') +
      trendClause
    );
  },

  // Variant B: lead with financial health verdict
  ({ metrics, anomalies, findings, stats }) => {
    const criticalCount = findings.filter((f) => f.severity === 'critical').length;
    const warningCount = findings.filter((f) => f.severity === 'warning').length;
    const verdict =
      criticalCount > 0
        ? 'Your financial position requires immediate attention'
        : warningCount > 0
        ? 'Your spending shows areas that need attention'
        : 'Your finances are in good shape';

    const top = metrics.topCategories[0];
    const span = metrics.monthlyBreakdown.length;
    const spanClause = span > 1 ? ` over ${span} months` : '';

    return (
      `${verdict}${spanClause}. ` +
      `${metrics.transactionCount} transactions totalling $${metrics.totalExpenses.toFixed(2)} in expenses were analysed.` +
      (top ? ` The dominant category is ${top.category} at $${Math.abs(top.total).toFixed(2)}.` : '') +
      (metrics.totalIncome > 0
        ? ` Net savings: $${metrics.netSavings.toFixed(2)} (${metrics.savingsRate.toFixed(1)}% of income).`
        : '') +
      (anomalies.length > 0 ? ` ${anomalies.length} unusual charge${anomalies.length > 1 ? 's need' : ' needs'} review.` : '') +
      (stats.trend.direction !== 'stable'
        ? ` Spending trend is ${stats.trend.direction}.`
        : '')
    );
  },

  // Variant C: month-focused narrative
  ({ metrics, anomalies, stats }) => {
    const span = metrics.monthlyBreakdown.length;
    const avgMonthly = stats.avgMonthlyExpense;
    const top = metrics.topCategories[0];

    return (
      (span > 1
        ? `Over ${span} months, average monthly spending was $${avgMonthly.toFixed(2)}.`
        : `In this period, total spending was $${metrics.totalExpenses.toFixed(2)}.`) +
      (top
        ? ` ${top.category} led all categories at $${Math.abs(top.total).toFixed(2)} total, across ${top.count} transaction${top.count !== 1 ? 's' : ''}.`
        : '') +
      (metrics.totalIncome > 0
        ? ` Savings rate: ${metrics.savingsRate.toFixed(1)}%` +
          (metrics.savingsRate >= 20 ? ' — on target.' : ' — below the 20% benchmark.')
        : '') +
      (anomalies.length > 0
        ? ` ${anomalies.length} high-value transaction${anomalies.length !== 1 ? 's were' : ' was'} flagged for review.`
        : ' Spending patterns appear normal — no outlier transactions detected.') +
      (stats.trend.direction === 'increasing' ? ' Costs are rising month-on-month.' : '') +
      (stats.trend.direction === 'decreasing' ? ' Costs are falling month-on-month — a positive trend.' : '')
    );
  },
];

/** Select a summary template based on data characteristics for linguistic variety. */
export function composeSummary(ctx: SummaryContext): string {
  const criticalCount = ctx.findings.filter((f) => f.severity === 'critical').length;
  // Critical situations always use variant B (verdict-first for urgency)
  const idx = criticalCount > 0 ? 1 : ctx.metrics.monthlyBreakdown.length > 2 ? 2 : 0;
  return SUMMARY_VARIANTS[idx]!(ctx);
}

// ── Category reasons ──────────────────────────────────────────────────────────

export function composeCategoryReason(
  cat: CategoryStat,
  totalExpenses: number,
  findings: Finding[],
): string {
  const abs = Math.abs(cat.total);
  const pct = totalExpenses > 0 ? ((abs / totalExpenses) * 100).toFixed(0) : '0';
  const base = `$${abs.toFixed(2)} across ${cat.count} transaction${cat.count !== 1 ? 's' : ''} — ${pct}% of total expenses.`;

  const relatedFinding = findings.find(
    (f) => f.category?.toLowerCase() === cat.category.toLowerCase(),
  );
  if (relatedFinding) {
    return `${base} ${relatedFinding.body}`;
  }

  if (parseInt(pct) >= 40) {
    return `${base} This category dominates your spending profile — consider setting a monthly cap.`;
  }
  if (parseInt(pct) >= 25) {
    return `${base} A significant share of your budget; review if this aligns with your spending priorities.`;
  }
  return base;
}

// ── Anomaly reasons ───────────────────────────────────────────────────────────

export function composeAnomalyReason(anomaly: AnomalyStat): string {
  const prefix = `${anomaly.zScore.toFixed(1)} standard deviations above your average spend.`;
  if (anomaly.zScore >= 4) {
    return `${prefix} This is an extreme outlier — verify the charge with your bank or merchant.`;
  }
  if (anomaly.zScore >= 3) {
    return `${prefix} A highly unusual amount for your spending pattern — confirm it was intentional.`;
  }
  return `${prefix} Statistically significant — worth a quick review to rule out billing errors.`;
}

// ── Recommendations ───────────────────────────────────────────────────────────

export function composeRecommendations(
  metrics: MetricsJson,
  anomalies: AnomalyStat[],
  findings: Finding[],
  knowledge: KnowledgeDoc[],
  stats: EnhancedStats,
): [string, string, string] {
  const recs: string[] = [];

  // Priority 1: critical findings drive the first recommendation
  const criticalFinding = findings.find((f) => f.severity === 'critical');
  if (criticalFinding?.id === 'deficit') {
    recs.push(
      `Close the $${Math.abs(metrics.netSavings).toFixed(2)} monthly deficit immediately — audit every expense category and eliminate discretionary costs until income exceeds spending.`,
    );
  } else if (criticalFinding?.id === 'concentration-extreme') {
    const top = metrics.topCategories[0];
    recs.push(
      top
        ? `Set a strict monthly cap on ${top.category} to reduce its ${((Math.abs(top.total) / metrics.totalExpenses) * 100).toFixed(0)}% share of total spending — category concentration above 60% leaves no financial resilience.`
        : 'Diversify your spending across more categories to reduce concentration risk.',
    );
  }

  // Priority 2: savings rate
  if (recs.length < 3 && metrics.totalIncome > 0) {
    if (metrics.savingsRate < 20) {
      const gapMonthly = (0.2 * metrics.totalIncome - metrics.netSavings).toFixed(2);
      const top = metrics.topCategories[0];
      const cutClause =
        top && Math.abs(top.total) > 0
          ? ` Cutting ${top.category} spend by 15% would recover $${(Math.abs(top.total) * 0.15).toFixed(2)}/month toward that goal.`
          : '';
      recs.push(
        `Increase monthly savings by $${gapMonthly} to reach the 20% benchmark — automate a standing transfer on payday so the money moves before you can spend it.${cutClause}`,
      );
    } else if (metrics.savingsRate >= 30) {
      recs.push(
        `Your ${metrics.savingsRate.toFixed(1)}% savings rate is excellent. Ensure surplus savings are deployed into index funds or CPF top-ups — idle cash in a savings account loses to inflation annually.`,
      );
    }
  }

  // Priority 3: anomalies
  if (recs.length < 3 && anomalies.length > 0) {
    const total = anomalies.reduce((s, a) => s + Math.abs(a.amount), 0);
    recs.push(
      `Review ${anomalies.length} unusual transaction${anomalies.length > 1 ? 's' : ''} totalling $${total.toFixed(2)} — confirm each was intentional and the amount is exact. Report unrecognised charges to your bank within 60 days.`,
    );
  }

  // Priority 4: trend-based
  if (recs.length < 3 && stats.trend.direction === 'increasing') {
    recs.push(
      `Monthly expenses are rising ~$${Math.abs(stats.trend.slope).toFixed(0)}/month. Identify which categories are drifting upward and set category-level spending caps before the trend becomes structural.`,
    );
  }

  // Priority 5: top-category cap
  if (recs.length < 3) {
    const top = metrics.topCategories[0];
    if (top && metrics.totalExpenses > 0) {
      const pct = ((Math.abs(top.total) / metrics.totalExpenses) * 100).toFixed(0);
      recs.push(
        `Set a monthly budget cap for ${top.category} — at $${Math.abs(top.total).toFixed(2)} it represents ${pct}% of total expenses. A 10% reduction would free up $${(Math.abs(top.total) * 0.1).toFixed(2)} per month.`,
      );
    }
  }

  // Priority 6: knowledge-driven advice
  if (recs.length < 3 && knowledge.length > 0) {
    const doc = knowledge[recs.length];
    if (doc) {
      // Extract first sentence from the knowledge doc as the recommendation
      const firstSentence = doc.body.split('. ')[0]!;
      recs.push(`${firstSentence}.`);
    }
  }

  // Fallbacks to always fill 3 slots
  const fallbacks: string[] = [
    'Run a subscription audit — list every recurring payment, calculate the annual cost, and cancel anything used less than weekly.',
    'Automate a fixed savings transfer on payday before any discretionary spending. Consistency builds wealth; willpower does not.',
    'Track spending weekly rather than monthly. Catching category creep early is far easier than reversing a structural overspend.',
  ];
  while (recs.length < 3) {
    recs.push(fallbacks[recs.length % fallbacks.length]!);
  }

  return [recs[0]!, recs[1]!, recs[2]!];
}
