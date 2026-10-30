/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS harness loads TypeScript with ts-node. */
const test = require("node:test");
const assert = require("node:assert/strict");
require("ts-node").register({
  transpileOnly: true,
  compilerOptions: { module: "CommonJS", moduleResolution: "Node" },
});
const { computeMetrics, detectAnomalies } = require("../src/lib/metrics.ts");
const { computeHHI } = require("../src/lib/ai/strategies/statistical.ts");
const {
  analyseDemo,
  createDemoTransactions,
  transactionsToCsv,
} = require("../src/lib/demo.ts");
const { generateChatAnswer } = require("../src/lib/ai/chat.ts");
const { safeReturnPath } = require("../src/lib/navigation.ts");
const { generateInsights } = require("../src/lib/ai/engine.ts");

const tx = (amount, category = "Food", date = "2026-01-01") => ({
  amount,
  category,
  description: category,
  date: new Date(date),
});

test("monthly budgets use only the latest recorded month and exclude receipts", () => {
  const metrics = computeMetrics([
    tx(-900, "Food", "2026-01-01"), tx(-80, "Food", "2026-02-01"),
    tx(20, "Food", "2026-02-02"), tx(-120, "Travel", "2026-02-03"),
  ]);
  assert.equal(metrics.totalExpenses, 1100);
  assert.deepEqual(metrics.latestMonthSpending, { month: "2026-02", categories: [
    { category: "Travel", total: -120, count: 1 }, { category: "Food", total: -80, count: 1 },
  ] });
  assert.equal(computeMetrics([]).latestMonthSpending, undefined);
  assert.deepEqual(computeMetrics([tx(-100), tx(200, "Income", "2026-02-01")]).latestMonthSpending, { month: "2026-02", categories: [] });
});

test("spending rankings exclude income, do not net refunds, and rank largest expenses first", () => {
  const metrics = computeMetrics([
    tx(5000, "Income"),
    tx(-20, "Food"),
    tx(-1200, "Housing"),
    tx(-80, "Food"),
    tx(25, "Food"),
  ]);
  assert.equal(metrics.totalIncome, 5025);
  assert.equal(metrics.totalExpenses, 1300);
  assert.equal(metrics.netSavings, 3725);
  assert.deepEqual(metrics.topCategories, [
    { category: "Housing", total: -1200, count: 1 },
    { category: "Food", total: -100, count: 2 },
  ]);
});

test("all categories contribute to concentration even with more than ten categories", () => {
  const metrics = computeMetrics(
    Array.from({ length: 12 }, (_, i) => tx(-100, `Category ${i}`)),
  );
  assert.equal(metrics.topCategories.length, 12);
  assert.equal(
    metrics.topCategories.reduce((sum, cat) => sum - cat.total, 0),
    metrics.totalExpenses,
  );
  assert.ok(
    Math.abs(
      computeHHI(metrics.topCategories, metrics.totalExpenses) - 1 / 12,
    ) < 0.000001,
  );
});

test("empty and income-only datasets have no spending categories", () => {
  for (const rows of [[], [tx(4000, "Income")]]) {
    const metrics = computeMetrics(rows);
    assert.deepEqual(metrics.topCategories, []);
    assert.equal(metrics.totalExpenses, 0);
    assert.ok(Number.isFinite(metrics.savingsRate));
  }
});

test("monthly totals are ordered and preserve exact fixture amounts", () => {
  const metrics = computeMetrics([
    tx(-10.1, "Food", "2026-02-01"),
    tx(-20.2, "Food"),
    tx(100, "Income"),
  ]);
  assert.equal(metrics.totalExpenses, 30.3);
  assert.deepEqual(
    metrics.monthlyBreakdown.map((m) => [m.month, m.income, m.expenses, m.net]),
    [
      ["2026-01", 100, 20.2, 79.8],
      ["2026-02", 0, 10.1, -10.1],
    ],
  );
});

