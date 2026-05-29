"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { api, getToken, type Dataset, type MetricsJson } from "@/lib/api";
import { useRouter } from "next/navigation";
import { LogoMark } from "@/components/LogoMark";

const tooltipStyle = {
  backgroundColor: "#18181B", border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "12px", color: "#FAFAFA", fontSize: "13px",
};

const money = (v: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Math.abs(v));

function delta(a: number, b: number): { text: string; positive: boolean } | null {
  if (b === 0) return null;
  const pct = ((a - b) / Math.abs(b)) * 100;
  return { text: `${pct > 0 ? "+" : ""}${pct.toFixed(1)}%`, positive: pct > 0 };
}

// For expenses: an increase is bad; for savings: an increase is good.
function deltaColor(field: string, d: { positive: boolean } | null): string {
  if (!d) return "text-zinc-600";
  const badWhenPositive = ["totalExpenses"];
  if (badWhenPositive.includes(field)) return d.positive ? "text-red-400" : "text-emerald-400";
  return d.positive ? "text-emerald-400" : "text-red-400";
}

type CompareMetric = {
  label: string;
  field: keyof MetricsJson;
  format: (v: number) => string;
};

const METRICS: CompareMetric[] = [
  { label: "Total Expenses",    field: "totalExpenses",    format: money },
  { label: "Total Income",      field: "totalIncome",      format: money },
  { label: "Net Savings",       field: "netSavings",       format: money },
  { label: "Savings Rate",      field: "savingsRate",      format: (v) => `${v.toFixed(1)}%` },
  { label: "Transactions",      field: "transactionCount", format: (v) => v.toLocaleString() },
  { label: "Avg Transaction",   field: "avgTransaction",   format: money },
];

