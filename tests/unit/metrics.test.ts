import { test } from "node:test";
import assert from "node:assert/strict";
import { computeMetrics, detectAnomalies, monthlySpendForCategory, perMonth } from "../../src/lib/metrics";

const tx = (date: string, category: string, amount: number, description = category) => ({
  date: new Date(`${date}T00:00:00Z`),
  description,
  category,
  amount: amount.toFixed(2),
});

const sample = [
  tx("2026-01-10", "Income", 3000, "Salary"),
  tx("2026-01-12", "Food", -100),
  tx("2026-01-15", "Rent", -1200),
  tx("2026-02-10", "Income", 3000, "Salary"),
  tx("2026-02-12", "Food", -150),
  tx("2026-02-15", "Rent", -1200),
  tx("2026-02-20", "Shopping", -80),
  tx("2026-02-21", "Shopping", 30, "Refund"),
];

test("topCategories only lists spending, largest first", () => {
  const m = computeMetrics(sample);
  assert.deepEqual(
    m.topCategories.map((c) => c.category),
    ["Rent", "Food", "Shopping"],
  );
  assert.ok(m.topCategories.every((c) => c.total < 0), "spending totals are negative");
  assert.ok(!m.topCategories.some((c) => c.category === "Income"));
});

test("refunds reduce a category's spend", () => {
  const m = computeMetrics(sample);
  assert.equal(m.topCategories.find((c) => c.category === "Shopping")?.total, -50);
});

test("totals, savings rate and average transaction", () => {
  const m = computeMetrics(sample);
  assert.equal(m.totalIncome, 6030);
  assert.equal(m.totalExpenses, 2730);
  assert.equal(m.netSavings, 3300);
  assert.equal(m.savingsRate, 54.7);
  assert.equal(m.avgTransaction, 546); // 2730 over 5 expense rows
  assert.equal(m.latestMonth, "2026-02");
});

test("monthly budget comparison uses the latest month, not the whole dataset", () => {
  const m = computeMetrics(sample);
  assert.equal(monthlySpendForCategory(m, "Rent"), 1200);
  assert.equal(monthlySpendForCategory(m, "Food"), 150);
  assert.equal(monthlySpendForCategory(m, "Unknown"), 0);
});

test("monthly budget comparison falls back to the average for old snapshots", () => {
  const m = computeMetrics(sample);
  const oldStyle = {
    ...m,
    topCategories: m.topCategories.map((c) => ({ category: c.category, total: c.total, count: c.count })),
  };
  assert.equal(monthlySpendForCategory(oldStyle, "Rent"), 1200);
  assert.equal(monthlySpendForCategory(oldStyle, "Food"), 125);
});

test("perMonth divides by the number of months covered", () => {
  const m = computeMetrics(sample);
  assert.equal(perMonth(300, m), 150);
  assert.equal(perMonth(300, { monthlyBreakdown: [] }), 300);
});

test("salary is never reported as an anomaly", () => {
  const rows = [
    ...Array.from({ length: 12 }, (_, i) => tx(`2026-03-${String(i + 1).padStart(2, "0")}`, "Food", -10)),
    tx("2026-03-25", "Income", 5000, "Salary"),
    tx("2026-03-26", "Travel", -900, "Flight"),
  ];
  const anomalies = detectAnomalies(rows);
  assert.deepEqual(anomalies.map((a) => a.description), ["Flight"]);
});

test("empty input is handled", () => {
  const m = computeMetrics([]);
  assert.equal(m.transactionCount, 0);
  assert.deepEqual(m.topCategories, []);
  assert.equal(m.latestMonth, null);
  assert.deepEqual(detectAnomalies([]), []);
});
