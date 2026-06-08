"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart,
  Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import {
  api, exportTransactionsToCsv, getToken,
  type Budget, type DatasetDetail, type Insight, type InsightFinding, type InsightJson,
  type MetricsJson, type PaginatedMeta, type QuotaInfo, type Transaction,
} from "@/lib/api";

const COLORS = ["#3B82F6", "#06B6D4", "#10B981", "#EF4444", "#8B5CF6", "#EC4899", "#F97316"];

const tooltipStyle = {
  backgroundColor: "#18181B", border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "12px", boxShadow: "0 20px 50px rgba(0,0,0,0.6)", color: "#FAFAFA", fontSize: "13px",
};
const labelStyle = { color: "#71717A", fontSize: "11px", fontWeight: 600 };

const money = (v: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(v);
const pct = (v: number) => `${v >= 0 ? "+" : ""}${v.toFixed(1)}%`;

// ── Types ─────────────────────────────────────────────────────────────────────

type StreamStep = { message: string; done: boolean };

type InsightStreamEvent =
  | { type: "step"; message: string; status: "running" | "done" }
  | { type: "delta"; text: string }
  | { type: "done"; insightId: string; insight: Insight }
  | { type: "error"; message: string };

type ChatMessage = { role: "user" | "assistant"; content: string };

// ── Helper components ─────────────────────────────────────────────────────────

function SummaryCard({ label, value, sub, color, accentColor }: {
  label: string; value: string; sub?: string; color?: string; accentColor?: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-white/6 bg-zinc-900 p-4">
      {accentColor && <div className="absolute left-0 top-0 h-full w-[3px] rounded-l-xl" style={{ background: accentColor }} />}
      {accentColor && (
        <div className="pointer-events-none absolute inset-0 opacity-5"
          style={{ background: `radial-gradient(ellipse at left, ${accentColor} 0%, transparent 70%)` }} />
      )}
      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-600">{label}</p>
      <p className={`mt-1.5 text-xl font-black ${color ?? "text-white"}`}>{value}</p>
      {sub && <p className="mt-0.5 text-xs text-zinc-600">{sub}</p>}
    </div>
  );
}

const GRADE_COLOR: Record<string, string> = {
  excellent: "#10B981",
  good: "#3B82F6",
  fair: "#F59E0B",
  poor: "#F97316",
  critical: "#EF4444",
};

function HealthScoreRing({ score, grade }: { score: number; grade: string }) {
  const r = 34;
  const sw = 5;
  const nr = r - sw / 2;
  const circ = 2 * Math.PI * nr;
  const fill = (score / 100) * circ;
  const color = GRADE_COLOR[grade] ?? "#3B82F6";
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: r * 2, height: r * 2 }}>
        <svg width={r * 2} height={r * 2} className="-rotate-90" style={{ display: "block" }}>
          <circle cx={r} cy={r} r={nr} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={sw} />
          <circle
            cx={r} cy={r} r={nr} fill="none"
            stroke={color} strokeWidth={sw}
            strokeDasharray={`${fill} ${circ}`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-base font-black leading-none" style={{ color }}>{score}</span>
          <span className="text-[8px] font-semibold text-zinc-600 leading-none mt-0.5">/100</span>
        </div>
      </div>
      <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color }}>
        {grade}
      </span>
    </div>
  );
}