export default function ComparePage() {
  const router = useRouter();
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(true);
  const [idA, setIdA] = useState("");
  const [idB, setIdB] = useState("");
  const [metricsA, setMetricsA] = useState<MetricsJson | null>(null);
  const [metricsB, setMetricsB] = useState<MetricsJson | null>(null);
  const [fetchingA, setFetchingA] = useState(false);
  const [fetchingB, setFetchingB] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!getToken()) { router.replace("/login"); return; }
    api.listDatasets({ pageSize: 50, sort: "createdAt", order: "desc" })
      .then((r) => setDatasets(r.data.filter((d) => d.status === "PARSED")))
      .catch(() => setError("Failed to load datasets"))
      .finally(() => setLoading(false));
  }, [router]);

  const fetchMetrics = async (id: string, setter: (m: MetricsJson | null) => void, loadSetter: (b: boolean) => void) => {
    if (!id) { setter(null); return; }
    loadSetter(true);
    try {
      const res = await api.getMetrics(id);
      setter(res.data.metricsJson);
    } catch {
      setter(null);
    } finally {
      loadSetter(false);
    }
  };

  useEffect(() => { void fetchMetrics(idA, setMetricsA, setFetchingA); }, [idA]);
  useEffect(() => { void fetchMetrics(idB, setMetricsB, setFetchingB); }, [idB]);

  const nameA = datasets.find((d) => d.id === idA)?.name ?? "Dataset A";
  const nameB = datasets.find((d) => d.id === idB)?.name ?? "Dataset B";

  // Category comparison — merge top categories from both datasets
  const categoryChart = useMemo(() => {
    if (!metricsA || !metricsB) return [];
    const catMap = new Map<string, { a: number; b: number }>();
    for (const c of metricsA.topCategories.slice(0, 8)) {
      catMap.set(c.category, { a: Math.abs(c.total), b: 0 });
    }
    for (const c of metricsB.topCategories.slice(0, 8)) {
      const existing = catMap.get(c.category) ?? { a: 0, b: 0 };
      catMap.set(c.category, { ...existing, b: Math.abs(c.total) });
    }
    return [...catMap.entries()]
      .map(([category, v]) => ({ category, [nameA]: v.a, [nameB]: v.b }))
      .sort((x, y) => (y[nameA] as number) - (x[nameA] as number))
      .slice(0, 8);
  }, [metricsA, metricsB, nameA, nameB]);

  const bothLoaded = metricsA && metricsB;

  return (
    <main className="min-h-screen bg-[#050B18] px-4 py-8 text-white sm:px-6">
      <div className="mx-auto max-w-5xl">

        {/* Header */}
        <div className="mb-8 flex flex-wrap items-start justify-between gap-3">
          <div>
            <Link href="/dashboard" className="mb-1 flex items-center gap-1.5 w-fit">
              <LogoMark size={18} />
              <span className="text-xs font-bold tracking-tight text-zinc-500 transition hover:text-white">
                Insight<span className="text-blue-400">Stack</span>
              </span>
            </Link>
            <Link href="/dashboard" className="text-xs font-extrabold uppercase tracking-[0.15em] text-blue-500 transition hover:text-blue-400">
              ← Dashboard
            </Link>
            <h1 className="mt-1 text-2xl font-black text-white">Compare Datasets</h1>
            <p className="text-sm text-zinc-600">Select two parsed datasets to compare spending side by side.</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
        )}

        {/* Selectors */}
        <section className="mb-6 grid gap-4 sm:grid-cols-2">
          {([
            { id: idA, setId: setIdA, label: "Period A", fetching: fetchingA },
            { id: idB, setId: setIdB, label: "Period B", fetching: fetchingB },
          ] as const).map(({ id, setId, label, fetching }, i) => (
            <div key={i} className="rounded-xl border border-white/6 bg-zinc-900 p-5">
              <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-zinc-500">
                {label}
              </label>
              {loading ? (
                <div className="h-10 animate-pulse rounded-lg bg-zinc-800" />
              ) : (
                <select
                  value={id}
                  onChange={(e) => setId(e.target.value)}
                  className="w-full rounded-lg border border-white/8 bg-zinc-800 px-3 py-2.5 text-sm text-white focus:border-blue-500/40 focus:outline-none focus:ring-2 focus:ring-blue-500/15"
                >
                  <option value="">— Choose a dataset —</option>
                  {datasets.map((d) => (
                    <option key={d.id} value={d.id} disabled={d.id === (i === 0 ? idB : idA)}>
                      {d.name}
                    </option>
                  ))}
                </select>
              )}
              {fetching && <p className="mt-2 text-xs text-zinc-600">Loading metrics…</p>}
              {!fetching && id && !metricsA && i === 0 && <p className="mt-2 text-xs text-red-400">No metrics available</p>}
            </div>
          ))}
        </section>

        {/* Prompt to select */}
        {!idA && !idB && !loading && (
          <div className="rounded-xl border border-dashed border-white/8 bg-zinc-900/50 p-16 text-center">
            <p className="text-zinc-500">Select two datasets above to start comparing.</p>
            {datasets.length < 2 && (
              <p className="mt-2 text-xs text-zinc-700">
                You need at least 2 parsed datasets.{" "}
                <Link href="/dashboard" className="text-blue-500 hover:text-blue-400">Upload more →</Link>
              </p>
            )}
          </div>
        )}

        {/* Comparison table */}
        {bothLoaded && (
          <>
            <section className="mb-6 rounded-xl border border-white/6 bg-zinc-900 overflow-hidden">
              <div className="border-b border-white/5 px-5 py-4">
                <h2 className="font-bold text-zinc-100">Key Metrics</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/5 bg-zinc-800/50">
                      <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-widest text-zinc-600">Metric</th>
                      <th className="px-5 py-3 text-right text-xs font-bold uppercase tracking-widest text-blue-400">{nameA}</th>
                      <th className="px-5 py-3 text-right text-xs font-bold uppercase tracking-widest text-cyan-400">{nameB}</th>
                      <th className="px-5 py-3 text-right text-xs font-bold uppercase tracking-widest text-zinc-600">Change</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/4">
                    {METRICS.map((m) => {
                      const valA = metricsA[m.field] as number;
                      const valB = metricsB[m.field] as number;
                      const d = delta(valA, valB);
                      return (
                        <tr key={m.field} className="hover:bg-white/2">
                          <td className="px-5 py-3.5 font-medium text-zinc-300">{m.label}</td>
                          <td className="px-5 py-3.5 text-right font-mono font-bold text-blue-300">{m.format(valA)}</td>
                          <td className="px-5 py-3.5 text-right font-mono font-bold text-cyan-300">{m.format(valB)}</td>
                          <td className={`px-5 py-3.5 text-right text-xs font-bold ${deltaColor(m.field, d)}`}>
                            {d ? d.text : "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Category comparison chart */}
            {categoryChart.length > 0 && (
              <section className="rounded-xl border border-white/6 bg-zinc-900 p-5">
                <h2 className="mb-5 font-bold text-zinc-100">Spending by Category</h2>
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={categoryChart} layout="vertical" margin={{ top: 0, right: 16, left: 8, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: "#71717A" }} tickFormatter={(v) => `$${v}`} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="category" tick={{ fontSize: 11, fill: "#A1A1AA" }} width={110} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v) => money(Number(v))} />
                    <Legend wrapperStyle={{ color: "#71717A", fontSize: "12px" }} />
                    <Bar dataKey={nameA} fill="#3B82F6" name={nameA} radius={[0, 4, 4, 0]} maxBarSize={16} />
                    <Bar dataKey={nameB} fill="#06B6D4" name={nameB} radius={[0, 4, 4, 0]} maxBarSize={16} />
                  </BarChart>
                </ResponsiveContainer>
              </section>
            )}
          </>
        )}
      </div>
    </main>
  );
}
