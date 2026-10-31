"use client";

import Link from "next/link";
import { useMemo, useState, type FormEvent } from "react";
import { ProductIcon as Icon } from "./ProductIcon";
import {
  analyseDemo,
  createDemoTransactions,
  scenarios,
  transactionsToCsv,
  type DemoScenario,
} from "@/lib/demo";
import { generateChatAnswer } from "@/lib/ai/chat";
import type { MonthStat } from "@/lib/metrics";

type View = "overview" | "transactions" | "insights" | "planner";
const money = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
const preciseMoney = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    value,
  );
const COLORS = [
  "#365be8",
  "#8da2f2",
  "#b6c4fa",
  "#5e8980",
  "#a5c5ba",
  "#d9e2de",
  "#c8b1a2",
  "#e2cec0",
];
const VIEWS = [
  { id: "overview", label: "Overview", icon: "grid" },
  { id: "transactions", label: "Transactions", icon: "stack" },
  { id: "insights", label: "Intelligence", icon: "spark" },
  { id: "planner", label: "Savings planner", icon: "target" },
] as const;

function CashflowChart({ months }: { months: MonthStat[] }) {
  const max = Math.max(
    ...months.map((month) => Math.max(month.income, month.expenses)),
    1,
  );
  const ceiling = Math.ceil(max / 2000) * 2000;
  const chartHeight = 156;
  return (
    <div className="cashflow-chart">
      <svg
        viewBox="0 0 640 218"
        role="img"
        aria-label="Monthly income and expenses. Exact values are listed below the chart."
      >
        {[0, 1, 2, 3, 4].map((step) => {
          const y = 18 + (step * chartHeight) / 4;
          return (
            <g key={step}>
              <line
                x1="48"
                x2="632"
                y1={y}
                y2={y}
                stroke="#e5e9ed"
                strokeDasharray="3 5"
              />
              <text x="0" y={y + 4} fill="#7c8792" fontSize="10">
                ${((ceiling * (1 - step / 4)) / 1000).toFixed(0)}k
              </text>
            </g>
          );
        })}
        {months.map((month, i) => {
          const center = 55 + (i + 0.5) * (565 / months.length);
          const incomeHeight = (month.income / ceiling) * chartHeight;
          const expenseHeight = (month.expenses / ceiling) * chartHeight;
          return (
            <g key={month.month}>
              <title>{`${month.month}: income ${money(month.income)}, expenses ${money(month.expenses)}`}</title>
              <rect
                x={center - 25}
                y={174 - incomeHeight}
                width="23"
                height={incomeHeight}
                rx="4"
                fill="#365be8"
              />
              <rect
                x={center + 3}
                y={174 - expenseHeight}
                width="23"
                height={expenseHeight}
                rx="4"
                fill="#c4cff8"
              />
              <text
                x={center}
                y="201"
                textAnchor="middle"
                fill="#7c8792"
                fontSize="11"
              >
                {new Date(`${month.month}-01T00:00:00Z`).toLocaleDateString(
                  "en-US",
                  { month: "short", timeZone: "UTC" },
                )}
              </text>
            </g>
          );
        })}
      </svg>
      <details className="chart-values">
        <summary>View chart data</summary>
        <table>
          <caption className="sr-only">Monthly cash flow in USD</caption>
          <thead>
            <tr>
              <th>Month</th>
              <th>Income</th>
              <th>Expenses</th>
              <th>Net</th>
            </tr>
          </thead>
          <tbody>
            {months.map((m) => (
              <tr key={m.month}>
                <th>{m.month}</th>
                <td>{money(m.income)}</td>
                <td>{money(m.expenses)}</td>
                <td>{money(m.net)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}

export function DemoWorkspace({ embedded = false }: { embedded?: boolean }) {
  const Content = embedded ? "section" : "main";
  const Heading = embedded ? "h2" : "h1";
  const [scenario, setScenario] = useState<DemoScenario>("studio");
  const [period, setPeriod] = useState("6");
  const [view, setView] = useState<View>("overview");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [reduction, setReduction] = useState(15);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [announcement, setAnnouncement] = useState("");
  const rows = useMemo(
    () =>
      createDemoTransactions(scenario).filter(
        (row) => period === "6" || row.date >= "2026-04-01",
      ),
    [scenario, period],
  );
  const { metrics, insights, anomalies, stats } = useMemo(
    () => analyseDemo(rows),
    [rows],
  );
  const filtered = useMemo(
    () =>
      rows
        .filter(
          (row) =>
            (category === "all" || row.category === category) &&
            `${row.description} ${row.category} ${row.date}`
              .toLowerCase()
              .includes(query.toLowerCase().trim()),
        )
        .sort((a, b) =>
          sort === "largest"
            ? Math.abs(b.amount) - Math.abs(a.amount)
            : b.date.localeCompare(a.date),
        ),
    [rows, category, query, sort],
  );
  const pages = Math.max(1, Math.ceil(filtered.length / 8));
  const shownRows = filtered.slice((page - 1) * 8, page * 8);
  const expenseCategories = metrics.topCategories;
  const monthCount = metrics.monthlyBreakdown.length;
  const monthlyExpense = metrics.totalExpenses / monthCount;
  const saved = (monthlyExpense * reduction) / 100;
  const baselineSavings = metrics.netSavings / monthCount;
  const averageIncome = metrics.totalIncome / monthCount;
  const projectedRate = averageIncome
    ? ((baselineSavings + saved) / averageIncome) * 100
    : 0;
  const primaryFinding =
    insights.findings.find((finding) => finding.severity === "warning") ??
    insights.findings[0];

  function changeData(nextScenario: DemoScenario, nextPeriod: string) {
    setScenario(nextScenario);
    setPeriod(nextPeriod);
    setPage(1);
    setCategory("all");
    setQuery("");
    setAnswer("");
    setQuestion("");
    setAnnouncement(
      `Showing ${scenarios[nextScenario].name}, ${nextPeriod === "6" ? "January to June" : "April to June"} 2026.`,
    );
  }
  function navigate(nextView: View) {
    setView(nextView);
    setAnnouncement("");
  }
  function downloadCsv() {
    const url = URL.createObjectURL(
      new Blob([transactionsToCsv(filtered)], {
        type: "text/csv;charset=utf-8;",
      }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `insightstack-${scenario}-sample.csv`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setAnnouncement(`Exported ${filtered.length} sample transactions.`);
  }
  function ask(value: string) {
    if (!value.trim()) return;
    setQuestion(value);
    setAnswer(
      generateChatAnswer(value, [], {
        datasetName: scenarios[scenario].name,
        metrics,
        anomalies,
        enhancedStats: stats,
      }),
    );
  }
  function submitQuestion(event: FormEvent) {
    event.preventDefault();
    ask(question);
  }

  return (
    <div className={`product-workspace ${embedded ? "is-embedded" : ""}`}>
      <aside className="product-sidebar" aria-label="Demo navigation">
        <Link href="/" className="product-brand">
          <span className="brand-glyph">
            <Icon name="chart" size={21} />
          </span>{" "}
          insightstack<span className="brand-dot">.</span>
        </Link>
        <div className="workspace-switch">
          <span className="workspace-avatar">
            {scenarios[scenario].initials}
          </span>
          <div>
            <strong>{scenarios[scenario].name}</strong>
            <small>Sample workspace</small>
          </div>
          <span className="workspace-chevron">⌄</span>
        </div>
        <p className="sidebar-label">WORKSPACE</p>
        <nav className="workspace-nav">
          {VIEWS.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={view === item.id}
              className={view === item.id ? "active" : ""}
              onClick={() => navigate(item.id)}
            >
              <Icon name={item.icon} size={18} />
              <span>{item.label}</span>
              {item.id === "insights" && (
                <span className="nav-count">{insights.findings.length}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="demo-note">
            <Icon name="shield" size={19} />
            <strong>A safe place to explore</strong>
            <p>Fictional data. Real calculations. No account needed.</p>
            <Link href="/register">
              Bring your own data <Icon name="arrow" size={15} />
            </Link>
          </div>
          <Link href="/how-it-works" className="sidebar-engineering">
            <Icon name="code" size={17} /> Under the hood{" "}
            <Icon name="external" size={13} />
          </Link>
          <div className="builder-mini">
            <span>AB</span>
            <div>
              <strong>Built by Anish Bhole</strong>
              <small>Independent project</small>
            </div>
          </div>
        </div>
      </aside>
      <div className="product-main">
        <div className="product-topbar">
          <span>
            Workspace <span className="breadcrumb-slash">/</span>{" "}
            <strong>{VIEWS.find((v) => v.id === view)?.label}</strong>
          </span>
          <span className="sample-pill">
            <i /> Interactive demo
          </span>
        </div>
        <Content
          className="product-content"
          id={embedded ? "preview-content" : "main-content"}
        >
          <header className="workspace-heading">
            <div>
              <p className="eyebrow">YOUR FINANCES, IN FOCUS</p>
              <Heading className="demo-title">
                {view === "overview"
                  ? "A clearer picture."
                  : view === "transactions"
                    ? "Every detail, accounted for."
                    : view === "insights"
                      ? "From numbers to next steps."
                      : "Small changes. More possibilities."}
              </Heading>
              <p>
                {view === "overview"
                  ? "Understand what comes in, what goes out, and what comes next."
                  : view === "transactions"
                    ? "Search, filter, and explore the data behind your dashboard."
                    : view === "insights"
                      ? "Explainable findings from the same engine that powers the app."
                      : "Explore how a change in spending could affect your savings."}
              </p>
            </div>
            <button
              type="button"
              className="product-button secondary export-button"
              onClick={downloadCsv}
            >
              <Icon name="down" size={16} /> Export CSV
            </button>
          </header>
          <div className="workspace-controls">
            <label className="control-label">
              Workspace
              <select
                aria-label="Sample workspace"
                value={scenario}
                onChange={(e) =>
                  changeData(e.target.value as DemoScenario, period)
                }
              >
                <option value="studio">Northstar Studio</option>
                <option value="personal">Everyday life</option>
              </select>
            </label>
            <label className="control-label">
              Period
              <select
                aria-label="Date range"
                value={period}
                onChange={(e) => changeData(scenario, e.target.value)}
              >
                <option value="6">Jan – Jun 2026</option>
                <option value="3">Apr – Jun 2026</option>
              </select>
            </label>
            <span className="data-context">
              <Icon name="check" size={14} /> {rows.length} sample transactions{" "}
              <span>· USD</span>
            </span>
          </div>

          {view === "overview" && (
            <>
              <div className="metric-grid" aria-label="Financial summary">
                <Metric
                  label="Total income"
                  value={money(metrics.totalIncome)}
                  foot="Money coming in"
                  icon="wallet"
                />
                <Metric
                  label="Total expenses"
                  value={money(metrics.totalExpenses)}
                  foot={`${expenseCategories.length} spending categories`}
                  icon="stack"
                />
                <Metric
                  label="Net savings"
                  value={money(metrics.netSavings)}
                  foot="Income minus expenses"
                  icon="chart"
                  accent
                />
                <Metric
                  label="Savings rate"
                  value={`${metrics.savingsRate}%`}
                  foot="Of your total income"
                  icon="target"
                />
              </div>
              <div className="overview-chart-row">
                <section className="product-panel cashflow-panel">
                  <div className="panel-heading">
                    <div>
                      <h2>Cash flow</h2>
                      <p>Your income and expenses, month by month.</p>
                    </div>
                    <div className="chart-legend">
                      <span>
                        <i style={{ background: "#365be8" }} /> Income
                      </span>
                      <span>
                        <i style={{ background: "#c4cff8" }} /> Expenses
                      </span>
                    </div>
                  </div>
                  <CashflowChart months={metrics.monthlyBreakdown} />
                </section>
                <section className="intelligence-card">
                  <div className="intelligence-label">
                    <Icon name="spark" size={17} /> FINANCE INTELLIGENCE
                  </div>
                  <h2>{primaryFinding?.title ?? "Your money has a story."}</h2>
                  <p>{primaryFinding?.body ?? insights.summary}</p>
                  <div className="intelligence-source">
                    <span className="source-dot" /> Calculated from{" "}
                    {rows.length} transactions
                  </div>
                  <button type="button" onClick={() => navigate("insights")}>
                    Explore your insights <Icon name="arrow" size={17} />
                  </button>
                </section>
              </div>
              <div className="overview-bottom-row">
                <section className="product-panel categories-panel">
                  <div className="panel-heading">
                    <div>
                      <h2>Where it goes</h2>
                      <p>Spending by category</p>
                    </div>
                    <span className="muted-mini">
                      {money(metrics.totalExpenses)}
                    </span>
                  </div>
                  <div className="category-bars">
                    {expenseCategories.slice(0, 4).map((cat, i) => (
                      <button
                        type="button"
                        key={cat.category}
                        className="category-row"
                        onClick={() => {
                          setCategory(cat.category);
                          setPage(1);
                          navigate("transactions");
                        }}
                        aria-label={`View ${cat.category} transactions`}
                      >
                        <span className="category-line">
                          <span>
                            <i style={{ background: COLORS[i] }} />
                            {cat.category}
                          </span>
                          <strong>{money(Math.abs(cat.total))}</strong>
                        </span>
                        <span className="category-track">
                          <span
                            style={{
                              width: `${(Math.abs(cat.total) / metrics.totalExpenses) * 100}%`,
                              background: COLORS[i],
                            }}
                          />
                        </span>
                      </button>
                    ))}
                  </div>
                </section>
                <section className="product-panel recent-panel">
                  <div className="panel-heading">
                    <div>
                      <h2>Recent activity</h2>
                      <p>A closer look at the latest transactions.</p>
                    </div>
                    <button
                      type="button"
                      className="text-action"
                      onClick={() => navigate("transactions")}
                    >
                      View all <Icon name="arrow" size={15} />
                    </button>
                  </div>
                  {[...rows]
                    .reverse()
                    .slice(0, 4)
                    .map((row) => (
                      <div className="recent-row" key={row.id}>
                        <span
                          className={`transaction-symbol ${row.amount > 0 ? "positive" : ""}`}
                        >
                          <Icon
                            name={row.amount > 0 ? "wallet" : "stack"}
                            size={16}
                          />
                        </span>
                        <div>
                          <strong>{row.description}</strong>
                          <small>
                            {row.category}{" "}
                            <span>· {row.date.slice(5).replace("-", "/")}</span>
                          </small>
                        </div>
                        <strong
                          className={row.amount > 0 ? "positive-text" : ""}
                        >
                          {row.amount > 0 ? "+" : "−"}
                          {money(Math.abs(row.amount))}
                        </strong>
                      </div>
                    ))}
                </section>
              </div>
            </>
          )}

          {view === "transactions" && (
            <section className="product-panel transactions-panel">
              <div className="transaction-filters">
                <label className="search-field">
                  <Icon name="search" size={17} />
                  <input
                    aria-label="Search transactions"
                    placeholder="Search transactions…"
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value);
                      setPage(1);
                    }}
                  />
                </label>
                <select
                  aria-label="Filter by category"
                  value={category}
                  onChange={(e) => {
                    setCategory(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="all">All categories</option>
                  {[...new Set(rows.map((row) => row.category))]
                    .sort()
                    .map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                </select>
                <select
                  aria-label="Sort transactions"
                  value={sort}
                  onChange={(e) => {
                    setSort(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="newest">Newest first</option>
                  <option value="largest">Largest amount</option>
                </select>
              </div>
              <div className="transaction-table-wrap">
                <table className="transaction-table">
                  <caption className="sr-only">
                    Sample transactions in USD
                  </caption>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Description</th>
                      <th>Category</th>
                      <th className="amount-cell">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shownRows.map((row) => (
                      <tr key={row.id}>
                        <td>{row.date}</td>
                        <th scope="row">{row.description}</th>
                        <td>
                          <span className="category-tag">{row.category}</span>
                        </td>
                        <td
                          className={`amount-cell ${row.amount > 0 ? "positive-text" : ""}`}
                        >
                          {row.amount > 0 ? "+" : "−"}
                          {preciseMoney(Math.abs(row.amount))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filtered.length === 0 && (
                <div className="empty-state">
                  <Icon name="search" size={30} />
                  <h2>No matching transactions</h2>
                  <p>Try another search or clear your category filter.</p>
                  <button
                    type="button"
                    className="product-button secondary"
                    onClick={() => {
                      setQuery("");
                      setCategory("all");
                      setPage(1);
                    }}
                  >
                    Clear filters
                  </button>
                </div>
              )}
              <div className="table-pagination">
                <span aria-live="polite">
                  {filtered.length} transactions
                  {filtered.length > 0 && ` · Page ${page} of ${pages}`}
                </span>
                <div>
                  <button
                    type="button"
                    disabled={page === 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    disabled={page >= pages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </button>
                </div>
              </div>
            </section>
          )}

          {view === "insights" && (
            <div className="insights-layout">
              <div>
                <section className="product-panel analysis-summary">
                  <div className="panel-heading">
                    <span className="section-icon">
                      <Icon name="spark" />
                    </span>
                    <span className="sample-pill">{insights.model}</span>
                  </div>
                  <h2>Your financial briefing</h2>
                  <p>{insights.summary}</p>
                  <details className="method-details">
                    <summary>How this analysis works</summary>
                    <p>
                      Expense-only category totals, statistical outliers,
                      spending trends, and expert rules feed a deterministic
                      analysis engine. BM25 retrieves relevant guidance from a
                      curated knowledge base. This is rule-based analysis, not a
                      large language model.
                    </p>
                    <p>
                      Findings describe this sample period. They are not
                      predictions of individual outcomes.
                    </p>
                  </details>
                </section>
                <div className="findings-list">
                  {insights.findings.map((finding) => (
                    <article
                      className="product-panel finding-card"
                      key={finding.id}
                    >
                      <span className={`finding-severity ${finding.severity}`}>
                        {finding.severity === "info"
                          ? "Observation"
                          : finding.severity === "warning"
                            ? "Worth a closer look"
                            : "Needs attention"}
                      </span>
                      <h3>{finding.title}</h3>
                      <p>{finding.body}</p>
                      <span className="muted-mini">Method: {finding.type}</span>
                    </article>
                  ))}
                </div>
              </div>
              <section className="product-panel demo-chat">
                <div className="panel-heading">
                  <div>
                    <h2>Ask your numbers</h2>
                    <p>Explore the sample data in plain English.</p>
                  </div>
                  <Icon name="spark" />
                </div>
                <div className="suggested-questions">
                  {[
                    "Where do I spend the most?",
                    "How much have I saved?",
                    "Are there unusual transactions?",
                  ].map((prompt) => (
                    <button
                      type="button"
                      key={prompt}
                      onClick={() => ask(prompt)}
                    >
                      {prompt}
                      <Icon name="arrow" size={14} />
                    </button>
                  ))}
                </div>
                <form onSubmit={submitQuestion}>
                  <label
                    htmlFor={embedded ? "preview-question" : "demo-question"}
                  >
                    Your question
                  </label>
                  <div className="chat-input-row">
                    <input
                      id={embedded ? "preview-question" : "demo-question"}
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      placeholder="Ask about your spending…"
                      maxLength={500}
                    />
                    <button
                      type="submit"
                      disabled={!question.trim()}
                      aria-label="Ask question"
                    >
                      <Icon name="arrow" size={18} />
                    </button>
                  </div>
                </form>
                <div aria-live="polite" className="chat-answer">
                  {answer ||
                    "Choose a question to see an answer grounded in this dataset."}
                </div>
                <small>Intent-based answers · No external AI service</small>
              </section>
            </div>
          )}

          {view === "planner" && (
            <div className="planner-layout">
              <section className="product-panel planner-controls">
                <span className="section-icon">
                  <Icon name="target" size={24} />
                </span>
                <h2>What if you spent a little less?</h2>
                <p>
                  Start with your average month, then explore a reduction in
                  expenses. Your original data stays intact.
                </p>
                <div className="planner-baseline">
                  <span>Average monthly spending</span>
                  <strong>{money(monthlyExpense)}</strong>
                </div>
                <label
                  htmlFor={embedded ? "preview-reduction" : "demo-reduction"}
                >
                  Reduce monthly spending by <output>{reduction}%</output>
                </label>
                <input
                  id={embedded ? "preview-reduction" : "demo-reduction"}
                  type="range"
                  min="0"
                  max="40"
                  step="1"
                  value={reduction}
                  onChange={(e) => setReduction(Number(e.target.value))}
                />
                <div className="range-labels">
                  <span>0% · No change</span>
                  <span>40%</span>
                </div>
                <p className="planner-assumption">
                  Illustrative scenario: income stays at {money(averageIncome)}
                  /month and spending falls evenly. No interest, taxes, or
                  investment returns are assumed.
                </p>
              </section>
              <section className="planner-result" aria-live="polite">
                <p className="eyebrow">ROOM FOR YOUR NEXT CHAPTER</p>
                <h2>
                  {money(saved * 12)}
                  <span>in additional savings over a year</span>
                </h2>
                <div className="planner-result-grid">
                  <div>
                    <span>Extra each month</span>
                    <strong>{money(saved)}</strong>
                  </div>
                  <div>
                    <span>New savings rate</span>
                    <strong>{projectedRate.toFixed(1)}%</strong>
                  </div>
                </div>
                <div className="projection-bars">
                  <div>
                    <span>Current monthly savings</span>
                    <div>
                      <i
                        style={{
                          width: `${(Math.max(0, baselineSavings) / Math.max(baselineSavings + saved, 1)) * 100}%`,
                        }}
                      />
                    </div>
                    <strong>{money(baselineSavings)}</strong>
                  </div>
                  <div>
                    <span>With your changes</span>
                    <div className="projection-new">
                      <i style={{ width: "100%" }} />
                    </div>
                    <strong>{money(baselineSavings + saved)}</strong>
                  </div>
                </div>
                <p>
                  A planning illustration based on {monthCount} months of sample
                  data.
                </p>
              </section>
            </div>
          )}

          <footer className="workspace-footer">
            <span>
              <Icon name="shield" size={13} /> Fictional sample data.
              Calculations run in your browser.
            </span>
            <Link href="/how-it-works">
              Explore the engineering <Icon name="arrow" size={13} />
            </Link>
          </footer>
          <span className="sr-only" role="status">
            {announcement}
          </span>
        </Content>
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  foot,
  icon,
  accent = false,
}: {
  label: string;
  value: string;
  foot: string;
  icon: "wallet" | "stack" | "chart" | "target";
  accent?: boolean;
}) {
  return (
    <section className={`metric-card ${accent ? "metric-accent" : ""}`}>
      <div>
        <span>{label}</span>
        <Icon name={icon} size={17} />
      </div>
      <strong>{value}</strong>
      <small>
        {accent && <Icon name="check" size={13} />}
        {foot}
      </small>
    </section>
  );
}
