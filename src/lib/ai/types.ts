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

export interface EngineOutput {
  summary: string;
  topSpendingCategories: Array<{ category: string; amount: number; reason: string }>;
  anomalies: Array<{
    date: string;
    description: string;
    category: string;
    amount: number;
    reason: string;
  }>;
  recommendations: [string, string, string];
  findings: Finding[];
  confidence: number;
  model: string;
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