test("income never dilutes expense anomaly detection", () => {
  const expenses = [
    ...Array.from({ length: 20 }, () => tx(-10)),
    tx(-1000, "Equipment"),
  ];
  const expected = detectAnomalies(expenses);
  assert.equal(expected.length, 1);
  assert.equal(expected[0].category, "Equipment");
  assert.deepEqual(
    detectAnomalies([...expenses, tx(100000, "Income")]),
    expected,
  );
  assert.deepEqual(detectAnomalies([tx(100000, "Income"), tx(2), tx(3)]), []);
});

test("both sample workspaces reconcile with the production calculation engine", () => {
  for (const scenario of ["studio", "personal"]) {
    const rows = createDemoTransactions(scenario);
    const { metrics, insights } = analyseDemo(rows);
    assert.equal(rows.length, 73);
    assert.equal(new Set(rows.map((row) => row.id)).size, rows.length);
    assert.equal(metrics.monthlyBreakdown.length, 6);
    assert.equal(metrics.transactionCount, rows.length);
    assert.equal(
      metrics.totalIncome,
      rows
        .filter((row) => row.amount > 0)
        .reduce((sum, row) => sum + row.amount, 0),
    );
    assert.equal(
      metrics.totalExpenses,
      -rows
        .filter((row) => row.amount < 0)
        .reduce((sum, row) => sum + row.amount, 0),
    );
    assert.equal(
      insights.topSpendingCategories[0].category,
      metrics.topCategories[0].category,
    );
    assert.ok(
      !insights.topSpendingCategories.some((cat) => cat.category === "Income"),
    );
    assert.ok(insights.forecast);
    assert.equal(insights.recommendations.length, 3);
  }
});

test("changing the demo period recalculates metrics and chat from the selected rows", () => {
  const rows = createDemoTransactions("studio").filter(
    (row) => row.date >= "2026-04-01",
  );
  const { metrics, anomalies, stats } = analyseDemo(rows);
  assert.equal(metrics.monthlyBreakdown.length, 3);
  assert.equal(metrics.transactionCount, 37);
  const response = generateChatAnswer("What is my top category?", [], {
    datasetName: "Test",
    metrics,
    anomalies,
    enhancedStats: stats,
  });
  assert.ok(response.includes(metrics.topCategories[0].category));
});

test("CSV export round-trips quotes, commas, and signed amounts", () => {
  const Papa = require("papaparse");
  const rows = [
    {
      id: "test",
      date: "2026-01-02",
      description: 'A "quoted", merchant',
      category: "Food",
      amount: -12.5,
    },
  ];
  const result = Papa.parse(transactionsToCsv(rows), { header: true });
  assert.equal(result.errors.length, 0);
  assert.equal(result.data[0].description, rows[0].description);
  assert.equal(result.data[0].amount, "-12.50");
});

test("monthly savings gaps divide the period total by recorded months", () => {
  const rows = [
    tx(1000, "Income"),
    tx(-850, "Housing"),
    tx(1000, "Income", "2026-02-01"),
    tx(-850, "Housing", "2026-02-01"),
  ];
  const metrics = computeMetrics(rows);
  const insights = generateInsights(metrics, []);
  assert.match(
    insights.findings.find((f) => f.id === "savings-below-target").body,
    /\$50\.00 per recorded month/,
  );
  assert.ok(insights.recommendations.some((r) => r.includes("$50.00")));
});

test("login return paths allow local routes but reject scripts and external origins", () => {
  assert.equal(
    safeReturnPath("/dashboard/datasets/123?tab=metrics#chart"),
    "/dashboard/datasets/123?tab=metrics#chart",
  );
  for (const path of [
    null,
    "",
    "https://example.com",
    "//example.com",
    "/\\example.com",
    "javascript:alert(1)",
    "/\n/example.com",
  ]) {
    assert.equal(safeReturnPath(path), "/dashboard");
  }
});
