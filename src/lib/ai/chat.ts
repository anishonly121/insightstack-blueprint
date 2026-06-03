import type { ChatContext, ChatMessage } from './types';
import { KNOWLEDGE_BASE } from './knowledge/base';
import { BM25 } from './strategies/bm25';

// ── Intent taxonomy ────────────────────────────────────────────────────────────

type Intent =
  | { type: 'top-category' }
  | { type: 'category-detail'; category: string }
  | { type: 'savings-rate' }
  | { type: 'income' }
  | { type: 'total-expenses' }
  | { type: 'anomalies' }
  | { type: 'monthly-trend' }
  | { type: 'monthly-breakdown' }
  | { type: 'transaction-count' }
  | { type: 'recommendations' }
  | { type: 'greeting' }
  | { type: 'unknown'; query: string };

// ── Keyword scorers ────────────────────────────────────────────────────────────

const PATTERNS: Array<{ intent: Intent; keywords: string[] }> = [
  {
    intent: { type: 'savings-rate' },
    keywords: ['saving', 'savings', 'save', 'saved', 'savings rate', 'how much save', 'am i saving'],
  },
  {
    intent: { type: 'anomalies' },
    keywords: ['anomal', 'unusual', 'strange', 'suspicious', 'weird', 'outlier', 'fraud', 'unexpected', 'flagged'],
  },
  {
    intent: { type: 'monthly-trend' },
    keywords: ['trend', 'trending', 'increasing', 'decreasing', 'growing', 'rising', 'falling', 'over time', 'month over month'],
  },
  {
    intent: { type: 'monthly-breakdown' },
    keywords: ['monthly', 'month by month', 'each month', 'per month', 'breakdown', 'january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'],
  },
  {
    intent: { type: 'income' },
    keywords: ['income', 'earn', 'earned', 'salary', 'revenue', 'inflow', 'how much make', 'how much did i earn'],
  },
  {
    intent: { type: 'total-expenses' },
    keywords: ['total', 'spent', 'spend', 'overall', 'how much spend', 'total expense', 'total cost'],
  },
  {
    intent: { type: 'top-category' },
    keywords: ['top', 'highest', 'most', 'biggest', 'largest', 'dominant', 'category', 'categories', 'where spend', 'what spend'],
  },
  {
    intent: { type: 'recommendations' },
    keywords: ['recommend', 'advice', 'tip', 'suggestion', 'improve', 'better', 'how to', 'what should', 'help'],
  },
  {
    intent: { type: 'transaction-count' },
    keywords: ['how many', 'count', 'number of', 'transactions', 'entries'],
  },
  {
    intent: { type: 'greeting' },
    keywords: ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening', 'howdy', 'what can you'],
  },
];

function detectIntent(message: string, ctx: ChatContext): Intent {
  const lower = message.toLowerCase();

  // Check for specific category name mention first
  for (const cat of ctx.metrics.topCategories) {
    if (lower.includes(cat.category.toLowerCase())) {
      return { type: 'category-detail', category: cat.category };
    }
  }

  // Score each intent pattern
  let bestScore = 0;
  let bestIntent: Intent = { type: 'unknown', query: message };

  for (const { intent, keywords } of PATTERNS) {
    const score = keywords.reduce((s, kw) => s + (lower.includes(kw) ? 1 : 0), 0);
    if (score > bestScore) {
      bestScore = score;
      bestIntent = intent;
    }
  }

  return bestScore > 0 ? bestIntent : { type: 'unknown', query: message };
}

// ── Answer generators ─────────────────────────────────────────────────────────

const retriever = new BM25(KNOWLEDGE_BASE);

function answerTopCategory(ctx: ChatContext): string {
  const { metrics } = ctx;
  if (metrics.topCategories.length === 0) return 'No category data is available in this dataset.';

  const top = metrics.topCategories[0]!;
  const pct = metrics.totalExpenses > 0
    ? ((Math.abs(top.total) / metrics.totalExpenses) * 100).toFixed(0)
    : '0';

  const lines = [
    `Your top spending categories are:`,
    ...metrics.topCategories.slice(0, 5).map((c, i) => {
      const share = metrics.totalExpenses > 0
        ? ((Math.abs(c.total) / metrics.totalExpenses) * 100).toFixed(0)
        : '0';
      return `  ${i + 1}. ${c.category}: $${Math.abs(c.total).toFixed(2)} (${share}%, ${c.count} transaction${c.count !== 1 ? 's' : ''})`;
    }),
    '',
    `${top.category} leads at ${pct}% of total expenses.` +
      (parseInt(pct) > 40
        ? ' This concentration is high — a monthly cap would reduce budget fragility.'
        : ''),
  ];
  return lines.join('\n');
}

