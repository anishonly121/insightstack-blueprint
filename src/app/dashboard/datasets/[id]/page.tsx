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

const COLORS = ["#3B82F6", "#06B6D4", "#10B981", "#EF4444", "#8B5CF6", "#EC4899", "#F97316"];

const tooltipStyle = {
  backgroundColor: "#18181B",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "12px",
  boxShadow: "0 20px 50px rgba(0,0,0,0.6)",
  color: "#FAFAFA",
  fontSize: "13px",
};
const labelStyle = { color: "#71717A", fontSize: "11px", fontWeight: 600 };

const money = (value: number): string =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);

const pct = (value: number): string => `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;

function SummaryCard({
  label, value, sub, color, accentColor,
}: {
  label: string; value: string; sub?: string; color?: string; accentColor?: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-white/6 bg-zinc-900 p-4">
      {accentColor && (
        <div className="absolute left-0 top-0 h-full w-[3px] rounded-l-xl" style={{ background: accentColor }} />
      )}
      {accentColor && (
        <div
          className="pointer-events-none absolute inset-0 opacity-5"
          style={{ background: `radial-gradient(ellipse at left, ${accentColor} 0%, transparent 70%)` }}
        />
      )}
      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-600">{label}</p>
      <p className={`mt-1.5 text-xl font-black ${color ?? "text-white"}`}>{value}</p>
      {sub && <p className="mt-0.5 text-xs text-zinc-600">{sub}</p>}
    </div>
  );
}

function InsightCard({ insight }: { insight: Insight }) {
  const json = insight.insightJson as InsightJson | null;
  const [expanded, setExpanded] = useState(false);

  return (
    <article className="overflow-hidden rounded-xl border border-white/6 bg-zinc-900 transition-all hover:border-white/10">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/5 bg-gradient-to-r from-cyan-500/5 to-transparent px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-cyan-500/15 text-cyan-400 ring-1 ring-cyan-500/20">
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
          </div>
          <p className="text-xs text-zinc-500">
            {new Date(insight.createdAt).toLocaleString()} &middot;{" "}
            <span className="font-mono text-cyan-400">{insight.model}</span>
          </p>
        </div>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-1 rounded-lg border border-white/8 px-2.5 py-1 text-xs font-medium text-zinc-500 transition hover:border-white/15 hover:text-zinc-300"
        >
          {expanded ? "Collapse" : "Expand"}
          <svg
            className={`h-3.5 w-3.5 transition-transform ${expanded ? "rotate-180" : ""}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      <div className="px-4 py-3">
        <p className="text-sm leading-relaxed text-zinc-400">{insight.insightText}</p>
      </div>

      {expanded && json && (
        <div className="space-y-5 border-t border-white/5 px-4 pb-4">
          {json.topSpendingCategories && json.topSpendingCategories.length > 0 && (
            <div>
              <h4 className="mb-3 text-xs font-bold uppercase tracking-widest text-zinc-600">
                Top Spending Categories
              </h4>
              <div className="space-y-3">
                {json.topSpendingCategories.map((cat, i) => {
                  const max = json.topSpendingCategories[0]?.amount ?? 1;
                  const widthPct = Math.max(4, (cat.amount / max) * 100);
                  return (
                    <div key={cat.category}>
                      <div className="mb-1.5 flex justify-between text-sm">
                        <span className="font-semibold text-zinc-200">{cat.category}</span>
                        <span className="text-zinc-500">{money(cat.amount)}</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-zinc-800">
                        <div
                          className="h-2 rounded-full transition-all"
                          style={{ width: `${widthPct}%`, backgroundColor: COLORS[i % COLORS.length] }}
                        />
                      </div>
                      <p className="mt-0.5 text-xs text-zinc-600">{cat.reason}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {json.anomalies && json.anomalies.length > 0 && (
            <div>
              <h4 className="mb-3 text-xs font-bold uppercase tracking-widest text-zinc-600">
                Anomalies Detected
              </h4>
              <div className="space-y-2">
                {json.anomalies.map((a, i) => (
                  <div key={i} className="rounded-xl border border-amber-500/15 bg-amber-500/8 px-4 py-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-zinc-100">{a.description}</p>
                        <p className="text-xs text-zinc-500">{a.date.slice(0, 10)} &middot; {a.category}</p>
                      </div>
                      <span className="shrink-0 font-mono text-sm font-black text-amber-400">{money(a.amount)}</span>
                    </div>
                    <p className="mt-1.5 text-xs text-amber-500/70">{a.reason}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {json.recommendations && json.recommendations.length > 0 && (
            <div>
              <h4 className="mb-3 text-xs font-bold uppercase tracking-widest text-zinc-600">
                Recommendations
              </h4>
              <ol className="space-y-3">
                {json.recommendations.map((rec, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-500 text-xs font-black text-white">
                      {i + 1}
                    </span>
                    <p className="text-sm leading-relaxed text-zinc-400">{rec}</p>
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
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [txPage, setTxPage] = useState(1);
  const [txLoading, setTxLoading] = useState(false);

  const loadTransactions = useCallback(
    async (page: number, q: string, cat: string) => {
      if (!id) return;
      setTxLoading(true);
      try {
        const res = await api.getTransactions(id, { page, pageSize: 25, sort: "date", order: "desc", search: q || undefined, category: cat || undefined });
        setTransactions(res.data);
        setTxMeta(res.meta);
        if (res.categories.length > 0) setCategories(res.categories);
      } catch {}
      finally { setTxLoading(false); }
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
      const [datasetRes, metricsRes] = await Promise.all([api.getDataset(id), api.getMetrics(id).catch(() => null)]);
      setDataset(datasetRes.data);
      if (metricsRes) setMetrics(metricsRes.data.metricsJson);
      await Promise.all([loadTransactions(1, "", ""), loadInsights(1)]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dataset");
    } finally {
      setLoading(false);
    }
  }, [id, loadTransactions, loadInsights]);

  useEffect(() => {
    if (!getToken()) { router.replace("/login"); return; }
    void load();
  }, [id, router, load]);

  const onGenerateInsights = async () => {
    if (!id) return;
    setError("");
    setInsightLoading(true);
    try {
      await api.generateInsights(id);
      await loadInsights(1);
      const metricsRes = await api.getMetrics(id).catch(() => null);
      if (metricsRes) setMetrics(metricsRes.data.metricsJson);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate insights");
    } finally {
      setInsightLoading(false);
    }
  };

  const onSearch = (q: string) => { setSearch(q); setTxPage(1); void loadTransactions(1, q, categoryFilter); };
  const onCategoryFilter = (cat: string) => { setCategoryFilter(cat); setTxPage(1); void loadTransactions(1, search, cat); };
  const onTxPageChange = (page: number) => { setTxPage(page); void loadTransactions(page, search, categoryFilter); };

  const monthlyChart = useMemo(() => metrics?.monthlyBreakdown ?? [], [metrics]);
  const categoryChart = useMemo(
    () => (metrics?.topCategories ?? []).filter((c) => c.total !== 0).slice(0, 7).map((c) => ({ category: c.category, total: Math.abs(c.total) })),
    [metrics],
  );

  return (
    <main className="min-h-screen bg-[#050B18] px-4 py-8 text-white sm:px-6">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
          <div>
            <Link href="/dashboard" className="text-xs font-extrabold uppercase tracking-[0.15em] text-blue-500 transition hover:text-blue-400">
              ← Dashboard
            </Link>
            <h1 className="mt-1 text-2xl font-black text-white">{dataset?.name ?? "Loading…"}</h1>
            {dataset?.originalFilename && <p className="text-sm text-zinc-600">{dataset.originalFilename}</p>}
          </div>
          {dataset && (
            <span className={`mt-1 inline-block self-start rounded-full px-3 py-1 text-xs font-bold ring-1 ${
              dataset.status === "PARSED"
                ? "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20"
                : dataset.status === "FAILED"
                ? "bg-red-500/10 text-red-400 ring-red-500/20"
                : "bg-blue-500/10 text-blue-400 ring-blue-500/20"
            }`}>
              {dataset.status}
            </span>
          )}
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {loading ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-20 animate-pulse rounded-xl bg-zinc-800" />
              ))}
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="h-72 animate-pulse rounded-xl bg-zinc-800" />
              <div className="h-72 animate-pulse rounded-xl bg-zinc-800" />
            </div>
          </div>
        ) : (
          <>
            {/* Metrics */}
            {metrics ? (
              <section className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <SummaryCard label="Total Income" value={money(metrics.totalIncome)} color="text-emerald-400" accentColor="#10B981" sub={`${metrics.transactionCount} transactions`} />
                <SummaryCard label="Total Expenses" value={money(metrics.totalExpenses)} color="text-red-400" accentColor="#EF4444" />
                <SummaryCard label="Net Savings" value={money(metrics.netSavings)} color={metrics.netSavings >= 0 ? "text-emerald-400" : "text-red-400"} accentColor={metrics.netSavings >= 0 ? "#10B981" : "#EF4444"} />
                <SummaryCard label="Savings Rate" value={pct(metrics.savingsRate)} color={metrics.savingsRate >= 0 ? "text-blue-400" : "text-red-400"} accentColor="#3B82F6" sub={`Avg txn: ${money(Math.abs(metrics.avgTransaction))}`} />
              </section>
            ) : (
              <section className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <SummaryCard label="Status" value={dataset?.status ?? "-"} accentColor="#71717A" />
                <SummaryCard label="Rows Parsed" value={(dataset?.rowCount ?? 0).toLocaleString()} accentColor="#3B82F6" />
                <SummaryCard label="Transactions" value={txMeta.total.toLocaleString()} accentColor="#06B6D4" />
                <SummaryCard label="Total Amount" value={money(Number(dataset?.transactionStats?.totalAmount ?? 0))} accentColor="#10B981" />
              </section>
            )}

            {/* Charts */}
            <section className="mb-6 grid gap-4 lg:grid-cols-2">
              <div className="rounded-xl border border-white/6 bg-zinc-900 p-5">
                <h2 className="mb-5 font-bold text-zinc-100">Category Breakdown</h2>
                {categoryChart.length === 0 ? (
                  <p className="text-sm text-zinc-600">Upload a CSV to see category data.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie data={categoryChart} dataKey="total" nameKey="category" outerRadius={90}
                        label={({ name, percent }) => `${name ?? ""} (${((percent ?? 0) * 100).toFixed(0)}%)`}
                        labelLine={{ stroke: "rgba(255,255,255,0.15)" }}
                      >
                        {categoryChart.map((_, index) => (
                          <Cell key={index} fill={COLORS[index % COLORS.length]} stroke="transparent" />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} labelStyle={labelStyle} formatter={(v) => money(Number(v))} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>

              <div className="rounded-xl border border-white/6 bg-zinc-900 p-5">
                <h2 className="mb-5 font-bold text-zinc-100">Monthly Breakdown</h2>
                {monthlyChart.length === 0 ? (
                  <p className="text-sm text-zinc-600">Upload a CSV to see monthly trends.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={monthlyChart} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#71717A" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: "#71717A" }} tickFormatter={(v) => `$${v}`} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={tooltipStyle} labelStyle={labelStyle} formatter={(v) => money(Number(v))} />
                      <Legend wrapperStyle={{ color: "#71717A", fontSize: "12px" }} />
                      <Bar dataKey="income" fill="#10B981" name="Income" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="expenses" fill="#EF4444" name="Expenses" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </section>

            {/* Net trend */}
            {monthlyChart.length > 1 && (
              <section className="mb-6 rounded-xl border border-white/6 bg-zinc-900 p-5">
                <h2 className="mb-5 font-bold text-zinc-100">Net Savings Trend</h2>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={monthlyChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#71717A" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#71717A" }} tickFormatter={(v) => `$${v}`} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={tooltipStyle} labelStyle={labelStyle} formatter={(v) => money(Number(v))} />
                    <Line type="monotone" dataKey="net" name="Net" stroke="#3B82F6" strokeWidth={2.5} dot={{ r: 4, fill: "#3B82F6", strokeWidth: 0 }} activeDot={{ r: 6, fill: "#3B82F6", stroke: "rgba(245,158,11,0.3)", strokeWidth: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </section>
            )}

            {/* Transactions table */}
            <section className="mb-6 rounded-xl border border-white/6 bg-zinc-900">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 px-5 py-4">
                <h2 className="font-bold text-zinc-100">
                  Transactions{" "}
                  <span className="text-sm font-normal text-zinc-600">({txMeta.total.toLocaleString()})</span>
                </h2>
                <button
                  type="button"
                  onClick={() => exportTransactionsToCsv(transactions, `${dataset?.name ?? "transactions"}.csv`)}
                  disabled={transactions.length === 0}
                  className="rounded-lg border border-white/8 bg-zinc-800 px-3 py-1.5 text-sm font-medium text-zinc-400 transition hover:border-white/15 hover:text-white disabled:opacity-40"
                >
                  ↓ Export CSV
                </button>
              </div>

              <div className="flex flex-wrap gap-3 border-b border-white/5 px-5 py-3">
                <input
                  type="search"
                  placeholder="Search description..."
                  value={search}
                  onChange={(e) => onSearch(e.target.value)}
                  className="flex-1 min-w-[180px] rounded-lg border border-white/8 bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-600 focus:border-blue-500/40 focus:outline-none focus:ring-2 focus:ring-blue-500/15"
                />
                <select
                  value={categoryFilter}
                  onChange={(e) => onCategoryFilter(e.target.value)}
                  className="rounded-lg border border-white/8 bg-zinc-800 px-3 py-2 text-sm text-zinc-300 focus:border-blue-500/40 focus:outline-none focus:ring-2 focus:ring-blue-500/15"
                >
                  <option value="">All categories</option>
                  {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {txLoading ? (
                <div className="p-6 text-center text-sm text-zinc-600">Loading...</div>
              ) : transactions.length === 0 ? (
                <div className="p-10 text-center text-sm text-zinc-600">
                  {search || categoryFilter ? "No transactions match your filter." : "No transactions yet. Upload a CSV from the dashboard."}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/5 bg-zinc-800/50 text-left text-xs font-bold uppercase tracking-widest text-zinc-600">
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3">Description</th>
                        <th className="px-4 py-3">Category</th>
                        <th className="px-4 py-3 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/3">
                      {transactions.map((tx) => {
                        const amount = Number(tx.amount);
                        return (
                          <tr key={tx.id} className="transition hover:bg-white/2">
                            <td className="whitespace-nowrap px-4 py-3 text-zinc-600">{tx.date.slice(0, 10)}</td>
                            <td className="px-4 py-3 text-zinc-300">{tx.description}</td>
                            <td className="px-4 py-3">
                              <span className="rounded-full bg-zinc-800 px-2.5 py-0.5 text-xs font-medium text-zinc-400 ring-1 ring-white/5">
                                {tx.category}
                              </span>
                            </td>
                            <td className={`px-4 py-3 text-right font-mono font-black ${amount >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                              {money(amount)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {txMeta.totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-white/5 px-5 py-3 text-sm text-zinc-600">
                  <p>Page {txMeta.page} of {txMeta.totalPages}</p>
                  <div className="flex gap-2">
                    <button type="button" disabled={txMeta.page <= 1} onClick={() => onTxPageChange(txPage - 1)} className="rounded-lg border border-white/8 px-3 py-1.5 font-medium transition hover:bg-zinc-800 disabled:opacity-40">← Prev</button>
                    <button type="button" disabled={txMeta.page >= txMeta.totalPages} onClick={() => onTxPageChange(txPage + 1)} className="rounded-lg border border-white/8 px-3 py-1.5 font-medium transition hover:bg-zinc-800 disabled:opacity-40">Next →</button>
                  </div>
                </div>
              )}
            </section>

            {/* AI Insights */}
            <section className="rounded-xl border border-white/6 bg-zinc-900">
              <div className="flex items-center justify-between border-b border-white/5 bg-gradient-to-r from-cyan-500/5 to-transparent px-5 py-4">
                <div>
                  <h2 className="font-bold text-zinc-100">AI Insights</h2>
                  <p className="text-xs text-zinc-600">
                    Powered by GPT-4o-mini · {insightMeta.total} analysis{insightMeta.total !== 1 ? "es" : ""}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void onGenerateInsights()}
                  disabled={insightLoading}
                  className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-black text-white shadow-[0_0_15px_rgba(6,182,212,0.3)] transition hover:bg-cyan-400 hover:shadow-[0_0_25px_rgba(6,182,212,0.5)] disabled:opacity-50"
                >
                  {insightLoading ? "Generating…" : "✦ Generate Insights"}
                </button>
              </div>

              <div className="p-5">
                {insights.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-white/8 bg-zinc-800/50 p-12 text-center">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-400 ring-1 ring-cyan-500/20">
                      <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                      </svg>
                    </div>
                    <p className="font-bold text-zinc-200">No insights yet</p>
                    <p className="mt-2 text-sm text-zinc-600">
                      Upload a CSV, then click{" "}
                      <strong className="text-cyan-400">Generate Insights</strong>.
                      GPT-4o-mini will analyse your spending and return structured recommendations.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {insights.map((insight) => <InsightCard key={insight.id} insight={insight} />)}
                    {insightMeta.totalPages > 1 && (
                      <div className="flex items-center justify-between pt-2 text-sm text-zinc-600">
                        <p>Page {insightMeta.page} of {insightMeta.totalPages}</p>
                        <div className="flex gap-2">
                          <button type="button" disabled={insightPage <= 1} onClick={() => void loadInsights(insightPage - 1)} className="rounded-lg border border-white/8 px-3 py-1.5 font-medium transition hover:bg-zinc-800 disabled:opacity-40">← Prev</button>
                          <button type="button" disabled={insightPage >= insightMeta.totalPages} onClick={() => void loadInsights(insightPage + 1)} className="rounded-lg border border-white/8 px-3 py-1.5 font-medium transition hover:bg-zinc-800 disabled:opacity-40">Next →</button>
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
