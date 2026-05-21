"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  api,
  exportTransactionsToCsv,
  getToken,
  type DatasetDetail,
  type Insight,
  type InsightJson,
  type MetricsJson,
  type PaginatedMeta,
  type Transaction,
} from "@/lib/api";

const COLORS = ["#6366f1", "#0891b2", "#059669", "#d97706", "#dc2626", "#7c3aed", "#db2777"];

const money = (value: number): string =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);

const pct = (value: number): string => `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;

function SummaryCard({
  label,
  value,
  sub,
  color,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  color?: string;
  accent?: string;
}) {
  return (
    <div className={`relative overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-sm`}>
      {accent && (
        <div className={`absolute left-0 top-0 h-full w-1 rounded-l-xl ${accent}`} />
      )}
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`mt-1 text-xl font-bold ${color ?? "text-slate-900"}`}>{value}</p>
      {sub && <p className="mt-0.5 text-xs text-slate-400">{sub}</p>}
    </div>
  );
}

function InsightCard({ insight }: { insight: Insight }) {
  const json = insight.insightJson as InsightJson | null;
  const [expanded, setExpanded] = useState(false);

  return (
    <article className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-100 text-violet-600">
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
          </div>
          <p className="text-xs text-slate-400">
            {new Date(insight.createdAt).toLocaleString()} &middot;{" "}
            <span className="font-mono text-violet-600">{insight.model}</span>
          </p>
        </div>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-50 hover:border-slate-300"
        >
          {expanded ? "Collapse" : "Expand"}
          <svg
            className={`h-3.5 w-3.5 transition-transform ${expanded ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Summary */}
      <div className="px-4 py-3">
        <p className="text-sm leading-relaxed text-slate-700">{insight.insightText}</p>
      </div>

      {expanded && json && (
        <div className="border-t border-slate-100 px-4 pb-4 space-y-5">
          {/* Top categories */}
          {json.topSpendingCategories && json.topSpendingCategories.length > 0 && (
            <div>
              <h4 className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">
                Top Spending Categories
              </h4>
              <div className="space-y-2">
                {json.topSpendingCategories.map((cat, i) => {
                  const max = json.topSpendingCategories[0]?.amount ?? 1;
                  const widthPct = Math.max(4, (cat.amount / max) * 100);
                  return (
                    <div key={cat.category}>
                      <div className="mb-1 flex justify-between text-sm">
                        <span className="font-medium text-slate-800">{cat.category}</span>
                        <span className="text-slate-500">{money(cat.amount)}</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-slate-100">
                        <div
                          className="h-2 rounded-full transition-all"
                          style={{
                            width: `${widthPct}%`,
                            backgroundColor: COLORS[i % COLORS.length],
                          }}
                        />
                      </div>
                      <p className="mt-0.5 text-xs text-slate-400">{cat.reason}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Anomalies */}
          {json.anomalies && json.anomalies.length > 0 && (
            <div>
              <h4 className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">
                Anomalies Detected
              </h4>
              <div className="space-y-2">
                {json.anomalies.map((a, i) => (
                  <div
                    key={i}
                    className="rounded-lg border border-amber-100 bg-amber-50 px-3 py-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{a.description}</p>
                        <p className="text-xs text-slate-500">
                          {a.date.slice(0, 10)} &middot; {a.category}
                        </p>
                      </div>
                      <span className="shrink-0 font-mono text-sm font-bold text-amber-700">
                        {money(a.amount)}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-amber-700">{a.reason}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {json.recommendations && json.recommendations.length > 0 && (
            <div>
              <h4 className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">
                Recommendations
              </h4>
              <ol className="space-y-2">
                {json.recommendations.map((rec, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
                      {i + 1}
                    </span>
                    <p className="text-sm leading-relaxed text-slate-700">{rec}</p>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      )}
    </article>
  );
}

export default function DashboardDatasetDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id ?? "";

  const [dataset, setDataset] = useState<DatasetDetail | null>(null);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [txMeta, setTxMeta] = useState<PaginatedMeta>({ page: 1, pageSize: 25, total: 0, totalPages: 1 });
  const [categories, setCategories] = useState<string[]>([]);
  const [metrics, setMetrics] = useState<MetricsJson | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [insightLoading, setInsightLoading] = useState(false);
  const [insightPage, setInsightPage] = useState(1);
  const [insightMeta, setInsightMeta] = useState<PaginatedMeta>({ page: 1, pageSize: 5, total: 0, totalPages: 1 });

  // Transaction filters
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [txPage, setTxPage] = useState(1);
  const [txLoading, setTxLoading] = useState(false);

  const loadTransactions = useCallback(
    async (page: number, q: string, cat: string) => {
      if (!id) return;
      setTxLoading(true);
      try {
        const res = await api.getTransactions(id, {
          page,
          pageSize: 25,
          sort: "date",
          order: "desc",
          search: q || undefined,
          category: cat || undefined,
        });
        setTransactions(res.data);
        setTxMeta(res.meta);
        if (res.categories.length > 0) setCategories(res.categories);
      } catch {
        // non-fatal
      } finally {
        setTxLoading(false);
      }
    },
    [id],
  );

  const loadInsights = useCallback(
    async (page: number) => {
      if (!id) return;
      const res = await api.listInsights(id, { page, pageSize: 5, sort: "createdAt", order: "desc" });
      setInsights(res.data);
      setInsightMeta(res.meta);
      setInsightPage(page);
    },
    [id],
  );

  const load = useCallback(async () => {
    if (!id) return;
    setError("");
    setLoading(true);
    try {
      const [datasetRes, metricsRes] = await Promise.all([
        api.getDataset(id),
        api.getMetrics(id).catch(() => null),
      ]);
      setDataset(datasetRes.data);
      if (metricsRes) setMetrics(metricsRes.data.metricsJson);

      await Promise.all([
        loadTransactions(1, "", ""),
        loadInsights(1),
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dataset");
    } finally {
      setLoading(false);
    }
  }, [id, loadTransactions, loadInsights]);

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
      return;
    }
    void load();
  }, [id, router, load]);

  const onGenerateInsights = async () => {
    if (!id) return;
    setError("");
    setInsightLoading(true);
    try {
      await api.generateInsights(id);
      await loadInsights(1);
      // Refresh metrics after new insight
      const metricsRes = await api.getMetrics(id).catch(() => null);
      if (metricsRes) setMetrics(metricsRes.data.metricsJson);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate insights");
    } finally {
      setInsightLoading(false);
    }
  };

  const onSearch = (q: string) => {
    setSearch(q);
    setTxPage(1);
    void loadTransactions(1, q, categoryFilter);
  };

  const onCategoryFilter = (cat: string) => {
    setCategoryFilter(cat);
    setTxPage(1);
    void loadTransactions(1, search, cat);
  };

  const onTxPageChange = (page: number) => {
    setTxPage(page);
    void loadTransactions(page, search, categoryFilter);
  };

  const monthlyChart = useMemo(() => metrics?.monthlyBreakdown ?? [], [metrics]);

  const categoryChart = useMemo(
    () =>
      (metrics?.topCategories ?? [])
        .filter((c) => c.total !== 0)
        .slice(0, 7)
        .map((c) => ({ category: c.category, total: Math.abs(c.total) })),
    [metrics],
  );

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-50 px-4 py-8 text-slate-900 sm:px-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
          <div>
            <Link
              href="/dashboard"
              className="text-xs font-extrabold uppercase tracking-[0.15em] text-indigo-600 transition hover:text-indigo-700"
            >
              ← Dashboard
            </Link>
            <h1 className="mt-0.5 text-2xl font-bold text-slate-900">
              {dataset?.name ?? "Loading…"}
            </h1>
            {dataset?.originalFilename && (
              <p className="text-sm text-slate-400">{dataset.originalFilename}</p>
            )}
          </div>
          {dataset && (
            <span
              className={`mt-1 inline-block self-start rounded-full px-3 py-1 text-xs font-semibold ring-1 ${
                dataset.status === "PARSED"
                  ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                  : dataset.status === "FAILED"
                  ? "bg-red-50 text-red-700 ring-red-200"
                  : "bg-amber-50 text-amber-700 ring-amber-200"
              }`}
            >
              {dataset.status}
            </span>
          )}
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-20 animate-pulse rounded-xl bg-slate-200" />
              ))}
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="h-72 animate-pulse rounded-xl bg-slate-200" />
              <div className="h-72 animate-pulse rounded-xl bg-slate-200" />
            </div>
          </div>
        ) : (
          <>
            {/* Metrics summary */}
            {metrics ? (
              <section className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <SummaryCard
                  label="Total Income"
                  value={money(metrics.totalIncome)}
                  color="text-emerald-600"
                  accent="bg-emerald-500"
                  sub={`${metrics.transactionCount} transactions`}
                />
                <SummaryCard
                  label="Total Expenses"
                  value={money(metrics.totalExpenses)}
                  color="text-red-600"
                  accent="bg-red-500"
                />
                <SummaryCard
                  label="Net Savings"
                  value={money(metrics.netSavings)}
                  color={metrics.netSavings >= 0 ? "text-emerald-600" : "text-red-600"}
                  accent={metrics.netSavings >= 0 ? "bg-emerald-500" : "bg-red-500"}
                />
                <SummaryCard
                  label="Savings Rate"
                  value={pct(metrics.savingsRate)}
                  color={metrics.savingsRate >= 0 ? "text-indigo-600" : "text-red-600"}
                  accent="bg-indigo-500"
                  sub={`Avg txn: ${money(Math.abs(metrics.avgTransaction))}`}
                />
              </section>
            ) : (
              <section className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <SummaryCard label="Status" value={dataset?.status ?? "-"} accent="bg-slate-400" />
                <SummaryCard label="Rows Parsed" value={(dataset?.rowCount ?? 0).toLocaleString()} accent="bg-indigo-400" />
                <SummaryCard label="Transactions" value={txMeta.total.toLocaleString()} accent="bg-violet-400" />
                <SummaryCard
                  label="Total Amount"
                  value={money(Number(dataset?.transactionStats?.totalAmount ?? 0))}
                  accent="bg-emerald-400"
                />
              </section>
            )}

            {/* Charts */}
            <section className="mb-6 grid gap-4 lg:grid-cols-2">
              {/* Category breakdown */}
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="mb-4 font-semibold text-slate-900">Category Breakdown</h2>
                {categoryChart.length === 0 ? (
                  <p className="text-sm text-slate-400">Upload a CSV to see category data.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie
                        data={categoryChart}
                        dataKey="total"
                        nameKey="category"
                        outerRadius={90}
                        label={({ name, percent }) =>
                          `${name ?? ""} (${((percent ?? 0) * 100).toFixed(0)}%)`
                        }
                      >
                        {categoryChart.map((_, index) => (
                          <Cell key={index} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v) => money(Number(v))} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Monthly trend */}
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="mb-4 font-semibold text-slate-900">Monthly Breakdown</h2>
                {monthlyChart.length === 0 ? (
                  <p className="text-sm text-slate-400">Upload a CSV to see monthly trends.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={monthlyChart} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
                      <Tooltip formatter={(v) => money(Number(v))} />
                      <Legend />
                      <Bar dataKey="income" fill="#059669" name="Income" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="expenses" fill="#dc2626" name="Expenses" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </section>

            {/* Net trend line */}
            {monthlyChart.length > 1 && (
              <section className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="mb-4 font-semibold text-slate-900">Net Savings Trend</h2>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={monthlyChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
                    <Tooltip formatter={(v) => money(Number(v))} />
                    <Line
                      type="monotone"
                      dataKey="net"
                      name="Net"
                      stroke="#6366f1"
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: "#6366f1" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </section>
            )}

            {/* Transactions table */}
            <section className="mb-6 rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
                <h2 className="font-semibold text-slate-900">
                  Transactions{" "}
                  <span className="text-sm font-normal text-slate-400">
                    ({txMeta.total.toLocaleString()})
                  </span>
                </h2>
                <button
                  type="button"
                  onClick={() =>
                    exportTransactionsToCsv(
                      transactions,
                      `${dataset?.name ?? "transactions"}.csv`,
                    )
                  }
                  disabled={transactions.length === 0}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-40"
                >
                  ↓ Export CSV
                </button>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap gap-3 border-b border-slate-100 px-5 py-3">
                <input
                  type="search"
                  placeholder="Search description..."
                  value={search}
                  onChange={(e) => onSearch(e.target.value)}
                  className="flex-1 min-w-[180px] rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
                <select
                  value={categoryFilter}
                  onChange={(e) => onCategoryFilter(e.target.value)}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                >
                  <option value="">All categories</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {txLoading ? (
                <div className="p-6 text-center text-sm text-slate-400">Loading...</div>
              ) : transactions.length === 0 ? (
                <div className="p-10 text-center text-sm text-slate-400">
                  {search || categoryFilter
                    ? "No transactions match your filter."
                    : "No transactions yet. Upload a CSV from the dashboard."}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3">Description</th>
                        <th className="px-4 py-3">Category</th>
                        <th className="px-4 py-3 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {transactions.map((tx) => {
                        const amount = Number(tx.amount);
                        return (
                          <tr key={tx.id} className="hover:bg-slate-50">
                            <td className="whitespace-nowrap px-4 py-2.5 text-slate-500">
                              {tx.date.slice(0, 10)}
                            </td>
                            <td className="px-4 py-2.5 text-slate-800">{tx.description}</td>
                            <td className="px-4 py-2.5">
                              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                                {tx.category}
                              </span>
                            </td>
                            <td
                              className={`px-4 py-2.5 text-right font-mono font-semibold ${
                                amount >= 0 ? "text-emerald-600" : "text-red-600"
                              }`}
                            >
                              {money(amount)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Tx pagination */}
              {txMeta.totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 text-sm text-slate-500">
                  <p>
                    Page {txMeta.page} of {txMeta.totalPages}
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={txMeta.page <= 1}
                      onClick={() => onTxPageChange(txPage - 1)}
                      className="rounded-lg border border-slate-300 px-3 py-1.5 font-medium disabled:opacity-40"
                    >
                      ← Prev
                    </button>
                    <button
                      type="button"
                      disabled={txMeta.page >= txMeta.totalPages}
                      onClick={() => onTxPageChange(txPage + 1)}
                      className="rounded-lg border border-slate-300 px-3 py-1.5 font-medium disabled:opacity-40"
                    >
                      Next →
                    </button>
                  </div>
                </div>
              )}
            </section>

            {/* AI Insights */}
            <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-violet-50 to-indigo-50 px-5 py-4">
                <div>
                  <h2 className="font-semibold text-slate-900">AI Insights</h2>
                  <p className="text-xs text-slate-500">
                    Powered by GPT-4o-mini · {insightMeta.total} analysis
                    {insightMeta.total !== 1 ? "es" : ""}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void onGenerateInsights()}
                  disabled={insightLoading}
                  className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700 disabled:opacity-50"
                >
                  {insightLoading ? "Generating…" : "✦ Generate Insights"}
                </button>
              </div>

              <div className="p-5">
                {insights.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center">
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-violet-100 text-violet-600">
                      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                      </svg>
                    </div>
                    <p className="font-semibold text-slate-700">No insights yet</p>
                    <p className="mt-1 text-sm text-slate-400">
                      Upload a CSV, then click <strong className="text-violet-600">Generate Insights</strong>.
                      GPT-4o-mini will analyse your spending and return structured recommendations.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {insights.map((insight) => (
                      <InsightCard key={insight.id} insight={insight} />
                    ))}

                    {insightMeta.totalPages > 1 && (
                      <div className="flex items-center justify-between pt-2 text-sm text-slate-500">
                        <p>
                          Page {insightMeta.page} of {insightMeta.totalPages}
                        </p>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            disabled={insightPage <= 1}
                            onClick={() => void loadInsights(insightPage - 1)}
                            className="rounded-lg border border-slate-300 px-3 py-1.5 font-medium disabled:opacity-40"
                          >
                            ← Prev
                          </button>
                          <button
                            type="button"
                            disabled={insightPage >= insightMeta.totalPages}
                            onClick={() => void loadInsights(insightPage + 1)}
                            className="rounded-lg border border-slate-300 px-3 py-1.5 font-medium disabled:opacity-40"
                          >
                            Next →
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
