import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { computeMetrics, detectAnomalies } from "../../src/lib/metrics";
import { generateInsights } from "../../src/lib/ai/engine";
import { parseTransactionsCsv } from "../../src/lib/csv";

const loadDemo = () => {
  const parsed = parseTransactionsCsv(readFileSync(new URL("../../docs/demo-transactions.csv", import.meta.url), "utf8"));
  assert.ok(parsed.ok);
  return parsed.rows;
};

test("demo data: income is never treated as a spending category", () => {
  const rows = loadDemo();
  const out = generateInsights(computeMetrics(rows), detectAnomalies(rows));
  const text = [out.summary, ...out.recommendations, ...out.findings.map((f) => `${f.title} ${f.body}`)].join("\n");

  assert.ok(!out.topSpendingCategories.some((c) => c.category === "Income"));
  assert.doesNotMatch(text, /cap on Income|concentration in Income|category is Income/i);
  assert.equal(out.topSpendingCategories[0]?.category, "Food");
});

test("demo data: a healthy saver is not told their finances need urgent attention", () => {
  const rows = loadDemo();
  const out = generateInsights(computeMetrics(rows), detectAnomalies(rows));
  assert.doesNotMatch(out.summary, /immediate attention/i);
  assert.ok(!out.findings.some((f) => f.severity === "critical"));
});

test("demo data: salary payments are not flagged as unusual", () => {
  const rows = loadDemo();
  assert.ok(!detectAnomalies(rows).some((a) => /salary/i.test(a.description)));
});

test("spending above income is still flagged as critical", () => {
  const rows = [
    { date: new Date("2026-07-01"), description: "Salary", category: "Income", amount: "2000.00" },
    { date: new Date("2026-07-03"), description: "Rent", category: "Housing", amount: "-1500.00" },
    { date: new Date("2026-07-10"), description: "Groceries", category: "Food", amount: "-600.00" },
    { date: new Date("2026-07-20"), description: "Taxi", category: "Transport", amount: "-200.00" },
  ];
  const out = generateInsights(computeMetrics(rows), detectAnomalies(rows));
  assert.ok(out.findings.some((f) => f.severity === "critical"));
});

test("monthly advice uses monthly amounts, not the whole dataset total", () => {
  const rows = loadDemo(); // three months of data
  const out = generateInsights(computeMetrics(rows), detectAnomalies(rows));
  const cap = out.recommendations.find((r) => r.startsWith("Set a monthly budget cap for Food"));
  assert.ok(cap, "expected a Food budget recommendation");
  assert.match(cap, /\$119\.63 a month/);
  assert.match(cap, /\$11\.96 per month/);
});
