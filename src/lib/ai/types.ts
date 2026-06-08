import type { AnomalyStat, CategoryStat, MetricsJson } from '../metrics';

export type { AnomalyStat, CategoryStat, MetricsJson };

export type Severity = 'info' | 'warning' | 'critical';
export type FindingType = 'statistical' | 'rule' | 'pattern';

export interface Finding {
  id: string;
  type: FindingType;
  severity: Severity;
  category?: string;
  title: string;
  body: string;
  amount?: number;
  confidence: number;
  tags: string[];
}

export interface TrendResult {
  slope: number;
  direction: 'increasing' | 'decreasing' | 'stable';
}

export interface EnhancedStats {
  trend: TrendResult;
  /** Herfindahl-Hirschman Index — 0 (perfectly diversified) to 1 (single category) */
  concentration: number;
  /** Top category as a fraction of total expenses, 0–1 */
  topCategoryShare: number;
  monthCount: number;
  avgMonthlyExpense: number;
}

/** OLS forecast for next month's expenses with RMSE-based 95% confidence interval. */
export interface ForecastResult {
  predicted: number;
  lower: number;
  upper: number;
  basisMonths: number;
}

/** Composite financial health score (0–100) derived from five weighted components. */
export interface HealthScore {
  score: number;
  grade: 'critical' | 'poor' | 'fair' | 'good' | 'excellent';
  breakdown: {
    savingsComponent: number;
    concentrationComponent: number;
    trendComponent: number;
    anomalyComponent: number;
  };
}

export interface EngineOutput {
  summary: string;
  topSpendingCategories: Array<{ category: string; amount: number; reason: string }>;
  anomalies: Array<{
    date: string;
    description: string;
    category: string;
    amount: number;
    reason: string;
    zScore: number;
  }>;
  recommendations: [string, string, string];
  findings: Finding[];
  confidence: number;
  model: string;
  forecast: ForecastResult | null;
  healthScore: HealthScore;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatContext {
  datasetName: string;
  metrics: MetricsJson;
  anomalies: AnomalyStat[];
  enhancedStats: EnhancedStats;
}