function answerCategoryDetail(ctx: ChatContext, category: string): string {
  const { metrics } = ctx;
  const cat = metrics.topCategories.find(
    (c) => c.category.toLowerCase() === category.toLowerCase(),
  );
  if (!cat) {
    return `I don't see "${category}" as a top spending category in this dataset. The categories I can see are: ${metrics.topCategories.map((c) => c.category).join(', ')}.`;
  }

  const pct =
    metrics.totalExpenses > 0
      ? ((Math.abs(cat.total) / metrics.totalExpenses) * 100).toFixed(0)
      : '0';
  const avg = cat.count > 0 ? (Math.abs(cat.total) / cat.count).toFixed(2) : '0';

  const docs = retriever.retrieve(category, 1);
  const tip = docs[0] ? `\n\nTip: ${docs[0].body.split('. ')[0]}.` : '';

  return (
    `${category} details:\n` +
    `  Total: $${Math.abs(cat.total).toFixed(2)}\n` +
    `  Transactions: ${cat.count}\n` +
    `  Average per transaction: $${avg}\n` +
    `  Share of total expenses: ${pct}%` +
    tip
  );
}

function answerSavingsRate(ctx: ChatContext): string {
  const { metrics } = ctx;
  if (metrics.totalIncome === 0) {
    return 'This dataset has no income transactions, so savings rate cannot be calculated. Add salary or income rows to enable this metric.';
  }

  const rate = metrics.savingsRate;
  const verdict =
    rate < 0
      ? 'You are spending more than you earn — this is a deficit that must be addressed immediately.'
      : rate < 10
      ? `${rate.toFixed(1)}% is critically low — significantly below the recommended 20%.`
      : rate < 20
      ? `${rate.toFixed(1)}% is below the 20% benchmark. You need to save $${((0.2 * metrics.totalIncome) - metrics.netSavings).toFixed(2)} more per month to hit the target.`
      : rate < 35
      ? `${rate.toFixed(1)}% — on target. The standard benchmark is 20%.`
      : `${rate.toFixed(1)}% — excellent. This is well above the 20% benchmark and puts you on a path to financial independence.`;

  return (
    `Savings rate: ${rate.toFixed(1)}%\n\n` +
    `  Income: $${metrics.totalIncome.toFixed(2)}\n` +
    `  Expenses: $${metrics.totalExpenses.toFixed(2)}\n` +
    `  Net savings: $${metrics.netSavings.toFixed(2)}\n\n` +
    verdict
  );
}

function answerIncome(ctx: ChatContext): string {
  const { metrics } = ctx;
  if (metrics.totalIncome === 0) {
    return 'No income transactions were found in this dataset. Only expense entries are present. To see income analysis, include salary credits or tag income rows in your CSV.';
  }
  const byMonth = metrics.monthlyBreakdown.filter((m) => m.income > 0);
  const monthSummary =
    byMonth.length > 0
      ? '\n\nIncome by month:\n' +
        byMonth.map((m) => `  ${m.month}: $${m.income.toFixed(2)}`).join('\n')
      : '';
  return (
    `Total income: $${metrics.totalIncome.toFixed(2)}\n` +
    (byMonth.length > 1
      ? `Average monthly income: $${(metrics.totalIncome / byMonth.length).toFixed(2)}`
      : '') +
    monthSummary
  );
}

function answerTotalExpenses(ctx: ChatContext): string {
  const { metrics } = ctx;
  const top = metrics.topCategories[0];
  return (
    `Total expenses: $${metrics.totalExpenses.toFixed(2)}\n` +
    `Transactions: ${metrics.transactionCount}\n` +
    `Average per transaction: $${Math.abs(metrics.avgTransaction).toFixed(2)}\n` +
    (top ? `Largest category: ${top.category} ($${Math.abs(top.total).toFixed(2)})` : '')
  );
}

