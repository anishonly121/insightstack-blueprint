"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { LogoMark } from "@/components/LogoMark";
import { useRouter } from "next/navigation";
import {
  api,
  clearToken,
  getToken,
  type AuthUser,
  type Dataset,
  type PaginatedMeta,
} from "@/lib/api";

type ActionState = {
  uploadLoading: boolean;
  insightLoading: boolean;
  deleteLoading: boolean;
  renaming: boolean;
  renameValue: string;
  error: string;
};

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  PARSED:   { label: "Parsed",   className: "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20" },
  UPLOADED: { label: "Uploaded", className: "bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/20" },
  FAILED:   { label: "Failed",   className: "bg-red-500/10 text-red-400 ring-1 ring-red-500/20" },
};

function DeleteModal({ name, onConfirm, onCancel }: { name: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onCancel}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-sm rounded-2xl border border-white/[0.08] bg-[#0A1628] p-6 shadow-[0_32px_80px_rgba(0,0,0,0.7)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/10 ring-1 ring-red-500/20">
          <svg className="h-6 w-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
          </svg>
        </div>
        <h2 className="mb-1 text-base font-bold text-white">Delete dataset?</h2>
        <p className="mb-6 text-sm text-zinc-500">
          <span className="font-semibold text-zinc-300">&ldquo;{name}&rdquo;</span> and all its transactions and insights will be permanently deleted. This cannot be undone.
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-xl border border-white/[0.08] py-2.5 text-sm font-semibold text-zinc-400 transition hover:border-white/[0.15] hover:text-white"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 rounded-xl bg-red-500 py-2.5 text-sm font-semibold text-white shadow-[0_0_20px_rgba(239,68,68,0.3)] transition hover:bg-red-400"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-5 px-6 py-20 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/8 bg-zinc-800">
        <svg className="h-8 w-8 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 64 64" strokeWidth={1.2}>
          <rect x="8" y="12" width="48" height="40" rx="4" strokeDasharray="4 3" />
          <path strokeLinecap="round" d="M22 24h20M22 32h12" />
          <circle cx="44" cy="44" r="8" fill="transparent" stroke="currentColor" />
          <path strokeLinecap="round" d="M44 41v6M41 44h6" />
        </svg>
      </div>
      <div>
        <p className="text-base font-bold text-zinc-100">No datasets yet</p>
        <p className="mt-1.5 max-w-xs text-sm text-zinc-600">
          Create a dataset above, upload a CSV, then click{" "}
          <span className="font-semibold text-blue-400">AI Insights</span> to analyse your spending.
        </p>
      </div>
      <div className="mt-1 flex flex-wrap justify-center gap-2 text-xs text-zinc-600">
        <span className="rounded-full border border-white/8 bg-zinc-800 px-3 py-1">
          date · description · category · amount
        </span>
        <span className="rounded-full border border-white/8 bg-zinc-800 px-3 py-1">
          CSV format
        </span>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [meta, setMeta] = useState<PaginatedMeta>({ page: 1, pageSize: 8, total: 0, totalPages: 1 });
  const [name, setName] = useState("");
  const [pageError, setPageError] = useState("");
  const [createLoading, setCreateLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [fileByDataset, setFileByDataset] = useState<Record<string, File | null>>({});
  const [actions, setActions] = useState<Record<string, ActionState>>({});
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);
  const renameInputRef = useRef<HTMLInputElement | null>(null);

  const hasDatasets = useMemo(() => datasets.length > 0, [datasets.length]);

  const setAction = (datasetId: string, patch: Partial<ActionState>) => {
    setActions((prev) => {
      const defaults: ActionState = {
        uploadLoading: false, insightLoading: false, deleteLoading: false,
        renaming: false, renameValue: "", error: "",
      };
      return { ...prev, [datasetId]: { ...defaults, ...prev[datasetId], ...patch } };
    });
  };

  const loadDatasets = async (page = 1) => {
    setPageError("");
    try {
      const res = await api.listDatasets({ page, pageSize: meta.pageSize, sort: "createdAt", order: "desc" });
      setDatasets(res.data);
      setMeta(res.meta);
    } catch (err) {
      setPageError(err instanceof Error ? err.message : "Failed to load dashboard");
    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => {
    if (!getToken()) { router.replace("/login"); return; }
    void (async () => {
      try { const meRes = await api.me(); setUser(meRes.user); } catch {}
      await loadDatasets(1);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const onCreateDataset = async (e: FormEvent) => {
    e.preventDefault();
    setPageError("");
    setCreateLoading(true);
    try {
      await api.createDataset({ name });
      setName("");
      await loadDatasets(1);
    } catch (err) {
      setPageError(err instanceof Error ? err.message : "Failed to create dataset");
    } finally {
      setCreateLoading(false);
    }
  };

  const onUpload = async (datasetId: string) => {
    const file = fileByDataset[datasetId];
    if (!file) { setAction(datasetId, { error: "Select a CSV file first" }); return; }
    setAction(datasetId, { uploadLoading: true, error: "" });
    try {
      await api.uploadDatasetCsv(datasetId, file);
      setFileByDataset((prev) => ({ ...prev, [datasetId]: null }));
      await loadDatasets(meta.page);
    } catch (err) {
      setAction(datasetId, { error: err instanceof Error ? err.message : "Upload failed" });
    } finally {
      setAction(datasetId, { uploadLoading: false });
    }
  };

  const onGenerateInsights = async (datasetId: string) => {
    setAction(datasetId, { insightLoading: true, error: "" });
    try {
      await api.generateInsights(datasetId);
      await loadDatasets(meta.page);
    } catch (err) {
      setAction(datasetId, { error: err instanceof Error ? err.message : "Insights failed" });
    } finally {
      setAction(datasetId, { insightLoading: false });
    }
  };

  const onDeleteDataset = (datasetId: string, datasetName: string) => {
    setDeleteConfirm({ id: datasetId, name: datasetName });
  };

  const onDeleteConfirmed = async () => {
    if (!deleteConfirm) return;
    const { id: datasetId } = deleteConfirm;
    setDeleteConfirm(null);
    setAction(datasetId, { deleteLoading: true, error: "" });
    try {
      await api.deleteDataset(datasetId);
      await loadDatasets(Math.min(meta.page, Math.ceil((meta.total - 1) / meta.pageSize) || 1));
    } catch (err) {
      setAction(datasetId, { error: err instanceof Error ? err.message : "Delete failed" });
    } finally {
      setAction(datasetId, { deleteLoading: false });
    }
  };

  const onStartRename = (datasetId: string, currentName: string) => {
    setAction(datasetId, { renaming: true, renameValue: currentName });
    setTimeout(() => renameInputRef.current?.select(), 50);
  };

  const onRenameSubmit = async (datasetId: string) => {
    const newName = actions[datasetId]?.renameValue?.trim();
    if (!newName) { setAction(datasetId, { renaming: false }); return; }
    try {
      await api.renameDataset(datasetId, newName);
      setDatasets((prev) => prev.map((d) => (d.id === datasetId ? { ...d, name: newName } : d)));
    } catch (err) {
      setAction(datasetId, { error: err instanceof Error ? err.message : "Rename failed" });
    } finally {
      setAction(datasetId, { renaming: false });
    }
  };

  const onLogout = async () => {
    try { await api.logout(); } catch {}
    finally { clearToken(); router.replace("/login"); }
  };

  const parsedCount = datasets.filter((d) => d.status === "PARSED").length;
  const failedCount = datasets.filter((d) => d.status === "FAILED").length;
  const totalRows = datasets.reduce((s, d) => s + d.rowCount, 0);

  return (
    <main className="min-h-screen bg-[#050B18] px-4 py-8 text-white sm:px-6">
      <div className="mx-auto max-w-5xl">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <Link href="/" className="mb-2 flex items-center gap-1.5 w-fit">
              <LogoMark size={20} />
              <span className="text-xs font-bold tracking-tight text-zinc-400 transition hover:text-white">Insight<span className="text-blue-400">Stack</span></span>
            </Link>
            <h1 className="text-2xl font-black text-white">
              {user ? `Welcome back, ${user.name.split(" ")[0]}` : "Dashboard"}
            </h1>
            {user && <p className="text-sm text-zinc-500">{user.email}</p>}
          </div>
          <div className="flex items-center gap-2">
            {user?.role === "ADMIN" && (
              <Link
                href="/admin"
                className="rounded-lg border border-blue-500/20 bg-blue-500/8 px-3 py-2 text-sm font-semibold text-blue-400 transition hover:bg-blue-500/15"
              >
                Admin Panel
              </Link>
            )}
            <button
              type="button"
              onClick={() => void onLogout()}
              className="rounded-lg border border-white/8 bg-zinc-900 px-3 py-2 text-sm font-medium text-zinc-400 shadow-sm transition hover:border-white/15 hover:text-white"
            >
              Logout
            </button>
          </div>
        </header>

        {/* ── Stats ──────────────────────────────────────────────────────── */}
        {!pageLoading && (
          <section className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Total Datasets", value: meta.total, sub: "in your account", color: "text-white" },
              { label: "Parsed",         value: parsedCount, sub: "ready for insights", color: "text-emerald-400" },
              { label: "Total Rows",     value: totalRows.toLocaleString(), sub: "transactions loaded", color: "text-white" },
              { label: "Failed",         value: failedCount, sub: "upload errors", color: failedCount > 0 ? "text-red-400" : "text-zinc-600" },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl border border-white/6 bg-zinc-900 p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-600">{stat.label}</p>
                <p className={`mt-1.5 text-2xl font-black ${stat.color}`}>{stat.value}</p>
                <p className="mt-0.5 text-xs text-zinc-600">{stat.sub}</p>
              </div>
            ))}
          </section>
        )}

        {/* ── Create dataset ─────────────────────────────────────────────── */}
        <section className="mb-5 rounded-xl border border-white/6 bg-zinc-900 p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-500">New Dataset</h2>
            <span className="text-xs text-zinc-700">Give your spending period a name</span>
          </div>
          <form onSubmit={onCreateDataset} className="flex flex-col gap-2 sm:flex-row">
            <input
              className="flex-1 rounded-xl border border-white/8 bg-zinc-800 px-4 py-3 text-sm text-white placeholder-zinc-600 transition focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              placeholder="e.g. January 2026 Expenses"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <button
              type="submit"
              disabled={createLoading}
              className="rounded-xl bg-blue-500 px-6 py-3 text-sm font-black text-white shadow-[0_0_20px_rgba(59,130,246,0.3)] transition hover:bg-blue-400 hover:shadow-[0_0_30px_rgba(59,130,246,0.45)] disabled:opacity-50"
            >
              {createLoading ? "Creating..." : "+ Create"}
            </button>
          </form>
        </section>

        {pageError && (
          <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-400">
            {pageError}
          </div>
        )}

        {/* ── Datasets list ──────────────────────────────────────────────── */}
        <section className="rounded-xl border border-white/6 bg-zinc-900 shadow-sm">
          <div className="flex items-center justify-between border-b border-white/5 px-5 py-4">
            <h2 className="font-bold text-white">Your Datasets</h2>
            {hasDatasets && <span className="text-xs text-zinc-600">{meta.total} total</span>}
          </div>

          {pageLoading ? (
            <div className="space-y-3 p-5">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-28 animate-shimmer rounded-xl" />
              ))}
            </div>
          ) : !hasDatasets ? (
            <EmptyState />
          ) : (
            <>
              <div className="divide-y divide-white/4">
                {datasets.map((dataset) => {
                  const state: ActionState = actions[dataset.id] ?? {
                    uploadLoading: false, insightLoading: false, deleteLoading: false,
                    renaming: false, renameValue: "", error: "",
                  };
                  const statusCfg = STATUS_CONFIG[dataset.status] ?? {
                    label: dataset.status,
                    className: "bg-zinc-800 text-zinc-400 ring-1 ring-zinc-700",
                  };
                  const selectedFile = fileByDataset[dataset.id];

                  return (
                    <article key={dataset.id} className="group p-5 transition-colors hover:bg-white/2">
                      {/* Top row */}
                      <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          {state.renaming ? (
                            <form
                              onSubmit={(e) => { e.preventDefault(); void onRenameSubmit(dataset.id); }}
                              className="flex items-center gap-2"
                            >
                              <input
                                ref={renameInputRef}
                                className="rounded-lg border border-blue-500/30 bg-zinc-800 px-2.5 py-1.5 text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                value={state.renameValue}
                                onChange={(e) => setAction(dataset.id, { renameValue: e.target.value })}
                                autoFocus
                              />
                              <button type="submit" className="rounded-lg bg-blue-500 px-3 py-1.5 text-xs font-black text-white hover:bg-blue-400">
                                Save
                              </button>
                              <button type="button" onClick={() => setAction(dataset.id, { renaming: false })} className="rounded-lg border border-white/8 px-3 py-1.5 text-xs font-semibold text-zinc-400 hover:bg-zinc-800 hover:text-white">
                                Cancel
                              </button>
                            </form>
                          ) : (
                            <div className="flex items-center gap-2">
                              <h3 className="truncate font-bold text-zinc-100">{dataset.name}</h3>
                              <button
                                type="button"
                                onClick={() => onStartRename(dataset.id, dataset.name)}
                                className="shrink-0 rounded p-0.5 text-zinc-700 opacity-0 transition hover:text-blue-400 group-hover:opacity-100"
                                title="Rename"
                              >
                                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                                </svg>
                              </button>
                            </div>
                          )}
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-bold ${statusCfg.className}`}>
                              {statusCfg.label}
                            </span>
                            <span className="text-xs text-zinc-600">{dataset.rowCount.toLocaleString()} rows</span>
                            {dataset.originalFilename && (
                              <span className="max-w-[200px] truncate text-xs text-zinc-600">{dataset.originalFilename}</span>
                            )}
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-2">
                          <Link
                            href={`/dashboard/datasets/${dataset.id}`}
                            className="rounded-lg bg-blue-500 px-3 py-1.5 text-sm font-black text-white shadow-[0_0_15px_rgba(59,130,246,0.25)] transition hover:bg-blue-400 hover:shadow-[0_0_25px_rgba(59,130,246,0.4)]"
                          >
                            Open →
                          </Link>
                          <button
                            type="button"
                            onClick={() => void onDeleteDataset(dataset.id, dataset.name)}
                            disabled={state.deleteLoading}
                            className="rounded-lg border border-white/8 px-3 py-1.5 text-sm font-medium text-zinc-500 transition hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50"
                          >
                            {state.deleteLoading ? "..." : "Delete"}
                          </button>
                        </div>
                      </div>

                      {/* Actions row */}
                      <div className="flex flex-wrap items-center gap-2">
                        <label className="flex flex-1 min-w-[200px] cursor-pointer items-center gap-2 rounded-lg border border-white/6 bg-zinc-800 px-3 py-2.5 text-sm text-zinc-500 transition hover:border-white/12 hover:text-zinc-300">
                          <svg className="h-4 w-4 shrink-0 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
                          </svg>
                          <span className="truncate text-xs">
                            {selectedFile ? selectedFile.name : "Choose CSV file…"}
                          </span>
                          <input
                            type="file"
                            accept=".csv,text/csv"
                            onChange={(e) =>
                              setFileByDataset((prev) => ({ ...prev, [dataset.id]: e.target.files?.[0] ?? null }))
                            }
                            className="sr-only"
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => void onUpload(dataset.id)}
                          disabled={state.uploadLoading || !selectedFile}
                          className="rounded-lg border border-white/8 bg-zinc-800 px-3 py-2.5 text-sm font-medium text-zinc-300 transition hover:border-white/15 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {state.uploadLoading ? "Uploading…" : "Upload CSV"}
                        </button>
                        <button
                          type="button"
                          onClick={() => void onGenerateInsights(dataset.id)}
                          disabled={state.insightLoading || dataset.status !== "PARSED"}
                          className="rounded-lg bg-cyan-500 px-3 py-2.5 text-sm font-black text-white shadow-[0_0_15px_rgba(6,182,212,0.25)] transition hover:bg-cyan-400 hover:shadow-[0_0_25px_rgba(6,182,212,0.4)] disabled:cursor-not-allowed disabled:opacity-40"
                          title={dataset.status !== "PARSED" ? "Upload a CSV first" : undefined}
                        >
                          {state.insightLoading ? "Generating…" : "✦ AI Insights"}
                        </button>
                      </div>

                      {state.error && (
                        <p className="mt-3 rounded-lg bg-red-500/10 px-3 py-2 text-sm font-medium text-red-400 ring-1 ring-red-500/20">
                          {state.error}
                        </p>
                      )}
                    </article>
                  );
                })}
              </div>

              {/* Pagination */}
              {meta.totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-white/5 px-5 py-3 text-sm text-zinc-600">
                  <p>Page {meta.page} of {meta.totalPages} &middot; {meta.total} total</p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={meta.page <= 1}
                      onClick={() => void loadDatasets(meta.page - 1)}
                      className="rounded-lg border border-white/8 px-3 py-1.5 font-medium transition hover:bg-zinc-800 disabled:opacity-40"
                    >
                      ← Prev
                    </button>
                    <button
                      type="button"
                      disabled={meta.page >= meta.totalPages}
                      onClick={() => void loadDatasets(meta.page + 1)}
                      className="rounded-lg border border-white/8 px-3 py-1.5 font-medium transition hover:bg-zinc-800 disabled:opacity-40"
                    >
                      Next →
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      </div>

      {deleteConfirm && (
        <DeleteModal
          name={deleteConfirm.name}
          onConfirm={() => void onDeleteConfirmed()}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </main>
  );
}
