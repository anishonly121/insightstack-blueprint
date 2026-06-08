import type { MetricsJson, AnomalyStat, EngineOutput, EnhancedStats, HealthScore } from './types';
import { evaluateRules } from './strategies/rules';
import { detectTrend, computeHHI, computeMonthlyVolatility, forecastNextMonth } from './strategies/statistical';
import { BM25 } from './strategies/bm25';
import { KNOWLEDGE_BASE } from './knowledge/base';
import {
  composeSummary,
  composeCategoryReason,
  composeAnomalyReason,
  composeRecommendations,
} from './nlg/composer';

export const FINANCE_AI_MODEL = 'finance-ai-v1';

const knowledgeRetriever = new BM25(KNOWLEDGE_BASE);

/**
 * Derive enhanced statistics from pre-computed metrics.
 * These feed into both the rule engine and the NLG composer.
 */
export function computeEnhancedStats(metrics: MetricsJson): EnhancedStats {
  const trend = detectTrend(metrics.monthlyBreakdown);
  const concentration = computeHHI(metrics.topCategories, metrics.totalExpenses);
  const monthCount = metrics.monthlyBreakdown.length;
  const avgMonthlyExpense =
    monthCount > 0 ? metrics.totalExpenses / monthCount : metrics.totalExpenses;

  const topCategoryShare =
    metrics.totalExpenses > 0 && metrics.topCategories[0]
      ? Math.abs(metrics.topCategories[0].total) / metrics.totalExpenses
      : 0;

  return {
    trend,
    concentration: Number(concentration.toFixed(4)),
    topCategoryShare: Number(topCategoryShare.toFixed(4)),
    monthCount,
    avgMonthlyExpense: Number(avgMonthlyExpense.toFixed(2)),
  };
}

/**
 * Build a BM25 query from the user's financial situation.
 * This lets us retrieve the most contextually relevant knowledge documents
 * rather than blindly returning the first N entries.
 */
function buildRetrievalQuery(metrics: MetricsJson, anomalies: AnomalyStat[], stats: EnhancedStats): string {
  const parts: string[] = [];

  if (metrics.totalIncome > 0) {
    if (metrics.savingsRate < 0) parts.push('deficit spending exceeds income');
    else if (metrics.savingsRate < 10) parts.push('savings rate critically low');
    else if (metrics.savingsRate < 20) parts.push('savings rate below target');
    else if (metrics.savingsRate >= 35) parts.push('high savings rate optimise investment');
  } else {
    parts.push('no income data expenses only');
  }

  if (stats.topCategoryShare > 0.4) {
    const top = metrics.topCategories[0];
    parts.push(`high concentration ${top?.category ?? 'category'} spending`);
  }

  if (anomalies.length > 0) parts.push('unusual transactions anomaly fraud review');
  if (stats.trend.direction === 'increasing') parts.push('spending trend increasing lifestyle inflation');
  if (stats.trend.direction === 'decreasing') parts.push('spending decreasing improving savings');

  // Category-specific hints
  for (const cat of metrics.topCategories.slice(0, 3)) {
    parts.push(cat.category.toLowerCase());
  }

  return parts.join(' ');
}

/**
 * Derive a confidence score for the overall analysis.
 *
 * Confidence is higher when:
 *   - More transactions (better statistical basis)
 *   - Multiple months of data (temporal patterns are more reliable)
 *   - More rule findings (the engine found concrete issues, not just defaults)
 */
function deriveConfidence(
  metrics: MetricsJson,
  findingCount: number,
  stats: EnhancedStats,
): number {
  let score = 0.5; // base
  if (metrics.transactionCount >= 20) score += 0.1;
  if (metrics.transactionCount >= 50) score += 0.1;
  if (stats.monthCount >= 2) score += 0.1;
  if (stats.monthCount >= 4) score += 0.1;
  if (findingCount >= 2) score += 0.1;
  return Number(Math.min(score, 0.98).toFixed(2));
}

/**
 * Composite financial health score (0–100) from five weighted components:
 *   savings rate (45%), spending concentration (20%), trend direction (15%),
 *   anomaly count (10%), deficit/surplus (10%).
 *
 * Thresholds are informed by standard personal-finance benchmarks
 * (20% savings target, HHI < 0.15 = diversified, 2σ anomaly threshold).
 */