function answerAnomalies(ctx: ChatContext): string {
  const { anomalies } = ctx;
  if (anomalies.length === 0) {
    return 'No statistically unusual transactions were detected in this dataset. All charges fall within 2 standard deviations of your average spend.';
  }

  const total = anomalies.reduce((s, a) => s + Math.abs(a.amount), 0);
  const lines = [
    `${anomalies.length} unusual transaction${anomalies.length > 1 ? 's' : ''} detected (${anomalies.length > 1 ? 'each' : ''} >2 standard deviations above average):`,
    '',
    ...anomalies.map(
      (a) =>
        `  • ${a.date} — ${a.description} ($${Math.abs(a.amount).toFixed(2)}, ${a.zScore.toFixed(1)}σ) [${a.category}]`,
    ),
    '',
    `Combined value: $${total.toFixed(2)}. Review each for billing errors or unrecognised charges.`,
  ];
  return lines.join('\n');
}

function answerMonthlyTrend(ctx: ChatContext): string {
  const { metrics, enhancedStats } = ctx;
  const breakdown = [...metrics.monthlyBreakdown].sort((a, b) =>
    a.month.localeCompare(b.month),
  );
  if (breakdown.length < 2) {
    return 'Not enough monthly data to detect a trend — at least 2 months of transactions are required.';
  }

  const direction = enhancedStats.trend.direction;
  const slope = Math.abs(enhancedStats.trend.slope).toFixed(0);
  const verdict =
    direction === 'increasing'
      ? `Expenses are trending up by ~$${slope}/month. This may indicate lifestyle inflation.`
      : direction === 'decreasing'
      ? `Expenses are trending down by ~$${slope}/month — a positive signal.`
      : 'Expenses are relatively stable month-to-month.';

  return verdict + '\n\nMonthly expenses:\n' +
    breakdown.map((m) => `  ${m.month}: $${m.expenses.toFixed(2)}`).join('\n');
}

function answerMonthlyBreakdown(ctx: ChatContext): string {
  const { metrics } = ctx;
  const breakdown = [...metrics.monthlyBreakdown].sort((a, b) =>
    a.month.localeCompare(b.month),
  );
  if (breakdown.length === 0) return 'No monthly breakdown data available.';

  const lines = [
    'Monthly breakdown:',
    '',
    ...breakdown.map(
      (m) =>
        `  ${m.month}  Income: $${m.income.toFixed(2)}  Expenses: $${m.expenses.toFixed(2)}  Net: $${m.net.toFixed(2)}`,
    ),
  ];
  return lines.join('\n');
}

function answerTransactionCount(ctx: ChatContext): string {
  const { metrics } = ctx;
  const span = metrics.monthlyBreakdown.length;
  const perMonth = span > 0 ? (metrics.transactionCount / span).toFixed(1) : null;
  return (
    `Total transactions: ${metrics.transactionCount}` +
    (span > 1 ? `\nMonths covered: ${span}\nAverage per month: ${perMonth}` : '')
  );
}

function answerRecommendations(ctx: ChatContext): string {
  const { metrics, anomalies, enhancedStats } = ctx;
  const recs: string[] = [];

  if (metrics.totalIncome > 0 && metrics.savingsRate < 20) {
    recs.push(
      `Increase savings by $${((0.2 * metrics.totalIncome) - metrics.netSavings).toFixed(2)}/month to reach the 20% benchmark. Automate this as a standing transfer on payday.`,
    );
  }
  if (anomalies.length > 0) {
    recs.push(
      `Review ${anomalies.length} unusual transaction${anomalies.length > 1 ? 's' : ''} for billing errors or unrecognised charges — dispute windows close after 60 days.`,
    );
  }
  if (enhancedStats.trend.direction === 'increasing') {
    recs.push(
      `Monthly expenses are rising ~$${Math.abs(enhancedStats.trend.slope).toFixed(0)}/month. Set category-level caps on your top spending areas before the trend becomes structural.`,
    );
  }
  if (recs.length < 3) {
    const top = metrics.topCategories[0];
    if (top) {
      const pct = ((Math.abs(top.total) / Math.max(metrics.totalExpenses, 1)) * 100).toFixed(0);
      recs.push(`${top.category} is ${pct}% of total expenses. A 10% reduction saves $${(Math.abs(top.total) * 0.1).toFixed(2)}/month.`);
    }
  }

  const fallbacks = [
    'Run a subscription audit — cancel everything unused in the past 30 days.',
    'Pay yourself first: transfer savings on payday before any discretionary spending.',
    'Track spending weekly, not monthly — catching drift early is far easier than reversing it.',
  ];
  while (recs.length < 3) recs.push(fallbacks[recs.length % fallbacks.length]!);

  return 'Recommendations:\n\n' + recs.map((r, i) => `${i + 1}. ${r}`).join('\n\n');
}

