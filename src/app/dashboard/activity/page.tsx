"use client";

import { useEffect, useState, useCallback, useMemo } from "react";

// Captured once at module load — relative timestamps are stable for page lifetime
const PAGE_LOAD_MS = Date.now();
import Link from "next/link";
import { api, type AuditActivity, type PaginatedMeta } from "@/lib/api";
import { LogoMark } from "@/components/LogoMark";

const ACTION_META: Record<string, { label: string; color: string; icon: string }> = {
  INSIGHTS_GENERATE:  { label: "Generated AI insights",   color: "text-cyan-400",    icon: "✦" },
  DATASET_UPLOAD:     { label: "Uploaded CSV",             color: "text-emerald-400", icon: "↑" },
  DATASET_CREATE:     { label: "Created dataset",          color: "text-blue-400",    icon: "+" },
  DATASET_DELETE:     { label: "Deleted dataset",          color: "text-red-400",     icon: "×" },
  DATASET_RENAME:     { label: "Renamed dataset",          color: "text-violet-400",  icon: "✎" },
  USER_REGISTER:      { label: "Created account",          color: "text-blue-400",    icon: "★" },
  USER_LOGIN:         { label: "Signed in",                color: "text-zinc-400",    icon: "→" },
  PASSWORD_CHANGED:   { label: "Changed password",         color: "text-amber-400",   icon: "🔑" },
  FORGOT_PASSWORD:    { label: "Requested password reset", color: "text-zinc-400",    icon: "?" },
  RESET_PASSWORD:     { label: "Reset password",           color: "text-amber-400",   icon: "↺" },
};

function getActionMeta(action: string) {
  return ACTION_META[action] ?? { label: action, color: "text-zinc-400", icon: "·" };
}

function RelativeTime({ iso }: { iso: string }) {
  const { rel, full } = useMemo(() => {
    const date = new Date(iso);
    const diff = PAGE_LOAD_MS - date.getTime();
    const mins = Math.floor(diff / 60_000);
    const hours = Math.floor(diff / 3_600_000);
    const days = Math.floor(diff / 86_400_000);
    let r: string;
    if (mins < 1) r = "just now";
    else if (mins < 60) r = `${mins}m ago`;
    else if (hours < 24) r = `${hours}h ago`;
    else if (days < 7) r = `${days}d ago`;
    else r = date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    return { rel: r, full: date.toLocaleString() };
  }, [iso]);

  return (
    <time dateTime={iso} title={full} className="text-xs text-zinc-600 tabular-nums">
      {rel}
    </time>
  );
}

export default function ActivityPage() {
  const [logs, setLogs] = useState<AuditActivity[]>([]);
  const [meta, setMeta] = useState<PaginatedMeta>({ total: 0, page: 1, pageSize: 25, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");

  const fetchPage = useCallback(async (page: number, append = false) => {
    try {
      const res = await api.listActivity(page, 25);
      setLogs((prev) => append ? [...prev, ...res.data] : res.data);
      setMeta(res.meta);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load activity");
    }
  }, []);

  useEffect(() => {
    void (async () => {
      await fetchPage(1);
      setLoading(false);
    })();
  }, [fetchPage]);

  const loadMore = async () => {
    setLoadingMore(true);
    await fetchPage(meta.page + 1, true);
    setLoadingMore(false);
  };

  const hasMore = meta.page < meta.totalPages;

  return (
    <main className="min-h-screen bg-[#050B18] px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-2xl">

        {/* Header */}
        <header className="mb-8 flex items-center justify-between">
          <div>
            <Link href="/dashboard" className="mb-2 flex items-center gap-1.5 w-fit">
              <LogoMark size={20} />
              <span className="text-xs font-bold tracking-tight text-zinc-400 transition hover:text-white">
                Insight<span className="text-blue-400">Stack</span>
              </span>
            </Link>
            <h1 className="text-2xl font-black text-white">Activity log</h1>
            {!loading && (
              <p className="mt-0.5 text-sm text-zinc-500">{meta.total} total events</p>
            )}
          </div>
          <Link
            href="/dashboard"
            className="rounded-lg border border-white/8 bg-zinc-900 px-3 py-2 text-sm font-medium text-zinc-400 transition hover:text-white"
          >
            ← Dashboard
          </Link>
        </header>

        {error && (
          <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-14 animate-shimmer rounded-xl" />
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className="rounded-2xl border border-white/6 bg-zinc-900 px-6 py-12 text-center">
            <p className="text-zinc-500">No activity yet. Upload a CSV to get started.</p>
          </div>
        ) : (
          <>
            <div className="rounded-2xl border border-white/6 bg-zinc-900 divide-y divide-white/[0.04]">
              {logs.map((log) => {
                const { label, color, icon } = getActionMeta(log.action);
                return (
                  <div key={log.id} className="flex items-center gap-4 px-5 py-3.5">
                    <span className={`w-5 shrink-0 text-center text-base font-black ${color}`}>
                      {icon}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-semibold ${color}`}>{label}</p>
                      {log.entityId && (
                        <p className="truncate text-xs text-zinc-600 font-mono">{log.entityId}</p>
                      )}
                    </div>
                    <RelativeTime iso={log.createdAt} />
                  </div>
                );
              })}
            </div>

            {hasMore && (
              <div className="mt-4 text-center">
                <button
                  onClick={() => void loadMore()}
                  disabled={loadingMore}
                  className="rounded-xl border border-white/8 bg-zinc-900 px-6 py-2.5 text-sm font-medium text-zinc-400 transition hover:text-white disabled:opacity-50"
                >
                  {loadingMore ? "Loading…" : `Load more (${meta.total - logs.length} remaining)`}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