function computeHealthScore(
  metrics: MetricsJson,
  anomalies: AnomalyStat[],
  stats: EnhancedStats,
): HealthScore {
  const sr = metrics.savingsRate;
  const savingsComponent =
    sr <= 0  ? 0
    : sr < 5  ? 15
    : sr < 10 ? 30
    : sr < 15 ? 45
    : sr < 20 ? 60
    : sr < 30 ? 75
    : sr < 40 ? 88
    : 100;

  // Lower HHI = better diversification → higher score
  const concentrationComponent = Math.max(0, Math.round(100 - stats.concentration * 300));

  const trendComponent =
    stats.trend.direction === 'decreasing' ? 90
    : stats.trend.direction === 'stable'   ? 70
    : 35;

  const anomalyComponent = Math.max(0, 100 - anomalies.length * 25);

  const deficitComponent = metrics.netSavings >= 0 ? 100 : 0;

  const score = Math.min(100, Math.max(0, Math.round(
    savingsComponent * 0.45 +
    concentrationComponent * 0.20 +
    trendComponent * 0.15 +
    anomalyComponent * 0.10 +
    deficitComponent * 0.10,
  )));

  const grade: HealthScore['grade'] =
    score >= 85 ? 'excellent'
    : score >= 70 ? 'good'
    : score >= 50 ? 'fair'
    : score >= 30 ? 'poor'
    : 'critical';

  return {
    score,
    grade,
    breakdown: { savingsComponent, concentrationComponent, trendComponent, anomalyComponent },
  };
}

/**
 * Core analysis engine.
 * Runs all strategies and composes a structured EngineOutput.
 */
export function generateInsights(metrics: MetricsJson, anomalies: AnomalyStat[]): EngineOutput {
  const stats = computeEnhancedStats(metrics);

  // Strategy 1: Expert rule evaluation
  const findings = evaluateRules(metrics, anomalies, stats);

  // Strategy 2: BM25 knowledge retrieval — context-aware document selection
  const query = buildRetrievalQuery(metrics, anomalies, stats);
  const retrieved = knowledgeRetriever.retrieve(query, 4);

  // Strategy 3: NLG composition
  const summary = composeSummary({ metrics, anomalies, findings, stats });

  const topSpendingCategories = metrics.topCategories.slice(0, 5).map((cat) => ({
    category: cat.category,
    amount: Math.abs(cat.total),
    reason: composeCategoryReason(cat, metrics.totalExpenses, findings),
  }));

  const anomaliesOutput = anomalies.map((a) => ({
    date: a.date,
    description: a.description,
    category: a.category,
    amount: a.amount,
    reason: composeAnomalyReason(a),
    zScore: a.zScore,
  }));

  const recommendations = composeRecommendations(
    metrics,
    anomalies,
    findings,
    retrieved,
    stats,
  );

  const confidence = deriveConfidence(metrics, findings.length, stats);
  const forecast = forecastNextMonth(metrics.monthlyBreakdown);
  const healthScore = computeHealthScore(metrics, anomalies, stats);

  return {
    summary,
    topSpendingCategories,
    anomalies: anomaliesOutput,
    recommendations,
    findings,
    confidence,
    model: FINANCE_AI_MODEL,
    forecast,
    healthScore,
  };
}

/**
 * Same as generateInsights but returns the summary as an async generator of text chunks.
 * Used by the streaming endpoint to emit SSE delta events progressively.
 */
export async function* streamInsightSummary(
  metrics: MetricsJson,
  anomalies: AnomalyStat[],
): AsyncGenerator<string> {
  const output = generateInsights(metrics, anomalies);

  // Emit preamble
  yield `**Financial Intelligence Report**\n\n`;

  // Stream the summary sentence-by-sentence
  const sentences = output.summary.match(/[^.!?]+[.!?]+/g) ?? [output.summary];
  for (const sentence of sentences) {
    yield sentence.trim() + ' ';
  }

  yield `\n\n`;

  // Emit top categories section
  if (output.topSpendingCategories.length > 0) {
    yield `**Top Spending Categories:**\n`;
    for (const cat of output.topSpendingCategories) {
      yield `• ${cat.category}: $${cat.amount.toFixed(2)}\n`;
    }
    yield `\n`;
  }

  // Emit key findings
  const criticalFindings = output.findings.filter((f) => f.severity === 'critical');
  const warningFindings = output.findings.filter((f) => f.severity === 'warning');
  const notable = [...criticalFindings, ...warningFindings].slice(0, 2);
  if (notable.length > 0) {
    yield `**Key Findings:**\n`;
    for (const f of notable) {
      yield `• ${f.title}: ${f.body}\n`;
    }
    yield `\n`;
  }

  // Emit recommendations
  yield `**Recommendations:**\n`;
  for (let i = 0; i < output.recommendations.length; i++) {
    yield `${i + 1}. ${output.recommendations[i]}\n`;
  }

  return output;
}