function answerGreeting(ctx: ChatContext): string {
  return (
    `Hello! I'm your FinanceAI assistant for "${ctx.datasetName}". I can help you understand:\n\n` +
    `• Top spending categories and category details\n` +
    `• Savings rate and income analysis\n` +
    `• Unusual or suspicious transactions\n` +
    `• Monthly trends and breakdowns\n` +
    `• Personalised recommendations\n\n` +
    `What would you like to know?`
  );
}

function answerUnknown(query: string, ctx: ChatContext): string {
  // Fall back to BM25 knowledge retrieval for general finance questions
  const docs = retriever.retrieve(query, 2);
  if (docs.length > 0) {
    return (
      `Here's what I know that might be relevant:\n\n` +
      docs.map((d) => d.body).join('\n\n') +
      `\n\nFor specific questions about "${ctx.datasetName}", try asking about your top categories, savings rate, or unusual transactions.`
    );
  }
  return (
    `I can answer questions about your spending data in "${ctx.datasetName}". Try asking:\n` +
    `• "What did I spend most on?"\n` +
    `• "What's my savings rate?"\n` +
    `• "Are there any unusual transactions?"\n` +
    `• "How is my spending trending?"\n` +
    `• "Give me some recommendations"`
  );
}

// ── Conversation context tracking ─────────────────────────────────────────────

function resolveReferentialIntent(
  message: string,
  history: ChatMessage[],
  ctx: ChatContext,
): Intent | null {
  const lower = message.toLowerCase();
  const referential = ['that', 'it', 'this', 'the same', 'above', 'mentioned'];
  if (!referential.some((r) => lower.includes(r))) return null;

  // Look at the last assistant message to infer what "that" refers to
  const lastAssistant = [...history].reverse().find((m) => m.role === 'assistant');
  if (!lastAssistant) return null;

  const prevContent = lastAssistant.content.toLowerCase();
  for (const cat of ctx.metrics.topCategories) {
    if (prevContent.includes(cat.category.toLowerCase())) {
      return { type: 'category-detail', category: cat.category };
    }
  }
  if (prevContent.includes('saving')) return { type: 'savings-rate' };
  if (prevContent.includes('anomal') || prevContent.includes('unusual')) return { type: 'anomalies' };

  return null;
}

// ── Public API ─────────────────────────────────────────────────────────────────

export function generateChatAnswer(
  message: string,
  history: ChatMessage[],
  ctx: ChatContext,
): string {
  // Try referential resolution first ("what about that?")
  const resolvedIntent = resolveReferentialIntent(message, history, ctx);
  const intent = resolvedIntent ?? detectIntent(message, ctx);

  switch (intent.type) {
    case 'top-category':       return answerTopCategory(ctx);
    case 'category-detail':    return answerCategoryDetail(ctx, intent.category);
    case 'savings-rate':       return answerSavingsRate(ctx);
    case 'income':             return answerIncome(ctx);
    case 'total-expenses':     return answerTotalExpenses(ctx);
    case 'anomalies':          return answerAnomalies(ctx);
    case 'monthly-trend':      return answerMonthlyTrend(ctx);
    case 'monthly-breakdown':  return answerMonthlyBreakdown(ctx);
    case 'transaction-count':  return answerTransactionCount(ctx);
    case 'recommendations':    return answerRecommendations(ctx);
    case 'greeting':           return answerGreeting(ctx);
    case 'unknown':            return answerUnknown(intent.query, ctx);
  }
}

/** Async generator that yields the answer in sentence-sized chunks for SSE streaming. */
export async function* streamChatAnswer(
  message: string,
  history: ChatMessage[],
  ctx: ChatContext,
): AsyncGenerator<string> {
  const answer = generateChatAnswer(message, history, ctx);
  // Stream line-by-line so the UI fills in progressively
  const lines = answer.split('\n');
  for (const line of lines) {
    yield line + '\n';
  }
}
