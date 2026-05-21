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

const STATUS_STYLES: Record<string, string> = {
  PARSED: "bg-emerald-100 text-emerald-700",
  UPLOADED: "bg-amber-100 text-amber-700",
  FAILED: "bg-red-100 text-red-700",
};

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

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 text-slate-900 sm:px-6">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <header className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-indigo-600">
              InsightStack
            </p>
            <h1 className="text-2xl font-bold text-slate-900">
              {user ? `Welcome back, ${user.name.split(" ")[0]}` : "Dashboard"}
            </h1>
            {user && (
              <p className="text-sm text-slate-500">{user.email}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {user?.role === "ADMIN" && (
              <Link
                href="/admin"
                className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-100"
              >
                Admin
              </Link>
            )}
            <button
              type="button"
              onClick={() => void onLogout()}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Logout
            </button>
          </div>
        </header>

        {/* Stats summary */}
        {!pageLoading && (
          <section className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Total Datasets", value: meta.total },
              {
                label: "Parsed",
                value: datasets.filter((d) => d.status === "PARSED").length,
                highlight: "text-emerald-600",
              },
              {
                label: "Total Rows",
                value: datasets.reduce((s, d) => s + d.rowCount, 0).toLocaleString(),
              },
              {
                label: "Failed",
                value: datasets.filter((d) => d.status === "FAILED").length,
                highlight: "text-red-600",
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  {stat.label}
                </p>
                <p className={`mt-1 text-2xl font-bold ${stat.highlight ?? "text-slate-900"}`}>
                  {stat.value}
                </p>
              </div>
            ))}
          </section>
        )}

        {/* Create dataset */}
        <section className="mb-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
            New Dataset
          </h2>
          <form onSubmit={onCreateDataset} className="flex flex-col gap-2 sm:flex-row">
            <input
              className="flex-1 rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              placeholder="e.g. January 2026 Expenses"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <button
              type="submit"
              disabled={createLoading}
              className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
            >
              {createLoading ? "Creating..." : "+ Create"}
            </button>
          </form>
        </section>

        {pageError && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {pageError}
          </div>
        )}

        {/* Datasets list */}
        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="font-semibold text-slate-900">Your Datasets</h2>
          </div>

          {pageLoading ? (
            <div className="space-y-3 p-5">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-28 animate-pulse rounded-lg bg-slate-100" />
              ))}
            </div>
          ) : !hasDatasets ? (
            <div className="flex flex-col items-center gap-2 p-12 text-center">
              <div className="text-4xl">📂</div>
              <p className="font-medium text-slate-700">No datasets yet</p>
              <p className="text-sm text-slate-500">
                Create one above, upload a CSV, then generate AI insights.
              </p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-slate-100">
                {datasets.map((dataset) => {
                  const state = actions[dataset.id] ?? {
                    uploadLoading: false,
                    insightLoading: false,
                    deleteLoading: false,
                    renaming: false,
                    renameValue: "",
                    error: "",
                  };

                  return (
                    <article key={dataset.id} className="p-5">
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
                                className="rounded-md border border-indigo-300 px-2 py-1 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-200"
                                value={state.renameValue}
                                onChange={(e) =>
                                  setAction(dataset.id, { renameValue: e.target.value })
                                }
                                autoFocus
                              />
                              <button
                                type="submit"
                                className="rounded-md bg-indigo-600 px-3 py-1 text-xs font-semibold text-white hover:bg-indigo-700"
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                onClick={() => setAction(dataset.id, { renaming: false })}
                                className="rounded-md border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50"
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
                                className="shrink-0 text-xs text-slate-400 hover:text-indigo-600"
                                title="Rename"
                              >
                                ✏️
                              </button>
                            </div>
                          )}
                          <div className="mt-1 flex flex-wrap items-center gap-2">
                            <span
                              className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_STYLES[dataset.status] ?? "bg-slate-100 text-slate-600"}`}
                            >
                              {dataset.status}
                            </span>
                            <span className="text-xs text-slate-400">
                              {dataset.rowCount.toLocaleString()} rows
                            </span>
                            {dataset.originalFilename && (
                              <span className="truncate text-xs text-slate-400">
                                {dataset.originalFilename}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-2">
                          <Link
                            href={`/dashboard/datasets/${dataset.id}`}
                            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                          >
                            Open →
                          </Link>
                          <button
                            type="button"
                            onClick={() => void onDeleteDataset(dataset.id, dataset.name)}
                            disabled={state.deleteLoading}
                            className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                            title="Delete dataset"
                          >
                            {state.deleteLoading ? "..." : "Delete"}
                          </button>
                        </div>
                      </div>

                      {/* Actions row */}
                      <div className="flex flex-wrap items-center gap-2">
                        <label className="flex-1 min-w-[200px]">
                          <input
                            type="file"
                            accept=".csv,text/csv"
                            onChange={(e) =>
                              setFileByDataset((prev) => ({
                                ...prev,
                                [dataset.id]: e.target.files?.[0] ?? null,
                              }))
                            }
                            className="w-full text-sm text-slate-600 file:mr-3 file:rounded-md file:border file:border-slate-300 file:bg-white file:px-2 file:py-1 file:text-xs file:font-medium file:text-slate-700"
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => void onUpload(dataset.id)}
                          disabled={state.uploadLoading}
                          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                        >
                          {state.uploadLoading ? "Uploading..." : "Upload CSV"}
                        </button>
                        <button
                          type="button"
                          onClick={() => void onGenerateInsights(dataset.id)}
                          disabled={state.insightLoading || dataset.status !== "PARSED"}
                          className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
                          title={dataset.status !== "PARSED" ? "Upload a CSV first" : undefined}
                        >
                          {state.insightLoading ? "Generating..." : "AI Insights"}
                        </button>
                      </div>

                      {state.error && (
                        <p className="mt-2 text-sm text-red-600">{state.error}</p>
                      )}
                    </article>
                  );
                })}
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 text-sm text-slate-500">
                <p>
                  Page {meta.page} of {meta.totalPages} &middot; {meta.total} total
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={meta.page <= 1}
                    onClick={() => void loadDatasets(meta.page - 1)}
                    className="rounded-lg border border-slate-300 px-3 py-1.5 font-medium disabled:opacity-40"
                  >
                    ← Prev
                  </button>
                  <button
                    type="button"
                    disabled={meta.page >= meta.totalPages}
                    onClick={() => void loadDatasets(meta.page + 1)}
                    className="rounded-lg border border-slate-300 px-3 py-1.5 font-medium disabled:opacity-40"
                  >
                    Next →
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
