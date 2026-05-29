"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { api, getToken, type Insight, type InsightJson } from "@/lib/api";
import { LogoMark } from "@/components/LogoMark";

const money = (v: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(v);

const COLORS = ["#3B82F6", "#06B6D4", "#10B981", "#8B5CF6", "#F97316"];

export default function PrintInsightPage() {
  const params = useParams<{ id: string; insightId: string }>();
  const datasetId = params?.id ?? "";
  const insightId = params?.insightId ?? "";

  const [insight, setInsight] = useState<Insight | null>(null);
  const [datasetName, setDatasetName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const printTriggered = useRef(false);

  useEffect(() => {
    if (!datasetId || !insightId) return;

    void (async () => {
      try {
        // Try sessionStorage first (fastest path — set by InsightCard before navigating)
        const cached = sessionStorage.getItem(`print_insight_${insightId}`);
        if (cached) {
          const parsed = JSON.parse(cached) as { insight: Insight; datasetName: string };
          setInsight(parsed.insight);
          setDatasetName(parsed.datasetName);
          setLoading(false);
          return;
        }

        // Fall back to API — list insights for this dataset and find the matching one
        const token = getToken();
        if (!token) { setError("Not authenticated"); setLoading(false); return; }

        const [datasetRes, insightsRes] = await Promise.all([
          api.getDataset(datasetId),
          api.listInsights(datasetId, { pageSize: 100, sort: "createdAt", order: "desc" }),
        ]);

        setDatasetName(datasetRes.data.name);
        const found = insightsRes.data.find((i) => i.id === insightId);
        if (!found) { setError("Insight not found"); setLoading(false); return; }
        setInsight(found);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load insight");
      } finally {
        setLoading(false);
      }
    })();
  }, [datasetId, insightId]);

  // Auto-print once the insight has loaded
  useEffect(() => {
    if (insight && !printTriggered.current) {
      printTriggered.current = true;
      // Small delay lets the browser fully render before the print dialog opens
      const t = setTimeout(() => window.print(), 800);
      return () => clearTimeout(t);
    }
  }, [insight]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-blue-500/30 border-t-blue-500" />
          <p className="text-sm text-slate-500">Preparing your report…</p>
        </div>
      </div>
    );
  }

  if (error || !insight) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <p className="text-sm text-red-500">{error || "Insight not found"}</p>
      </div>
    );
  }

  const json = insight.insightJson as InsightJson | null;
  const generatedAt = new Date(insight.createdAt).toLocaleString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit",
  });

  return (
    <>
      {/* Print button — hidden when printing */}
      <div className="print:hidden fixed right-6 top-6 z-50 flex gap-3">
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-xl bg-blue-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg transition hover:bg-blue-400"
        >
          Print / Save as PDF
        </button>
        <button
          type="button"
          onClick={() => window.close()}
          className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-600 shadow transition hover:bg-slate-50"
        >
          Close
        </button>
      </div>

      {/* Report — visible on screen and when printing */}
      <div className="min-h-screen bg-white px-12 py-10 text-slate-900 print:px-8 print:py-6">
        <div className="mx-auto max-w-3xl">

          {/* Header */}
          <header className="mb-8 flex items-start justify-between border-b border-slate-100 pb-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <LogoMark size={24} />
                <span className="text-lg font-black tracking-tight text-slate-800">
                  Insight<span className="text-blue-500">Stack</span>
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">AI Finance Analysis</p>
              <p className="mt-0.5 text-sm font-semibold text-slate-600">{datasetName}</p>
              <p className="text-xs text-slate-400">{generatedAt}</p>
            </div>
          </header>

          {/* Summary */}
          <section className="mb-8">
            <h1 className="mb-3 text-xl font-black text-slate-800">Analysis Summary</h1>
            <p className="leading-relaxed text-slate-600">{insight.insightText}</p>
          </section>

          {/* Top categories */}
          {json?.topSpendingCategories && json.topSpendingCategories.length > 0 && (
            <section className="mb-8">
              <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-400">
                Top Spending Categories
              </h2>
              <div className="space-y-4">
                {json.topSpendingCategories.map((cat, i) => {
                  const max = json.topSpendingCategories[0]?.amount ?? 1;
                  const pct = Math.max(4, (cat.amount / max) * 100);
                  return (
                    <div key={cat.category}>
                      <div className="mb-1.5 flex justify-between text-sm">
                        <span className="font-semibold text-slate-700">{cat.category}</span>
                        <span className="font-mono font-bold text-slate-800">{money(cat.amount)}</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-2 rounded-full"
                          style={{ width: `${pct}%`, backgroundColor: COLORS[i % COLORS.length] }}
                        />
                      </div>
                      <p className="mt-1 text-xs text-slate-400">{cat.reason}</p>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Anomalies */}
          {json?.anomalies && json.anomalies.length > 0 && (
            <section className="mb-8">
              <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-400">
                Statistical Anomalies
              </h2>
              <div className="space-y-3">
                {json.anomalies.map((a, i) => (
                  <div key={i} className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-3.5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold text-slate-800">{a.description}</p>
                        <p className="text-xs text-slate-500">{a.date.slice(0, 10)} · {a.category}</p>
                      </div>
                      <span className="shrink-0 font-mono font-black text-amber-600">{money(a.amount)}</span>
                    </div>
                    <p className="mt-1.5 text-xs text-amber-700">{a.reason}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Recommendations */}
          {json?.recommendations && json.recommendations.length > 0 && (
            <section className="mb-8">
              <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-400">
                Recommendations
              </h2>
              <ol className="space-y-3">
                {json.recommendations.map((rec, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-500 text-xs font-black text-white">
                      {i + 1}
                    </span>
                    <p className="text-sm leading-relaxed text-slate-600">{rec}</p>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {/* Footer */}
          <footer className="mt-12 border-t border-slate-100 pt-6 text-center">
            <p className="text-xs text-slate-400">
              Generated by <strong className="text-slate-500">InsightStack</strong> · AI-powered finance analytics ·{" "}
              <span className="font-mono text-slate-400">{insight.model}</span>
            </p>
            <p className="mt-1 text-xs text-slate-300">
              Numbers are computed directly from your transaction data. AI generates narrative text only.
            </p>
          </footer>
        </div>
      </div>
    </>
  );
}
