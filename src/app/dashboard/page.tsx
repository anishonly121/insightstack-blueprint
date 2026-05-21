"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
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
  PARSED:   { label: "Parsed",   className: "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200" },
  UPLOADED: { label: "Uploaded", className: "bg-amber-100 text-amber-700 ring-1 ring-amber-200" },
  FAILED:   { label: "Failed",   className: "bg-red-100 text-red-700 ring-1 ring-red-200" },
};

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-4 px-6 py-16 text-center">
      {/* SVG illustration */}
      <svg
        className="h-16 w-16 text-slate-300"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 64 64"
        strokeWidth={1.2}
      >
        <rect x="8" y="12" width="48" height="40" rx="4" strokeDasharray="4 3" />
        <path strokeLinecap="round" d="M22 24h20M22 32h12" />
        <circle cx="44" cy="44" r="8" fill="white" stroke="currentColor" />
        <path strokeLinecap="round" d="M44 41v6M41 44h6" />
      </svg>
      <div>
        <p className="text-base font-semibold text-slate-700">No datasets yet</p>
        <p className="mt-1 max-w-xs text-sm text-slate-400">
          Create a dataset above, upload a CSV, then click{" "}
          <span className="font-medium text-indigo-600">AI Insights</span> to analyse your spending.
        </p>
      </div>
      <div className="mt-1 flex flex-wrap justify-center gap-2 text-xs text-slate-400">
        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1">
          date · description · category · amount
        </span>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1">
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
  const [meta, setMeta] = useState<PaginatedMeta>({
    page: 1,
    pageSize: 8,
    total: 0,
    totalPages: 1,
  });
  const [name, setName] = useState("");
  const [pageError, setPageError] = useState("");
  const [createLoading, setCreateLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [fileByDataset, setFileByDataset] = useState<Record<string, File | null>>({});
  const [actions, setActions] = useState<Record<string, ActionState>>({});
  const renameInputRef = useRef<HTMLInputElement | null>(null);

  const hasDatasets = useMemo(() => datasets.length > 0, [datasets.length]);

  const setAction = (datasetId: string, patch: Partial<ActionState>) => {
    setActions((prev) => {
      const defaults: ActionState = {
        uploadLoading: false,
        insightLoading: false,
        deleteLoading: false,
        renaming: false,
        renameValue: "",
        error: "",
      };
      return {
        ...prev,
        [datasetId]: { ...defaults, ...prev[datasetId], ...patch },
      };
    });
  };

  const loadDatasets = async (page = 1) => {
    setPageError("");
    try {
      const res = await api.listDatasets({
        page,
        pageSize: meta.pageSize,
        sort: "createdAt",
        order: "desc",
      });
      setDatasets(res.data);
      setMeta(res.meta);
    } catch (err) {
      setPageError(err instanceof Error ? err.message : "Failed to load dashboard");
    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
      return;
    }
    void (async () => {
      try {
        const meRes = await api.me();
        setUser(meRes.user);
      } catch {
        // non-fatal
      }
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
    if (!file) {
      setAction(datasetId, { error: "Select a CSV file first" });
      return;
    }
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

  const onDeleteDataset = async (datasetId: string, datasetName: string) => {
    if (!window.confirm(`Delete "${datasetName}"? This cannot be undone.`)) return;
    setAction(datasetId, { deleteLoading: true, error: "" });
    try {
      await api.deleteDataset(datasetId);
      await loadDatasets(
        Math.min(meta.page, Math.ceil((meta.total - 1) / meta.pageSize) || 1),
      );
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
    if (!newName) {
      setAction(datasetId, { renaming: false });
      return;
    }
    try {
      await api.renameDataset(datasetId, newName);
      setDatasets((prev) =>
        prev.map((d) => (d.id === datasetId ? { ...d, name: newName } : d)),
      );
    } catch (err) {
      setAction(datasetId, { error: err instanceof Error ? err.message : "Rename failed" });
    } finally {
      setAction(datasetId, { renaming: false });
    }
  };

  const onLogout = async () => {
    try {
      await api.logout();
    } catch {
      // best-effort
    } finally {
      clearToken();
      router.replace("/login");
    }
  };

  const parsedCount = datasets.filter((d) => d.status === "PARSED").length;
  const failedCount = datasets.filter((d) => d.status === "FAILED").length;
  const totalRows = datasets.reduce((s, d) => s + d.rowCount, 0);

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-50 px-4 py-8 text-slate-900 sm:px-6">
      <div className="mx-auto max-w-5xl">

        {/* ── Header ───────────────────────────────────────────────────────── */}
        <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <Link href="/" className="text-xs font-extrabold uppercase tracking-[0.15em] text-indigo-600 hover:text-indigo-700 transition">
              InsightStack
            </Link>
            <h1 className="mt-0.5 text-2xl font-bold text-slate-900">
              {user ? `Welcome back, ${user.name.split(" ")[0]}` : "Dashboard"}
            </h1>
            {user && (
              <p className="text-sm text-slate-400">{user.email}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {user?.role === "ADMIN" && (
              <Link
                href="/admin"
                className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100"
              >
                Admin Panel
              </Link>
            )}
            <button
              type="button"
              onClick={() => void onLogout()}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-slate-900"
            >
              Logout
            </button>
          </div>
        </header>

        {/* ── Stats summary ────────────────────────────────────────────────── */}
        {!pageLoading && (
          <section className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Total Datasets", value: meta.total, sub: "in your account" },
              { label: "Parsed",         value: parsedCount, highlight: "text-emerald-600", sub: "ready for insights" },
              { label: "Total Rows",     value: totalRows.toLocaleString(), sub: "transactions loaded" },
              { label: "Failed",         value: failedCount, highlight: failedCount > 0 ? "text-red-600" : "text-slate-400", sub: "upload errors" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  {stat.label}
                </p>
                <p className={`mt-1 text-2xl font-bold ${stat.highlight ?? "text-slate-900"}`}>
                  {stat.value}
                </p>
                <p className="mt-0.5 text-xs text-slate-400">{stat.sub}</p>
              </div>
            ))}
          </section>
        )}

        {/* ── Create dataset ───────────────────────────────────────────────── */}
        <section className="mb-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">
              New Dataset
            </h2>
            <span className="text-xs text-slate-400">Give your spending period a name</span>
          </div>
          <form onSubmit={onCreateDataset} className="flex flex-col gap-2 sm:flex-row">
            <input
              className="flex-1 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm transition focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
              placeholder="e.g. January 2026 Expenses"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <button
              type="submit"
              disabled={createLoading}
              className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-50"
            >
              {createLoading ? "Creating..." : "+ Create"}
            </button>
          </form>
        </section>

        {pageError && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {pageError}
          </div>
        )}

        {/* ── Datasets list ────────────────────────────────────────────────── */}
        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <h2 className="font-semibold text-slate-900">Your Datasets</h2>
            {hasDatasets && (
              <span className="text-xs text-slate-400">{meta.total} total</span>
            )}
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
              <div className="divide-y divide-slate-100">
                {datasets.map((dataset) => {
                  const state: ActionState = actions[dataset.id] ?? {
                    uploadLoading: false,
                    insightLoading: false,
                    deleteLoading: false,
                    renaming: false,
                    renameValue: "",
                    error: "",
                  };

                  const statusCfg =
                    STATUS_CONFIG[dataset.status] ?? {
                      label: dataset.status,
                      className: "bg-slate-100 text-slate-600 ring-1 ring-slate-200",
                    };

                  const selectedFile = fileByDataset[dataset.id];

                  return (
                    <article
                      key={dataset.id}
                      className="group p-5 transition-colors hover:bg-slate-50/60"
                    >
                      {/* Top row */}
                      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          {state.renaming ? (
                            <form
                              onSubmit={(e) => {
                                e.preventDefault();
                                void onRenameSubmit(dataset.id);
                              }}
                              className="flex items-center gap-2"
                            >
                              <input
                                ref={renameInputRef}
                                className="rounded-lg border border-indigo-300 bg-indigo-50 px-2.5 py-1.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-200"
                                value={state.renameValue}
                                onChange={(e) =>
                                  setAction(dataset.id, { renameValue: e.target.value })
                                }
                                autoFocus
                              />
                              <button
                                type="submit"
                                className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                onClick={() => setAction(dataset.id, { renaming: false })}
                                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                              >
                                Cancel
                              </button>
                            </form>
                          ) : (
                            <div className="flex items-center gap-2">
                              <h3 className="truncate font-semibold text-slate-900">
                                {dataset.name}
                              </h3>
                              <button
                                type="button"
                                onClick={() => onStartRename(dataset.id, dataset.name)}
                                className="shrink-0 rounded p-0.5 text-slate-300 opacity-0 transition hover:text-indigo-600 group-hover:opacity-100"
                                title="Rename"
                              >
                                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                                </svg>
                              </button>
                            </div>
                          )}
                          <div className="mt-1.5 flex flex-wrap items-center gap-2">
                            <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusCfg.className}`}>
                              {statusCfg.label}
                            </span>
                            <span className="text-xs text-slate-400">
                              {dataset.rowCount.toLocaleString()} rows
                            </span>
                            {dataset.originalFilename && (
                              <span className="max-w-[200px] truncate text-xs text-slate-400">
                                {dataset.originalFilename}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-2">
                          <Link
                            href={`/dashboard/datasets/${dataset.id}`}
                            className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
                          >
                            Open →
                          </Link>
                          <button
                            type="button"
                            onClick={() => void onDeleteDataset(dataset.id, dataset.name)}
                            disabled={state.deleteLoading}
                            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                            title="Delete dataset"
                          >
                            {state.deleteLoading ? "..." : "Delete"}
                          </button>
                        </div>
                      </div>

                      {/* Actions row */}
                      <div className="flex flex-wrap items-center gap-2">
                        <label className="flex flex-1 min-w-[200px] cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600 transition hover:bg-white hover:border-slate-300">
                          <svg className="h-4 w-4 shrink-0 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
                          </svg>
                          <span className="truncate text-xs">
                            {selectedFile ? selectedFile.name : "Choose CSV file…"}
                          </span>
                          <input
                            type="file"
                            accept=".csv,text/csv"
                            onChange={(e) =>
                              setFileByDataset((prev) => ({
                                ...prev,
                                [dataset.id]: e.target.files?.[0] ?? null,
                              }))
                            }
                            className="sr-only"
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => void onUpload(dataset.id)}
                          disabled={state.uploadLoading || !selectedFile}
                          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {state.uploadLoading ? "Uploading…" : "Upload CSV"}
                        </button>
                        <button
                          type="button"
                          onClick={() => void onGenerateInsights(dataset.id)}
                          disabled={state.insightLoading || dataset.status !== "PARSED"}
                          className="rounded-lg bg-violet-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-40"
                          title={dataset.status !== "PARSED" ? "Upload a CSV first" : undefined}
                        >
                          {state.insightLoading ? "Generating…" : "✦ AI Insights"}
                        </button>
                      </div>

                      {state.error && (
                        <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600">
                          {state.error}
                        </p>
                      )}
                    </article>
                  );
                })}
              </div>

              {/* Pagination */}
              {meta.totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 text-sm text-slate-500">
                  <p>
                    Page {meta.page} of {meta.totalPages} &middot; {meta.total} total
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={meta.page <= 1}
                      onClick={() => void loadDatasets(meta.page - 1)}
                      className="rounded-lg border border-slate-200 px-3 py-1.5 font-medium transition hover:bg-slate-50 disabled:opacity-40"
                    >
                      ← Prev
                    </button>
                    <button
                      type="button"
                      disabled={meta.page >= meta.totalPages}
                      onClick={() => void loadDatasets(meta.page + 1)}
                      className="rounded-lg border border-slate-200 px-3 py-1.5 font-medium transition hover:bg-slate-50 disabled:opacity-40"
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
    </main>
  );
}
