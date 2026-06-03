/**
 * FinanceAI — Multi-Strategy Financial Intelligence Engine
 *
 * Architecture:
 *   1. BM25 Retrieval   — probabilistic information retrieval (Elasticsearch-class algorithm)
 *   2. Expert Rules     — typed financial domain rules with confidence scoring
 *   3. Statistical ML   — linear regression (trend), HHI (concentration), OLS volatility
 *   4. NLG Composer     — multi-template natural language generation
 *   5. Intent Chat      — keyword-scored intent detection with referential resolution
 *
 * No external AI API required. Zero latency, zero cost, fully private.
 */

export { generateInsights, streamInsightSummary, computeEnhancedStats, FINANCE_AI_MODEL } from './engine';
export { generateChatAnswer, streamChatAnswer } from './chat';
export type { EngineOutput, ChatMessage, ChatContext, EnhancedStats, Finding } from './types';