function InsightCard({ insight, datasetId, datasetName }: { insight: Insight; datasetId: string; datasetName: string }) {
  const json = insight.insightJson as InsightJson | null;
  const [expanded, setExpanded] = useState(false);
  const [xaiOpen, setXaiOpen] = useState(false);
  const [shared, setShared] = useState(insight.shared ?? false);
  const [shareUrl, setShareUrl] = useState<string | null>(
    insight.shared ? `${typeof window !== "undefined" ? window.location.origin : ""}/share/${insight.id}` : null,
  );
  const [sharing, setSharing] = useState(false);
  const [copied, setCopied] = useState(false);

  const onExportPdf = () => {
    sessionStorage.setItem(
      `print_insight_${insight.id}`,
      JSON.stringify({ insight, datasetName }),
    );
    window.open(`/dashboard/datasets/${datasetId}/insights/${insight.id}/print`, "_blank");
  };

  const onToggleShare = async () => {
    setSharing(true);
    try {
      const res = await api.toggleShare(datasetId, insight.id);
      setShared(res.data.shared);
      setShareUrl(res.data.url);
    } catch { /* ignore */ } finally {
      setSharing(false);
    }
  };

  const onCopyLink = async () => {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <article className="overflow-hidden rounded-xl border border-white/6 bg-zinc-900 transition-all hover:border-white/10">
      <div className="flex items-center justify-between border-b border-white/5 bg-gradient-to-r from-cyan-500/5 to-transparent px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-cyan-500/15 text-cyan-400 ring-1 ring-cyan-500/20">
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
          </div>
          <p className="text-xs text-zinc-500">
            {new Date(insight.createdAt).toLocaleString()} · <span className="font-mono text-cyan-400">{insight.model}</span>
            {json?.confidence != null && (
              <span className="ml-2 rounded-full bg-cyan-500/10 px-2 py-0.5 font-mono text-[10px] font-bold text-cyan-400 ring-1 ring-cyan-500/20">
                {Math.round(json.confidence * 100)}% conf
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => void onToggleShare()} disabled={sharing}
            className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition ${shared ? "border-emerald-500/20 text-emerald-400 hover:border-emerald-500/30" : "border-white/8 text-zinc-500 hover:border-white/15 hover:text-zinc-300"} disabled:opacity-50`}
            title={shared ? "Shared — click to make private" : "Share this insight"}>
            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
            </svg>
            {shared ? "Shared" : "Share"}
          </button>
          {shared && shareUrl && (
            <button type="button" onClick={() => void onCopyLink()}
              className="flex items-center gap-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/8 px-2.5 py-1 text-xs font-semibold text-emerald-400 transition hover:bg-emerald-500/15">
              {copied ? "Copied!" : "Copy link"}
            </button>
          )}
          <button type="button" onClick={onExportPdf}
            className="flex items-center gap-1.5 rounded-lg border border-white/8 px-2.5 py-1 text-xs font-medium text-zinc-500 transition hover:border-blue-500/20 hover:text-blue-400"
            title="Export as PDF">
            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            PDF
          </button>
          <button type="button" onClick={() => setExpanded(v => !v)}
            className="flex items-center gap-1 rounded-lg border border-white/8 px-2.5 py-1 text-xs font-medium text-zinc-500 transition hover:border-white/15 hover:text-zinc-300">
            {expanded ? "Collapse" : "Expand"}
            <svg className={`h-3.5 w-3.5 transition-transform ${expanded ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>
      {/* Health score + forecast strip */}
      {json?.healthScore && (
        <div className="flex items-center gap-5 border-b border-white/5 px-4 py-3">
          <HealthScoreRing score={json.healthScore.score} grade={json.healthScore.grade} />
          <div className="flex flex-1 flex-wrap gap-x-6 gap-y-2">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-600">Health Score</p>
              <p className="text-sm font-black text-zinc-200">
                {json.healthScore.score}/100
                <span className="ml-1.5 text-xs font-normal text-zinc-500 capitalize">({json.healthScore.grade})</span>
              </p>
            </div>
            {json.forecast && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-600">Next Month Forecast</p>
                <p className="text-sm font-black text-zinc-200">
                  {money(json.forecast.predicted)}
                  <span className="ml-1.5 text-xs font-normal text-zinc-500">
                    ±{money(json.forecast.upper - json.forecast.predicted)} 95% CI
                  </span>
                </p>
                <p className="text-[10px] text-zinc-600">{json.forecast.basisMonths}-month basis</p>
              </div>
            )}
            {json.healthScore.breakdown && (
              <div className="hidden sm:block">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-600">Score Breakdown</p>
                <div className="mt-0.5 flex gap-2">
                  {[
                    { label: "Savings", v: json.healthScore.breakdown.savingsComponent },
                    { label: "Diversif.", v: json.healthScore.breakdown.concentrationComponent },
                    { label: "Trend", v: json.healthScore.breakdown.trendComponent },
                    { label: "Anomalies", v: json.healthScore.breakdown.anomalyComponent },
                  ].map(({ label, v }) => (
                    <div key={label} className="flex flex-col items-center gap-0.5">
                      <div className="h-6 w-4 rounded-sm bg-zinc-800 overflow-hidden flex items-end">
                        <div
                          className="w-full rounded-sm bg-blue-500/50"
                          style={{ height: `${v}%` }}
                        />
                      </div>
                      <span className="text-[8px] text-zinc-600">{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      <div className="px-4 pt-3 pb-2">
        <p className="text-sm leading-relaxed text-zinc-400">{insight.insightText}</p>
      </div>
      {/* Quick-stats pills — visible in both collapsed and expanded states */}
      {json && (json.anomalies?.length > 0 || json.topSpendingCategories?.[0] || json.recommendations?.length > 0) && (
        <div className="flex flex-wrap items-center gap-2 px-4 pb-3">
          {(json.topSpendingCategories?.[0]) && (
            <span className="flex items-center gap-1.5 rounded-full bg-blue-500/10 px-2.5 py-1 text-[10px] font-semibold text-blue-400 ring-1 ring-blue-500/20">
              ↑ {json.topSpendingCategories[0].category}
            </span>
          )}
          {json.anomalies?.length > 0 && (
            <span className="flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-1 text-[10px] font-semibold text-amber-400 ring-1 ring-amber-500/20">
              ⚠ {json.anomalies.length} anomal{json.anomalies.length === 1 ? "y" : "ies"}
            </span>
          )}
          {json.recommendations?.length > 0 && (
            <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold text-emerald-400 ring-1 ring-emerald-500/20">
              💡 {json.recommendations.length} recommendations
            </span>
          )}
        </div>
      )}
      {expanded && json && (
        <div className="space-y-5 border-t border-white/5 px-4 pb-4">
          {json.topSpendingCategories?.length > 0 && (
            <div>
              <h4 className="mb-3 text-xs font-bold uppercase tracking-widest text-zinc-600">Top Spending Categories</h4>
              <div className="space-y-3">
                {json.topSpendingCategories.map((cat, i) => {
                  const max = json.topSpendingCategories[0]?.amount ?? 1;
                  const w = Math.max(4, (cat.amount / max) * 100);
                  return (
                    <div key={cat.category}>
                      <div className="mb-1.5 flex justify-between text-sm">
                        <span className="font-semibold text-zinc-200">{cat.category}</span>
                        <span className="text-zinc-500">{money(cat.amount)}</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-zinc-800">
                        <div className="h-2 rounded-full transition-all" style={{ width: `${w}%`, backgroundColor: COLORS[i % COLORS.length] }} />
                      </div>
                      <p className="mt-0.5 text-xs text-zinc-600">{cat.reason}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {json.anomalies?.length > 0 && (
            <div>
              <h4 className="mb-3 text-xs font-bold uppercase tracking-widest text-zinc-600">Anomalies Detected</h4>
              <div className="space-y-2">
                {json.anomalies.map((a, i) => (
                  <div key={i} className="rounded-xl border border-amber-500/15 bg-amber-500/8 px-4 py-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-zinc-100">{a.description}</p>
                        <p className="text-xs text-zinc-500">{a.date.slice(0, 10)} · {a.category}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="shrink-0 font-mono text-sm font-black text-amber-400">{money(a.amount)}</span>
                        {a.zScore != null && (
                          <span className="rounded-full bg-amber-500/20 px-2 py-0.5 font-mono text-[10px] font-bold text-amber-300 ring-1 ring-amber-500/30">
                            {a.zScore.toFixed(1)}σ
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="mt-1.5 text-xs text-amber-500/70">{a.reason}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          {json.recommendations?.length > 0 && (
            <div>
              <h4 className="mb-3 text-xs font-bold uppercase tracking-widest text-zinc-600">Recommendations</h4>
              <ol className="space-y-3">
                {json.recommendations.map((rec, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-500 text-xs font-black text-white">{i + 1}</span>
                    <p className="text-sm leading-relaxed text-zinc-400">{rec}</p>
                  </li>
                ))}
              </ol>
            </div>
          )}
          {/* XAI — Explainable AI panel */}
          {json.findings && json.findings.length > 0 && (
            <div className="rounded-xl border border-white/6 bg-zinc-800/40">
              <button
                type="button"
                onClick={() => setXaiOpen(v => !v)}
                className="flex w-full items-center justify-between px-4 py-3 text-left"
              >
                <div className="flex items-center gap-2">
                  <svg className="h-3.5 w-3.5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15M14.25 3.104c.251.023.501.05.75.082M19.8 15l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.607L5 14.5m14.8.5-1.175 2.955A48.677 48.677 0 0112 18.75a48.677 48.677 0 00-6.625-.295L5 14.5m0 0-1.57.393" />
                  </svg>
                  <span className="text-xs font-bold uppercase tracking-widest text-violet-400">AI Reasoning</span>
                  <span className="rounded-full bg-violet-500/10 px-2 py-0.5 text-[10px] font-bold text-violet-400 ring-1 ring-violet-500/20">
                    {json.findings.length} rule{json.findings.length !== 1 ? "s" : ""} fired
                  </span>
                </div>
                <svg className={`h-3.5 w-3.5 text-zinc-600 transition-transform ${xaiOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {xaiOpen && (
                <div className="border-t border-white/5 px-4 pb-4 pt-3 space-y-2">
                  <p className="mb-3 text-[10px] text-zinc-600">
                    Each finding is an expert rule evaluated deterministically against your data.
                    Confidence = rule signal strength.
                  </p>
                  {(json.findings as InsightFinding[]).map((f) => {
                    const sColor =
                      f.severity === "critical" ? "text-red-400 bg-red-500/10 ring-red-500/20"
                      : f.severity === "warning" ? "text-amber-400 bg-amber-500/10 ring-amber-500/20"
                      : "text-blue-400 bg-blue-500/10 ring-blue-500/20";
                    return (
                      <div key={f.id} className="flex items-start gap-3 rounded-lg border border-white/5 bg-zinc-900/60 px-3 py-2.5">
                        <span className={`mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-widest ring-1 ${sColor}`}>
                          {f.severity}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-zinc-200">{f.title}</p>
                          <p className="mt-0.5 text-[11px] leading-relaxed text-zinc-500">{f.body}</p>
                        </div>
                        <span className="shrink-0 font-mono text-xs font-bold text-violet-400">
                          {Math.round(f.confidence * 100)}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </article>
  );
}

function StreamingPanel({ steps, text, finished }: { steps: StreamStep[]; text: string; finished: boolean }) {
  return (
    <div className={`overflow-hidden rounded-xl border transition-all duration-500 ${finished ? "border-emerald-500/20 bg-emerald-500/3" : "border-cyan-500/20 bg-zinc-900"}`}>
      <div className="flex items-center gap-2.5 border-b border-white/5 px-5 py-3">
        {finished ? (
          <svg className="h-4 w-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ) : (
          <div className="h-2 w-2 animate-pulse rounded-full bg-cyan-400" />
        )}
        <span className={`text-xs font-bold uppercase tracking-widest ${finished ? "text-emerald-400" : "text-cyan-400"}`}>
          {finished ? "Analysis Complete" : "AI Analysis in Progress"}
        </span>
      </div>

      <div className="p-5">
        {steps.length > 0 && (
          <div className="mb-4 space-y-2">
            {steps.map((step, i) => (
              <div key={i} className="flex items-start gap-2.5 text-sm">
                {step.done ? (
                  <svg className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                ) : (
                  <div className="mt-0.5 h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-cyan-500/30 border-t-cyan-400" />
                )}
                <span className={step.done ? "text-zinc-500" : "text-zinc-200"}>{step.message}</span>
              </div>
            ))}
          </div>
        )}

        {text && (
          <div className="rounded-xl border border-white/5 bg-zinc-800/60 p-4">
            <p className="text-sm leading-relaxed text-zinc-300">
              {text}
              {!finished && <span className="ml-0.5 animate-pulse text-cyan-400">█</span>}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

const CHAT_SUGGESTIONS = [
  "What's my biggest expense category?",
  "Am I saving enough each month?",
  "Which transactions look unusual?",
  "How does my income compare to expenses?",
];

function ChatPanel({ datasetId }: { datasetId: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const onSend = async (e?: FormEvent, overrideMessage?: string) => {
    e?.preventDefault();
    const text = (overrideMessage ?? input).trim();
    if (!text || loading) return;

    setInput("");
    const userMsg: ChatMessage = { role: "user", content: text };
    setMessages(prev => [...prev, userMsg, { role: "assistant", content: "" }]);
    setLoading(true);

    try {
      const token = getToken();
      const res = await fetch(`/api/datasets/${datasetId}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          message: text,
          history: messages.slice(-10),
        }),
      });

      if (!res.ok || !res.body) {
        setMessages(prev => {
          const copy = [...prev];
          copy[copy.length - 1] = { role: "assistant", content: "Sorry, I couldn't reach the AI right now. Try again in a moment." };
          return copy;
        });
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const event = JSON.parse(line.slice(6)) as { type: string; text?: string; message?: string };
            if (event.type === "delta" && event.text) {
              setMessages(prev => {
                const copy = [...prev];
                const last = copy[copy.length - 1];
                if (last?.role === "assistant") copy[copy.length - 1] = { ...last, content: last.content + event.text! };
                return copy;
              });
            } else if (event.type === "error") {
              setMessages(prev => {
                const copy = [...prev];
                copy[copy.length - 1] = { role: "assistant", content: event.message ?? "Something went wrong." };
                return copy;
              });
            }
          } catch { /* skip malformed */ }
        }
      }
    } catch {
      setMessages(prev => {
        const copy = [...prev];
        copy[copy.length - 1] = { role: "assistant", content: "Connection failed. Please try again." };
        return copy;
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="rounded-xl border border-white/6 bg-zinc-900">
      <div className="flex items-center gap-3 border-b border-white/5 bg-gradient-to-r from-blue-500/5 to-transparent px-5 py-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 ring-1 ring-blue-500/20">
          <svg className="h-4 w-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
          </svg>
        </div>
        <div>
          <h2 className="font-bold text-zinc-100">Chat with your data</h2>
          <p className="text-xs text-zinc-600">Answers grounded in your exact numbers — no guesswork</p>
        </div>
      </div>

      {messages.length === 0 && (
        <div className="flex flex-wrap gap-2 px-5 pt-4">
          {CHAT_SUGGESTIONS.map(s => (
            <button
              key={s}
              type="button"
              onClick={() => void onSend(undefined, s)}
              className="rounded-full border border-white/8 bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-400 transition hover:border-white/15 hover:text-zinc-200"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {messages.length > 0 && (
        <div className="max-h-96 space-y-4 overflow-y-auto px-5 py-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start gap-2"}`}>
              {msg.role === "assistant" && (
                <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-500/15 ring-1 ring-cyan-500/20 text-cyan-400">
                  <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                  </svg>
                </div>
              )}
              <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "rounded-br-sm bg-blue-500 text-white"
                  : "rounded-bl-sm bg-zinc-800 text-zinc-200"
              }`}>
                {msg.content || (loading && i === messages.length - 1 ? (
                  <span className="flex items-center gap-1">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-500 [animation-delay:0ms]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-500 [animation-delay:150ms]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-500 [animation-delay:300ms]" />
                  </span>
                ) : "")}
              </div>
            </div>
          ))}
          <div ref={endRef} />
        </div>
      )}

      <form
        onSubmit={(e) => void onSend(e)}
        className="flex gap-2 border-t border-white/5 p-4"
      >
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask about your spending…"
          disabled={loading}
          className="flex-1 rounded-xl border border-white/8 bg-zinc-800 px-4 py-2.5 text-sm text-white placeholder-zinc-600 transition focus:border-blue-500/40 focus:outline-none focus:ring-2 focus:ring-blue-500/15 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="rounded-xl bg-blue-500 px-4 py-2.5 text-sm font-black text-white shadow-[0_0_15px_rgba(59,130,246,0.25)] transition hover:bg-blue-400 disabled:opacity-40"
        >
          Send →
        </button>
      </form>
    </section>
  );
}

// ── Forecast ─────────────────────────────────────────────────────────────────

function computeForecast(monthlyBreakdown: MetricsJson["monthlyBreakdown"]): {
  projected: number; daysLeft: number; dailyRate: number; currentSpend: number;
} | null {
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const current = monthlyBreakdown.find((m) => m.month === currentMonth);
  if (!current || current.expenses === 0) return null;

  const dayOfMonth = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysLeft = daysInMonth - dayOfMonth;
  const dailyRate = current.expenses / dayOfMonth;
  const projected = current.expenses + dailyRate * daysLeft;

  return { projected, daysLeft, dailyRate, currentSpend: current.expenses };
}

// ── Budget tracker ────────────────────────────────────────────────────────────

function BudgetTracker({
  categories, budgets, onUpsert, onDelete,
}: {
  categories: MetricsJson["topCategories"];
  budgets: Budget[];
  onUpsert: (category: string, limit: number) => Promise<void>;
  onDelete: (category: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState<string | null>(null);
  const [inputVal, setInputVal] = useState("");
  const [saving, setSaving] = useState<string | null>(null);

  const budgetMap = new Map(budgets.map((b) => [b.category, b.monthlyLimit]));

  const startEdit = (category: string) => {
    const existing = budgetMap.get(category);
    setInputVal(existing ? String(existing) : "");
    setEditing(category);
  };

  const save = async (category: string) => {
    const val = parseFloat(inputVal);
    if (!isFinite(val) || val <= 0) { setEditing(null); return; }
    setSaving(category);
    try { await onUpsert(category, val); } finally { setSaving(null); setEditing(null); }
  };

  const remove = async (category: string) => {
    setSaving(category);
    try { await onDelete(category); } finally { setSaving(null); }
  };

  return (
    <section className="mb-6 rounded-xl border border-white/6 bg-zinc-900">
      <div className="flex items-center gap-3 border-b border-white/5 bg-gradient-to-r from-violet-500/5 to-transparent px-5 py-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 ring-1 ring-violet-500/20">
          <svg className="h-4 w-4 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <h2 className="font-bold text-zinc-100">Budget Tracker</h2>
          <p className="text-xs text-zinc-600">Set monthly limits per category — tracked across all your datasets</p>
        </div>
      </div>

      <div className="divide-y divide-white/4 px-5">
        {categories.slice(0, 8).map((cat) => {
          const limit = budgetMap.get(cat.category);
          const spent = Math.abs(cat.total);
          const ratio = limit ? Math.min(spent / limit, 1) : 0;
          const pctNum = limit ? (spent / limit) * 100 : 0;
          const isOver = limit !== undefined && spent > limit;
          const isWarn = limit !== undefined && pctNum >= 80 && !isOver;
          const barColor = isOver ? "#EF4444" : isWarn ? "#F59E0B" : "#8B5CF6";

          return (
            <div key={cat.category} className="py-4">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-zinc-100">{cat.category}</span>
                  {isOver && (
                    <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-xs font-bold text-red-400 ring-1 ring-red-500/20">
                      Over budget
                    </span>
                  )}
                  {isWarn && (
                    <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-bold text-amber-400 ring-1 ring-amber-500/20">
                      80%+ used
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-zinc-300">{money(spent)}</span>
                  {limit !== undefined ? (
                    <>
                      <span className="text-xs text-zinc-600">of {money(limit)}/mo</span>
                      {saving === cat.category ? (
                        <span className="text-xs text-zinc-600">Saving…</span>
                      ) : (
                        <>
                          <button type="button" onClick={() => startEdit(cat.category)}
                            className="rounded-lg border border-white/8 px-2 py-1 text-xs font-medium text-zinc-500 transition hover:border-white/15 hover:text-zinc-300">
                            Edit
                          </button>
                          <button type="button" onClick={() => void remove(cat.category)}
                            className="rounded-lg border border-white/8 px-2 py-1 text-xs font-medium text-zinc-600 transition hover:border-red-500/20 hover:text-red-400">
                            ✕
                          </button>
                        </>
                      )}
                    </>
                  ) : (
                    editing === cat.category ? null : (
                      <button type="button" onClick={() => startEdit(cat.category)}
                        className="rounded-lg border border-violet-500/20 bg-violet-500/8 px-2.5 py-1 text-xs font-semibold text-violet-400 transition hover:bg-violet-500/15">
                        + Set limit
                      </button>
                    )
                  )}
                </div>
              </div>

              {editing === cat.category && (
                <form onSubmit={(e) => { e.preventDefault(); void save(cat.category); }}
                  className="mb-2 flex items-center gap-2">
                  <span className="text-sm text-zinc-500">$</span>
                  <input
                    type="number" min="1" step="0.01" autoFocus
                    value={inputVal} onChange={(e) => setInputVal(e.target.value)}
                    placeholder="Monthly limit"
                    className="w-36 rounded-lg border border-violet-500/30 bg-zinc-800 px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                  />
                  <button type="submit" className="rounded-lg bg-violet-500 px-3 py-1.5 text-xs font-black text-white hover:bg-violet-400">
                    Save
                  </button>
                  <button type="button" onClick={() => setEditing(null)}
                    className="rounded-lg border border-white/8 px-3 py-1.5 text-xs font-medium text-zinc-500 hover:text-white">
                    Cancel
                  </button>
                </form>
              )}

              {limit !== undefined && (
                <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
                  <div
                    className="h-2 rounded-full transition-all duration-700"
                    style={{ width: `${ratio * 100}%`, backgroundColor: barColor }}
                  />
                </div>
              )}
              {limit === undefined && (
                <div className="h-2 w-full rounded-full bg-zinc-800/50 border border-dashed border-white/10" />
              )}
              <div className="mt-1 flex justify-between text-xs text-zinc-700">
                <span>{cat.count} transactions</span>
                {limit !== undefined && (
                  <span style={{ color: isOver ? "#EF4444" : isWarn ? "#F59E0B" : "#71717A" }}>
                    {pctNum.toFixed(0)}% of limit
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

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
  const [quota, setQuota] = useState<QuotaInfo | null>(null);
  const [insightPage, setInsightPage] = useState(1);
  const [insightMeta, setInsightMeta] = useState<PaginatedMeta>({ page: 1, pageSize: 5, total: 0, totalPages: 1 });
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [txPage, setTxPage] = useState(1);
  const [txLoading, setTxLoading] = useState(false);
  const [budgets, setBudgets] = useState<Budget[]>([]);

  // Streaming state
  const [streamActive, setStreamActive] = useState(false);
  const [streamSteps, setStreamSteps] = useState<StreamStep[]>([]);
  const [streamText, setStreamText] = useState("");
  const [streamFinished, setStreamFinished] = useState(false);

  const loadTransactions = useCallback(async (page: number, q: string, cat: string) => {
    if (!id) return;
    setTxLoading(true);
    try {
      const res = await api.getTransactions(id, { page, pageSize: 25, sort: "date", order: "desc", search: q || undefined, category: cat || undefined });
      setTransactions(res.data);
      setTxMeta(res.meta);
      if (res.categories.length > 0) setCategories(res.categories);
    } catch { /* ignore */ } finally { setTxLoading(false); }
  }, [id]);

  const loadInsights = useCallback(async (page: number) => {
    if (!id) return;
    const res = await api.listInsights(id, { page, pageSize: 5, sort: "createdAt", order: "desc" });
    setInsights(res.data);
    setInsightMeta(res.meta);
    setInsightPage(page);
  }, [id]);

  const load = useCallback(async () => {
    if (!id) return;
    setError("");
    setLoading(true);
    try {
      const [datasetRes, metricsRes, quotaRes, budgetsRes] = await Promise.all([
        api.getDataset(id),
        api.getMetrics(id).catch(() => null),
        api.quota().catch(() => null),
        api.listBudgets().catch(() => null),
      ]);
      setDataset(datasetRes.data);
      if (metricsRes) setMetrics(metricsRes.data.metricsJson);
      if (quotaRes) setQuota(quotaRes.data);
      if (budgetsRes) setBudgets(budgetsRes.data);
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

  const onUpsertBudget = async (category: string, limit: number) => {
    const res = await api.upsertBudget(category, limit);
    setBudgets((prev) => {
      const filtered = prev.filter((b) => b.category !== category);
      return [...filtered, res.data].sort((a, b) => a.category.localeCompare(b.category));
    });
  };

  const onDeleteBudget = async (category: string) => {
    await api.deleteBudget(category);
    setBudgets((prev) => prev.filter((b) => b.category !== category));
  };

  const onGenerateInsights = async () => {
    if (!id || streamActive) return;
    setError("");
    setStreamActive(true);
    setStreamSteps([]);
    setStreamText("");
    setStreamFinished(false);

    try {
      const token = getToken();
      const res = await fetch(`/api/datasets/${id}/insights/stream`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null) as { error?: { message?: string } } | null;
        setError(errData?.error?.message ?? "Failed to start analysis");
        setStreamActive(false);
        return;
      }

      if (!res.body) { setError("No response stream"); setStreamActive(false); return; }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const event = JSON.parse(line.slice(6)) as InsightStreamEvent;

            if (event.type === "step") {
              if (event.status === "running") {
                setStreamSteps(prev => [...prev, { message: event.message, done: false }]);
              } else {
                setStreamSteps(prev => {
                  const lastRunning = [...prev].reverse().findIndex(s => !s.done);
                  if (lastRunning === -1) return [...prev, { message: event.message, done: true }];
                  const idx = prev.length - 1 - lastRunning;
                  return prev.map((s, i) => i === idx ? { message: event.message, done: true } : s);
                });
              }
            } else if (event.type === "delta") {
              setStreamText(prev => prev + event.text);
            } else if (event.type === "done") {
              setStreamFinished(true);
              await loadInsights(1);
              const quotaRes = await api.quota().catch(() => null);
              if (quotaRes) setQuota(quotaRes.data);
              setTimeout(() => {
                setStreamActive(false);
                setStreamSteps([]);
                setStreamText("");
                setStreamFinished(false);
              }, 2500);
            } else if (event.type === "error") {
              setError(event.message);
              setStreamActive(false);
            }
          } catch { /* skip */ }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connection failed");
      setStreamActive(false);
    }
  };

  const onSearch = (q: string) => { setSearch(q); setTxPage(1); void loadTransactions(1, q, categoryFilter); };
  const onCategoryFilter = (cat: string) => { setCategoryFilter(cat); setTxPage(1); void loadTransactions(1, search, cat); };
  const onTxPageChange = (page: number) => { setTxPage(page); void loadTransactions(page, search, categoryFilter); };

  const monthlyChart = useMemo(() => metrics?.monthlyBreakdown ?? [], [metrics]);
  const categoryChart = useMemo(
    () => (metrics?.topCategories ?? []).filter(c => c.total !== 0).slice(0, 7).map(c => ({ category: c.category, total: Math.abs(c.total) })),
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
          <div className="flex items-center gap-2">
            {dataset && (
              <span className={`inline-block rounded-full px-3 py-1 text-xs font-bold ring-1 ${
                dataset.status === "PARSED" ? "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20"
                : dataset.status === "FAILED" ? "bg-red-500/10 text-red-400 ring-red-500/20"
                : "bg-blue-500/10 text-blue-400 ring-blue-500/20"
              }`}>
                {dataset.status}
              </span>
            )}
            <Link href="/dashboard/activity" className="rounded-lg border border-white/8 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-400 transition hover:text-white">Activity</Link>
            <Link href="/dashboard/settings" className="rounded-lg border border-white/8 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-400 transition hover:text-white">Settings</Link>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
        )}

        {loading ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-20 animate-pulse rounded-xl bg-zinc-800" />)}
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

            {/* Forecast card */}
            {metrics && (() => {
              const forecast = computeForecast(metrics.monthlyBreakdown);
              if (!forecast) return null;
              return (
                <div className="mb-6 rounded-xl border border-blue-500/15 bg-gradient-to-r from-blue-500/8 to-transparent p-5">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest text-blue-400">Month-end Forecast</p>
                      <p className="mt-1 text-2xl font-black text-white">{money(forecast.projected)}</p>
                      <p className="mt-0.5 text-xs text-zinc-500">
                        Projected total expenses · {money(forecast.dailyRate)}/day · {forecast.daysLeft} days remaining
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-zinc-600">Spent so far this month</p>
                      <p className="text-lg font-black text-zinc-300">{money(forecast.currentSpend)}</p>
                      <p className="text-xs text-zinc-600">
                        {((forecast.currentSpend / forecast.projected) * 100).toFixed(0)}% of projected total
                      </p>
                    </div>
                  </div>
                </div>
              );
            })()}

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
                        labelLine={{ stroke: "rgba(255,255,255,0.15)" }}>
                        {categoryChart.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} stroke="transparent" />)}
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
                      <YAxis tick={{ fontSize: 11, fill: "#71717A" }} tickFormatter={v => `$${v}`} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={tooltipStyle} labelStyle={labelStyle} formatter={(v) => money(Number(v))} />
                      <Legend wrapperStyle={{ color: "#71717A", fontSize: "12px" }} />
                      <Bar dataKey="income" fill="#10B981" name="Income" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="expenses" fill="#EF4444" name="Expenses" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </section>

            {monthlyChart.length > 1 && (
              <section className="mb-6 rounded-xl border border-white/6 bg-zinc-900 p-5">
                <h2 className="mb-5 font-bold text-zinc-100">Net Savings Trend</h2>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={monthlyChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#71717A" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#71717A" }} tickFormatter={v => `$${v}`} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={tooltipStyle} labelStyle={labelStyle} formatter={(v) => money(Number(v))} />
                    <Line type="monotone" dataKey="net" name="Net" stroke="#3B82F6" strokeWidth={2.5}
                      dot={{ r: 4, fill: "#3B82F6", strokeWidth: 0 }}
                      activeDot={{ r: 6, fill: "#3B82F6", stroke: "rgba(59,130,246,0.3)", strokeWidth: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </section>
            )}

            {/* Budget tracker */}
            {metrics && metrics.topCategories.length > 0 && (
              <BudgetTracker
                categories={metrics.topCategories}
                budgets={budgets}
                onUpsert={onUpsertBudget}
                onDelete={onDeleteBudget}
              />
            )}

            {/* Transactions */}
            <section className="mb-6 rounded-xl border border-white/6 bg-zinc-900">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 px-5 py-4">
                <h2 className="font-bold text-zinc-100">
                  Transactions <span className="text-sm font-normal text-zinc-600">({txMeta.total.toLocaleString()})</span>
                </h2>
                <button type="button" onClick={() => exportTransactionsToCsv(transactions, `${dataset?.name ?? "transactions"}.csv`)}
                  disabled={transactions.length === 0}
                  className="rounded-lg border border-white/8 bg-zinc-800 px-3 py-1.5 text-sm font-medium text-zinc-400 transition hover:border-white/15 hover:text-white disabled:opacity-40">
                  ↓ Export CSV
                </button>
              </div>
              <div className="flex flex-wrap gap-3 border-b border-white/5 px-5 py-3">
                <input type="search" placeholder="Search description..." value={search} onChange={e => onSearch(e.target.value)}
                  className="flex-1 min-w-[180px] rounded-lg border border-white/8 bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-600 focus:border-blue-500/40 focus:outline-none focus:ring-2 focus:ring-blue-500/15" />
                <select value={categoryFilter} onChange={e => onCategoryFilter(e.target.value)}
                  className="rounded-lg border border-white/8 bg-zinc-800 px-3 py-2 text-sm text-zinc-300 focus:border-blue-500/40 focus:outline-none focus:ring-2 focus:ring-blue-500/15">
                  <option value="">All categories</option>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
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
                      {transactions.map(tx => {
                        const amount = Number(tx.amount);
                        return (
                          <tr key={tx.id} className="transition hover:bg-white/2">
                            <td className="whitespace-nowrap px-4 py-3 text-zinc-600">{tx.date.slice(0, 10)}</td>
                            <td className="px-4 py-3 text-zinc-300">{tx.description}</td>
                            <td className="px-4 py-3">
                              <span className="rounded-full bg-zinc-800 px-2.5 py-0.5 text-xs font-medium text-zinc-400 ring-1 ring-white/5">{tx.category}</span>
                            </td>
                            <td className={`px-4 py-3 text-right font-mono font-black ${amount >= 0 ? "text-emerald-400" : "text-red-400"}`}>{money(amount)}</td>
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
            <section className="mb-6 rounded-xl border border-white/6 bg-zinc-900">
              <div className="flex items-center justify-between border-b border-white/5 bg-gradient-to-r from-cyan-500/5 to-transparent px-5 py-4">
                <div>
                  <h2 className="font-bold text-zinc-100">AI Insights</h2>
                  <p className="text-xs text-zinc-600">
                    Grounded analysis · numbers from your database, narrative from AI · {insightMeta.total} analysis{insightMeta.total !== 1 ? "es" : ""}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <button type="button" onClick={() => void onGenerateInsights()}
                    disabled={streamActive || quota?.remaining === 0}
                    className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-black text-white shadow-[0_0_15px_rgba(6,182,212,0.3)] transition hover:bg-cyan-400 hover:shadow-[0_0_25px_rgba(6,182,212,0.5)] disabled:opacity-50">
                    {streamActive ? "Analysing…" : "✦ Generate Insights"}
                  </button>
                  {quota && (
                    <div className="flex items-center gap-1.5">
                      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-zinc-800">
                        <div className={`h-full rounded-full transition-all ${quota.remaining === 0 ? "bg-red-500" : quota.insightsToday > 20 ? "bg-amber-500" : "bg-cyan-500"}`}
                          style={{ width: `${(quota.insightsToday / quota.quota) * 100}%` }} />
                      </div>
                      <span className={`text-xs tabular-nums ${quota.remaining === 0 ? "text-red-400" : "text-zinc-600"}`}>
                        {quota.insightsToday}/{quota.quota} today
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-5">
                {streamActive && (
                  <div className="mb-4">
                    <StreamingPanel steps={streamSteps} text={streamText} finished={streamFinished} />
                  </div>
                )}

                {!streamActive && insights.length === 0 && (
                  <div className="rounded-xl border border-dashed border-white/8 bg-zinc-800/50 p-12 text-center">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-400 ring-1 ring-cyan-500/20">
                      <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                      </svg>
                    </div>
                    <p className="font-bold text-zinc-200">No insights yet</p>
                    <p className="mt-2 text-sm text-zinc-600">
                      Upload a CSV, then click <strong className="text-cyan-400">Generate Insights</strong>.
                      The AI will stream a live analysis grounded in your exact transaction data.
                    </p>
                  </div>
                )}

                {insights.length > 0 && (
                  <div className="space-y-4">
                    {insights.map(insight => <InsightCard key={insight.id} insight={insight} datasetId={id} datasetName={dataset?.name ?? ""} />)}
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

            {/* Chat panel — always visible so users discover it */}
            <ChatPanel datasetId={id} />
          </>
        )}
      </div>
    </main>
  );
}
