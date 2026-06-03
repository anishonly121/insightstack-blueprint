export interface KnowledgeDoc {
  id: string;
  topic: string;
  tags: string[];
  body: string;
}

export const KNOWLEDGE_BASE: KnowledgeDoc[] = [
  {
    id: 'savings-rate-20',
    topic: 'savings rate target',
    tags: ['savings', 'rate', 'income', 'goal', 'percent', 'twenty'],
    body: 'A 20% savings rate is the standard benchmark for long-term financial health. Savings rate is calculated as (income minus expenses) divided by income. Below 10% puts retirement goals at significant risk. If reaching 20% feels impossible, start at 5% and increase by 1% each month — small consistent steps create lasting habits without triggering lifestyle shock.',
  },
  {
    id: 'savings-deficit',
    topic: 'spending exceeds income',
    tags: ['deficit', 'overspending', 'income', 'expenses', 'budget', 'critical', 'negative'],
    body: 'When monthly expenses exceed income you are drawing down savings or accumulating debt. The first step is a spending audit: categorise every transaction and identify discretionary costs that can be cut immediately. Fixed costs like rent and subscriptions often have more room than they appear — renegotiate, downgrade, or cancel. Target a balanced budget within 30 days and a positive savings rate within 60.',
  },
  {
    id: 'emergency-fund',
    topic: 'emergency fund',
    tags: ['emergency', 'fund', 'savings', 'buffer', 'reserve', 'job', 'loss', 'safety'],
    body: 'A 3-6 month emergency fund is non-negotiable. Without it, any unexpected expense (medical, job loss, car repair) becomes debt. Keep it in a high-yield savings account, not invested, because you may need it in a market downturn. Build it before aggressively paying down low-interest debt or investing. Once built, replenish it within 3 months of any withdrawal.',
  },
  {
    id: 'fifty-thirty-twenty',
    topic: '50/30/20 budgeting rule',
    tags: ['budget', 'rule', 'needs', 'wants', 'savings', 'fifty', 'thirty', 'twenty', 'allocation'],
    body: 'The 50/30/20 rule allocates 50% of after-tax income to needs (rent, utilities, groceries, minimum debt payments), 30% to wants (dining, entertainment, shopping), and 20% to savings and debt repayment. If needs exceed 50%, the first lever is housing cost — rent above 30% of income is a structural problem. If wants dominate, subscription audits and dining limits are the fastest wins.',
  },
  {
    id: 'dining-high',
    topic: 'high dining and food spending',
    tags: ['dining', 'food', 'restaurant', 'eating', 'takeaway', 'delivery', 'groceries', 'meals'],
    body: 'Food is one of the most controllable expense categories. Dining out and food delivery typically cost 3-5x home cooking per meal. Strategies: cook in batches on weekends, limit restaurant meals to a fixed weekly count, delete food delivery apps (convenience is the enemy of budgets), switch to groceries-first spending. A meal planning habit consistently reduces food spend by 30-40%.',
  },
  {
    id: 'transport-high',
    topic: 'high transport costs',
    tags: ['transport', 'car', 'fuel', 'commute', 'taxi', 'grab', 'uber', 'mrt', 'bus', 'travel'],
    body: 'Transport often becomes the invisible large category. Car ownership total cost (loan, insurance, fuel, parking, maintenance) typically runs $1,000-1,500 per month. Strategies: compare ride-hailing monthly spend versus owning, use public transport for predictable routes, consolidate errands into single trips. If you use ride-hailing daily, a monthly pass or bicycle may eliminate 60-80% of that cost.',
  },
  {
    id: 'subscriptions-audit',
    topic: 'subscription spending',
    tags: ['subscription', 'recurring', 'streaming', 'software', 'membership', 'cancel', 'monthly'],
    body: 'Subscription creep is one of the most common budget traps — small recurring charges accumulate invisibly. Audit quarterly: list every recurring payment, calculate annual cost, and cancel anything used less than weekly. Streaming: pick one primary service and rotate others monthly. Software: use free tiers or one-time purchase alternatives where possible. The test: if you forgot you had it, cancel it.',
  },
  {
    id: 'concentration-risk',
    topic: 'spending concentrated in one category',
    tags: ['concentration', 'category', 'dominant', 'single', 'risk', 'spread', 'balance'],
    body: 'When a single spending category accounts for more than 35% of total expenses, any increase in that category has an outsized budget impact. Diversify your spending profile by identifying the drivers within the dominant category and setting a monthly cap. High concentration in discretionary categories (dining, shopping) is behavioural; in fixed costs (rent) it requires structural changes like relocation or income growth.',
  },
  {
    id: 'anomaly-fraud',
    topic: 'unusual or suspicious transactions',
    tags: ['anomaly', 'unusual', 'suspicious', 'fraud', 'duplicate', 'error', 'overcharge', 'unexpected'],
    body: 'High-value unusual transactions fall into three categories: intentional large purchases, billing errors, or fraud. Review each flagged transaction: does it match your memory, is the amount exact, is the merchant legitimate? Contact your bank immediately for unrecognised charges — dispute windows are typically 60 days. Enable real-time transaction notifications so anomalies surface within hours, not at month-end review.',
  },
  {
    id: 'trend-increasing',
    topic: 'increasing spending trend',
    tags: ['trend', 'increasing', 'growing', 'inflation', 'lifestyle', 'creep', 'rising'],
    body: 'A consistently rising expense trend, even without a single dramatic spike, signals lifestyle inflation. This is common during career income growth — expenses silently expand to match income. Counter it by maintaining your pre-raise budget for 6 months after any salary increase, redirecting the delta to savings. Identify which categories are drifting upward month over month and set category-level caps.',
  },
  {
    id: 'trend-decreasing',
    topic: 'decreasing spending trend',
    tags: ['trend', 'decreasing', 'improving', 'progress', 'reducing', 'falling', 'better'],
    body: 'A consistently falling expense trend is a strong positive signal — your financial habits are improving. Confirm it is intentional (better habits) rather than circumstantial (temporary life event). Lock in the savings gains: once expenses decrease, automate the difference into savings before you have a chance to spend it. Review which categories drove the reduction and protect those gains actively.',
  },
  {
    id: 'healthcare-high',
    topic: 'high healthcare spending',
    tags: ['healthcare', 'medical', 'health', 'doctor', 'hospital', 'insurance', 'pharmacy', 'medicine'],
    body: 'High healthcare costs can be partly controlled through prevention (annual check-ups catch expensive conditions early), insurance optimisation (review your plan annually), and cost comparison (generic drugs cost 70-90% less than branded). Keep receipts for tax-deductible medical expenses. If healthcare routinely exceeds 10% of income, review your insurance coverage — you may be under-insured and paying out-of-pocket what insurance should cover.',
  },
  {
    id: 'shopping-impulsive',
    topic: 'high shopping or retail spending',
    tags: ['shopping', 'retail', 'impulse', 'ecommerce', 'online', 'fashion', 'clothes', 'purchase'],
    body: 'Retail and shopping costs are highly compressible. Impulse control tactics: add a 24-hour waiting period before any online purchase, unsubscribe from all promotional emails, remove saved payment methods. For clothing: build a capsule wardrobe of versatile pieces and implement a one-in-one-out rule. Set a monthly discretionary shopping limit and track it in real time — visibility creates accountability.',
  },
  {
    id: 'investment-basics',
    topic: 'investing surplus savings',
    tags: ['invest', 'investment', 'index', 'fund', 'stock', 'portfolio', 'wealth', 'grow'],
    body: 'Cash in a savings account loses value to inflation over time. Once you have a 3-6 month emergency fund, invest surplus savings. Low-cost index funds tracking broad markets outperform most actively managed funds over 10+ years due to lower fees. Automate monthly contributions. Avoid timing the market — time in the market beats timing the market over long horizons. Start small and increase with each raise.',
  },
  {
    id: 'debt-high-interest',
    topic: 'high-interest debt repayment',
    tags: ['debt', 'credit', 'card', 'interest', 'loan', 'repayment', 'borrow', 'owe'],
    body: 'Credit card debt at 20-26% interest is the most expensive money in personal finance. Paying the minimum sustains the debt indefinitely. Strategies: avalanche method (pay highest-interest debt first, mathematically optimal) or snowball method (pay smallest balance first, psychologically motivating). Temporarily pause all discretionary spending until high-interest debt is cleared — the guaranteed 25% return on repayment beats any investment.',
  },
  {
    id: 'budget-automation',
    topic: 'automating savings and budgets',
    tags: ['automate', 'automation', 'transfer', 'savings', 'direct', 'payday', 'standing', 'order'],
    body: 'Behaviour change is unreliable; automation is not. The most effective financial habit is automating savings on payday before spending. Set up standing orders to sweep a fixed amount to savings and investment accounts the day salary arrives. What is not in your spending account cannot be spent. Automate minimum debt payments to avoid late fees. Review and increase automation amounts with every salary increase.',
  },
  {
    id: 'income-irregular',
    topic: 'irregular or fluctuating income',
    tags: ['income', 'irregular', 'freelance', 'variable', 'commission', 'bonus', 'self-employed'],
    body: 'Irregular income requires a base-budget approach: calculate your lowest expected monthly income for the past 12 months and budget only to that floor. In high-income months, direct the surplus to an income-smoothing buffer (separate from the emergency fund). Pay yourself a consistent salary from this buffer. Avoid basing your lifestyle on peak months — the floor is your real income for budgeting purposes.',
  },
  {
    id: 'category-budget-cap',
    topic: 'setting category spending limits',
    tags: ['budget', 'category', 'cap', 'limit', 'overspend', 'control', 'envelope'],
    body: 'Category caps convert abstract budgeting goals into concrete limits. Set caps based on your income allocation target (50/30/20) and historical spend. Review caps quarterly — after 3 months of consistent tracking, you will have enough data to set realistic but challenging limits. Use envelope or virtual envelope budgeting: when a category is exhausted for the month, spending stops. No exceptions builds the habit; habitual exceptions defeat it.',
  },
  {
    id: 'monthly-review',
    topic: 'monthly budget review habit',
    tags: ['review', 'monthly', 'habit', 'track', 'check', 'progress', 'analyse'],
    body: 'A monthly 20-minute financial review is the single highest-ROI personal finance habit. Review: did spending stay within each category cap, what drove any overruns, what changed from last month. The goal is not perfection but pattern awareness. Catching a category creeping upward in month two prevents it becoming structural by month six. Schedule it like an appointment — it earns more per hour than almost any other activity.',
  },
  {
    id: 'utilities-reduce',
    topic: 'reducing utility costs',
    tags: ['utilities', 'electricity', 'water', 'gas', 'bill', 'reduce', 'energy', 'aircon'],
    body: 'Utility costs are reducible with low upfront effort. Electricity: set air conditioning to 25°C (each degree lower increases consumption 10%), switch to LED lighting, unplug standby devices. Water: fix leaks immediately, install low-flow fittings. Review your plan annually — utility providers often have cheaper plans for loyal customers who simply ask. Smart plugs identify the highest-consumption devices in under an hour.',
  },
  {
    id: 'insurance-review',
    topic: 'reviewing insurance coverage',
    tags: ['insurance', 'coverage', 'premium', 'policy', 'health', 'life', 'review', 'plan'],
    body: 'Insurance premiums should be reviewed annually. Common over-insurance: paying for hospital plans when employer coverage is comprehensive, redundant travel insurance included with credit cards. Common under-insurance: insufficient disability coverage (40% of workers face a disability claim before retirement), inadequate personal accident, no critical illness. The right coverage eliminates catastrophic risk without paying for unnecessary overlap.',
  },
  {
    id: 'cpf-sg',
    topic: 'CPF and Singapore-specific finance',
    tags: ['cpf', 'singapore', 'sg', 'medisave', 'ordinary', 'special', 'account', 'top-up'],
    body: 'CPF contributions are mandatory but also a guaranteed return — OA earns 2.5% and SA earns 4%, better than most savings accounts. Voluntary top-ups to SA reduce taxable income and compound tax-free. MediSave can fund approved insurance premiums. CPF Investment Scheme allows OA excess above $20,000 to be invested in approved instruments. Maximise voluntary top-ups before investing through private brokerages.',
  },
  {
    id: 'tax-optimise',
    topic: 'tax efficiency and relief',
    tags: ['tax', 'relief', 'deduction', 'cpf', 'income', 'efficiency', 'savings', 'srs'],
    body: 'In Singapore, income tax can be legally reduced through CPF cash top-ups (up to $8,000 to own SA, another $8,000 to family), qualifying course fees, parent and dependent relief, and NSman relief. Calculate your chargeable income before year-end and top up CPF if it reduces your tax bracket. SRS (Supplementary Retirement Scheme) contributions reduce taxable income and grow tax-deferred until withdrawal.',
  },
  {
    id: 'lifestyle-inflation',
    topic: 'lifestyle inflation and income growth',
    tags: ['lifestyle', 'inflation', 'income', 'salary', 'raise', 'promotion', 'creep', 'grow'],
    body: 'Lifestyle inflation occurs when spending rises proportionally with income, leaving savings rate unchanged despite earning more. Counter it with the 50% rule: when income increases, commit 50% of the increase to savings and allow the other 50% to improve lifestyle. This grows wealth and rewards progress simultaneously. Track your savings rate quarterly — if it does not increase with each raise, lifestyle inflation is consuming the gains.',
  },
  {
    id: 'financial-goals',
    topic: 'setting and tracking financial goals',
    tags: ['goals', 'target', 'financial', 'plan', 'milestone', 'property', 'retirement', 'specific'],
    body: 'Vague financial goals fail; specific ones succeed. "Save more" fails. "$500 extra to savings by December 31" succeeds. Define: the goal, the amount, the deadline, and the monthly contribution required. Work backwards from the target to set the monthly savings requirement. Review quarterly — if you are behind, adjust either timeline or contribution, not the goal itself. Visible progress trackers sustain motivation over long horizons.',
  },
  {
    id: 'high-avg-transaction',
    topic: 'high average transaction value',
    tags: ['transaction', 'average', 'value', 'large', 'purchase', 'high', 'infrequent'],
    body: 'A high average transaction amount suggests spending concentrated in large, infrequent purchases rather than small daily habits. Review the largest 10 transactions for necessity and value alignment. For recurring large purchases (quarterly insurance, annual subscriptions), build a sinking fund: divide the annual cost by 12 and set aside that amount monthly. This eliminates the budget shock of large periodic payments.',
  },
  {
    id: 'sinking-fund',
    topic: 'sinking funds for periodic expenses',
    tags: ['sinking', 'fund', 'periodic', 'annual', 'irregular', 'car', 'holiday', 'vacation', 'planned'],
    body: 'Sinking funds eliminate budget shocks from known irregular expenses. Open separate savings pots for: annual insurance premiums, holiday travel, vehicle servicing, gifts, and home maintenance. Calculate the annual amount for each and divide by 12. Transfer that amount monthly. When the expense arrives, the money is already there. Mistake: treating these as a single emergency fund — keep them separate and labelled.',
  },
  {
    id: 'bank-fees',
    topic: 'reducing bank and financial fees',
    tags: ['bank', 'fee', 'charge', 'atm', 'account', 'minimum', 'balance', 'waive'],
    body: 'Bank fees are pure waste. Review: monthly service fees (eliminated by minimum balance or salary credit), ATM withdrawal fees (use cards everywhere, top up mobile wallets), foreign exchange charges (use a multi-currency card with no FX markup for travel), late payment fees (automate minimum payments). In Singapore, major banks offer fee-waived accounts with salary credit. Fintech alternatives often charge zero fees.',
  },
  {
    id: 'cash-flow-timing',
    topic: 'cash flow timing and paycheck cycles',
    tags: ['cashflow', 'cash', 'flow', 'timing', 'payday', 'cycle', 'overdraft', 'bills'],
    body: 'Poor cash flow timing can trigger overdraft fees even when monthly income exceeds expenses. Align large bill due dates with your payday: contact utilities, insurance, and subscription providers to shift billing dates. The goal is most bills arriving 3-5 days after salary credit. This eliminates timing-related shortfalls without changing total spending. Track cash flow by week, not just by month, to catch these timing gaps early.',
  },
  {
    id: 'income-diversification',
    topic: 'diversifying income sources',
    tags: ['income', 'side', 'hustle', 'freelance', 'passive', 'diversify', 'multiple', 'streams'],
    body: 'Single-source income is a concentration risk — one event eliminates all income. Income diversification strategies: develop a monetisable skill adjacent to your current job (consulting, teaching), invest in dividend-yielding assets once savings are established, create digital products or content that generate passive income. Even a second income stream of $200-500 per month dramatically reduces financial vulnerability and accelerates savings goals.',
  },
  {
    id: 'wants-vs-needs',
    topic: 'distinguishing wants from needs',
    tags: ['wants', 'needs', 'discretionary', 'essential', 'necessary', 'budget', 'classify'],
    body: 'The wants-versus-needs distinction is where most budgets break down. A need is something required to maintain health, shelter, employment, and basic dignity. Anything above the minimum required is a want. Test: could you live without it for one month? If yes, it is a want. This does not mean eliminating wants — the 50/30/20 rule explicitly allows 30% for wants. Misclassifying wants as needs inflates the needs budget and hides overspending.',
  },
  {
    id: 'net-worth-tracking',
    topic: 'tracking net worth',
    tags: ['net', 'worth', 'assets', 'liabilities', 'wealth', 'track', 'progress', 'total'],
    body: 'Net worth (assets minus liabilities) is the single most important financial metric. Track it monthly: cash savings, investment portfolio, CPF balances, property equity minus all outstanding debts. Monthly income statement tells you the flow; net worth tells you the level. A rising net worth despite moderate income signals excellent habits. A flat or falling net worth despite high income signals lifestyle inflation or hidden debt accumulation.',
  },
  {
    id: 'entertainment-streaming',
    topic: 'entertainment and streaming costs',
    tags: ['entertainment', 'streaming', 'netflix', 'spotify', 'games', 'movies', 'leisure', 'subscription'],
    body: 'Entertainment budgets creep through small subscriptions that individually feel trivial. List all: streaming services, music, gaming, newspapers, podcasts, apps. Calculate the monthly total — most people are surprised. Set an entertainment envelope and choose within it. Family or group plan sharing can reduce per-person cost by 50-75%. Free alternatives (libraries, free tiers, ad-supported) cover much of the same content at zero cost.',
  },
  {
    id: 'high-savings-rate',
    topic: 'optimising an already-healthy savings rate',
    tags: ['savings', 'high', 'invest', 'optimise', 'wealth', 'fire', 'retire', 'excellent'],
    body: 'A savings rate above 30% positions you for significant long-term wealth accumulation. At 30% savings rate, financial independence takes roughly 28 years. At 50%, around 17 years. The focus shifts from cutting costs to maximising income and investment returns. Ensure savings are deployed — cash in savings accounts loses to inflation. Maintain your spending budget even as income grows to prevent lifestyle inflation from eroding your savings rate.',
  },
  {
    id: 'groceries-optimise',
    topic: 'reducing grocery and household expenses',
    tags: ['groceries', 'household', 'supermarket', 'food', 'shop', 'meal', 'cook', 'reduce'],
    body: 'Groceries are a variable cost with significant room for savings. Strategies: shop with a list (reduces impulse buys by 25%), buy store-brand products (typically 15-30% cheaper than branded), shop at discount supermarkets for staples, plan meals for the week before shopping, and freeze perishables before they spoil. Avoid shopping when hungry — it consistently inflates the basket. Cashback and reward cards recoup 1-5% on grocery spend.',
  },
  {
    id: 'rent-housing',
    topic: 'housing and rent costs',
    tags: ['rent', 'housing', 'mortgage', 'property', 'accommodation', 'home', 'lease'],
    body: 'Housing should not exceed 30% of gross income. If rent exceeds this, options: find a flatmate (splits rent 30-50%), relocate to a less central area, negotiate at lease renewal (landlords prefer reliable tenants over vacancies), or accelerate income growth to bring the ratio down. Avoid furnishing a rented property expensively — you are building equity for the landlord. For mortgages, overpay when possible to reduce total interest paid.',
  },
  {
    id: 'pay-yourself-first',
    topic: 'pay yourself first savings strategy',
    tags: ['pay', 'yourself', 'first', 'savings', 'priority', 'automatic', 'transfer'],
    body: 'Pay yourself first means treating savings as a fixed expense, not what remains after spending. Transfer savings the moment salary arrives — before bills, before food, before discretionary spending. What is not in your spending account cannot be spent. Start with whatever you can afford (even $50) and increase by 10% every 3 months. This single habit, consistently applied, produces more wealth than any investment strategy applied inconsistently.',
  },
  {
    id: 'spending-awareness',
    topic: 'building spending awareness and mindfulness',
    tags: ['awareness', 'mindful', 'conscious', 'spending', 'track', 'habit', 'behaviour'],
    body: 'Tracking spending creates awareness that changes behaviour without willpower. Most people underestimate their spending by 20-30% before they start tracking. The act of categorising each transaction forces conscious recall of each purchase. Use a 30-day challenge: record every transaction manually for one month. At the end, most people spontaneously reduce spending in their highest categories simply through awareness — no budgeting rules required.',
  },
  {
    id: 'comparison-peer-spending',
    topic: 'avoiding lifestyle comparison and peer spending pressure',
    tags: ['comparison', 'peer', 'pressure', 'social', 'lifestyle', 'fomo', 'keep-up'],
    body: 'Social comparison is the fastest way to inflate lifestyle costs. "Keeping up" with peer spending is a race to a net worth of zero. Your financial goals are personal — they depend on your income, obligations, and timeline, none of which match your peers exactly. Unfollow social media accounts that trigger lifestyle envy. Measure progress against your own previous numbers, not others\' visible consumption.',
  },
  {
    id: 'no-income-data',
    topic: 'interpreting data without income information',
    tags: ['income', 'missing', 'no-income', 'expenses-only', 'context', 'interpret'],
    body: 'When transaction data contains only expenses without income, savings rate and income-relative metrics cannot be computed. The analysis focuses on spending patterns, category distribution, and anomaly detection. To enable savings rate analysis, include salary credit transactions, bank transfers-in, or tag income rows in your CSV. Even expense-only data reveals category concentration, unusual charges, and spending trends over time.',
  },
];
