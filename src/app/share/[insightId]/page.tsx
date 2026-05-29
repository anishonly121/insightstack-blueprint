import { notFound } from "next/navigation";
import Link from "next/link";
import { LogoMark } from "@/components/LogoMark";
import type { Metadata } from "next";
import type { InsightJson } from "@/lib/api";

type SharedInsight = {
  id: string;
  createdAt: string;
  model: string;
  insightText: string;
  insightJson: InsightJson | null;
  datasetName: string;
};

async function fetchSharedInsight(insightId: string): Promise<SharedInsight | null> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://insightstack-peach.vercel.app";
  try {
    const res = await fetch(`${appUrl}/api/share/${insightId}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    const body = await res.json() as { data: SharedInsight };
    return body.data;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ insightId: string }> }): Promise<Metadata> {
  const { insightId } = await params;
  const insight = await fetchSharedInsight(insightId);
  if (!insight) return { title: "Insight not found — InsightStack" };
  return {
    title: `${insight.datasetName} — InsightStack`,
    description: insight.insightText.slice(0, 160),
  };
}

const money = (v: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Math.abs(v));

const COLORS = ["#3B82F6", "#06B6D4", "#10B981", "#8B5CF6", "#F97316"];

export default async function SharePage({ params }: { params: Promise<{ insightId: string }> }) {
  const { insightId } = await params;
  const insight = await fetchSharedInsight(insightId);
  if (!insight) notFound();

  const json = insight.insightJson;
  const generatedAt = new Date(insight.createdAt).toLocaleString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });

  return (
    <div className="min-h-screen bg-[#050B18] text-white">

      {/* Nav */}
      <nav className="border-b border-white/5 px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <Link href="/" className="flex items-center gap-1.5">
            <LogoMark size={20} />
            <span className="text-sm font-black tracking-tight">
              Insight<span className="text-blue-400">Stack</span>
            </span>
          </Link>
          <Link
            href="/register"
            className="rounded-lg bg-blue-500 px-4 py-1.5 text-xs font-bold text-white shadow-[0_0_15px_rgba(59,130,246,0.3)] transition hover:bg-blue-400"
          >
            Try free →
          </Link>
        </div>
      </nav>

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">

        {/* Header */}
        <header className="mb-8">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/8 px-3 py-1 text-xs font-semibold text-cyan-400">
            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
              <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
            Shared AI Analysis
          </div>
          <h1 className="text-2xl font-black text-white">{insight.datasetName}</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Generated {generatedAt} · <span className="font-mono text-zinc-600">{insight.model}</span>
          </p>
        </header>

        {/* Summary */}
        <section className="mb-8 rounded-xl border border-white/6 bg-zinc-900 p-6">
          <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-zinc-500">Summary</h2>
          <p className="leading-relaxed text-zinc-300">{insight.insightText}</p>
        </section>

        {/* Top categories */}
        {json?.topSpendingCategories && json.topSpendingCategories.length > 0 && (
          <section className="mb-6 rounded-xl border border-white/6 bg-zinc-900 p-6">
            <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-zinc-500">
              Top Spending Categories
            </h2>
            <div className="space-y-4">
              {json.topSpendingCategories.map((cat, i) => {
                const max = json.topSpendingCategories[0]?.amount ?? 1;
                const w = Math.max(4, (cat.amount / max) * 100);
                return (
                  <div key={cat.category}>
                    <div className="mb-1.5 flex justify-between text-sm">
                      <span className="font-semibold text-zinc-200">{cat.category}</span>
                      <span className="font-mono font-bold text-zinc-300">{money(cat.amount)}</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
                      <div className="h-2 rounded-full" style={{ width: `${w}%`, backgroundColor: COLORS[i % COLORS.length] }} />
                    </div>
                    <p className="mt-1 text-xs text-zinc-600">{cat.reason}</p>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Anomalies */}
        {json?.anomalies && json.anomalies.length > 0 && (
          <section className="mb-6 rounded-xl border border-white/6 bg-zinc-900 p-6">
            <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-zinc-500">
              Statistical Anomalies
            </h2>
            <div className="space-y-3">
              {json.anomalies.map((a, i) => (
                <div key={i} className="rounded-xl border border-amber-500/15 bg-amber-500/8 px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-zinc-100">{a.description}</p>
                      <p className="text-xs text-zinc-500">{a.date.slice(0, 10)} · {a.category}</p>
                    </div>
                    <span className="shrink-0 font-mono font-black text-amber-400">{money(a.amount)}</span>
                  </div>
                  <p className="mt-1.5 text-xs text-amber-500/80">{a.reason}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Recommendations */}
        {json?.recommendations && json.recommendations.length > 0 && (
          <section className="mb-8 rounded-xl border border-white/6 bg-zinc-900 p-6">
            <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-zinc-500">
              Recommendations
            </h2>
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
          </section>
        )}

        {/* CTA */}
        <div className="rounded-xl border border-blue-500/15 bg-blue-500/5 p-6 text-center">
          <p className="mb-1 font-bold text-zinc-100">Analyse your own finances</p>
          <p className="mb-4 text-sm text-zinc-500">
            Upload a CSV, get AI insights grounded in your actual transaction data. Free to start.
          </p>
          <Link
            href="/register"
            className="inline-block rounded-xl bg-blue-500 px-6 py-2.5 text-sm font-black text-white shadow-[0_0_20px_rgba(59,130,246,0.3)] transition hover:bg-blue-400"
          >
            Start free — no card needed →
          </Link>
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-xs text-zinc-700">
          Numbers computed from real transaction data · AI writes narrative only ·{" "}
          <Link href="/" className="text-zinc-600 transition hover:text-zinc-400">InsightStack</Link>
        </p>
      </main>
    </div>
  );
}
