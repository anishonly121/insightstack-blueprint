"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getToken } from "@/lib/api";

type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: "USER" | "ADMIN";
  createdAt: string;
};

type AdminDataset = {
  id: string;
  name: string;
  status: string;
  rowCount: number;
  originalFilename: string | null;
  createdAt: string;
  user: { id: string; email: string; name: string };
};

type MeResponse = {
  user: { id: string; name: string; email: string; role: "USER" | "ADMIN" };
};

type ApiError = { error?: { message?: string } };

async function authedFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  if (!token) throw new Error("Missing auth token. Please login.");
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);
  const res = await fetch(path, { ...init, headers });
  const body = (await res.json().catch(() => null)) as (T & ApiError) | null;
  if (!res.ok) throw new Error(body?.error?.message ?? "Request failed");
  return body as T;
}

const STATUS_CONFIG: Record<string, { className: string }> = {
  PARSED:   { className: "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200" },
  UPLOADED: { className: "bg-amber-100 text-amber-700 ring-1 ring-amber-200" },
  FAILED:   { className: "bg-red-100 text-red-700 ring-1 ring-red-200" },
};

function Spinner() {
  return (
    <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
  );
}

export default function AdminPage() {
  const [checkingRole, setCheckingRole] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [datasets, setDatasets] = useState<AdminDataset[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"users" | "datasets">("users");

  const loadAdminData = async () => {
    setLoading(true);
    setError("");
    try {
      const [usersRes, datasetsRes] = await Promise.all([
        authedFetch<{ data: AdminUser[] }>("/api/admin/users"),
        authedFetch<{ data: AdminDataset[] }>("/api/admin/datasets"),
      ]);
      setUsers(usersRes.data);
      setDatasets(datasetsRes.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load admin data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const run = async () => {
      setCheckingRole(true);
      try {
        const me = await authedFetch<MeResponse>("/api/auth/me");
        if (me.user.role !== "ADMIN") { setIsAdmin(false); return; }
        setIsAdmin(true);
        await loadAdminData();
      } catch (err) {
        setIsAdmin(false);
        setError(err instanceof Error ? err.message : "Failed to verify admin access");
      } finally {
        setCheckingRole(false);
      }
    };
    void run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onDeleteDataset = async (id: string, name: string) => {
    if (!window.confirm(`Delete dataset "${name}"? This cannot be undone.`)) return;
    setError("");
    try {
      await authedFetch<{ data: { id: string } }>(`/api/admin/datasets/${id}`, {
        method: "DELETE",
      });
      setDatasets((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete dataset");
    }
  };

  if (checkingRole) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-100 to-slate-50">
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-sm text-slate-500">
          <Spinner />
          <span className="text-sm font-medium">Verifying admin access…</span>
        </div>
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-100 to-slate-50 px-6">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
            <svg
              className="h-7 w-7 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
              />
            </svg>
          </div>
          <h1 className="mb-2 text-xl font-bold text-slate-900">Access denied</h1>
          <p className="mb-6 text-sm text-slate-500">
            You need <span className="font-semibold text-indigo-600">ADMIN</span> role to view this page.
          </p>
          <Link
            href="/dashboard"
            className="inline-block rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
          >
            Back to Dashboard
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-50 px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-6xl">

        {/* Header */}
        <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <Link
              href="/dashboard"
              className="text-xs font-extrabold uppercase tracking-[0.15em] text-indigo-600 transition hover:text-indigo-700"
            >
              ← Dashboard
            </Link>
            <h1 className="mt-0.5 text-2xl font-bold text-slate-900">Admin Panel</h1>
            <p className="text-sm text-slate-400">
              {users.length} user{users.length !== 1 ? "s" : ""} &middot;{" "}
              {datasets.length} dataset{datasets.length !== 1 ? "s" : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={() => void loadAdminData()}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
          >
            {loading ? <Spinner /> : (
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            )}
            {loading ? "Refreshing…" : "Refresh"}
          </button>
        </header>

        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        {/* Stats */}
        <section className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Total Users", value: users.length, accent: "bg-slate-400" },
            {
              label: "Admin Users",
              value: users.filter((u) => u.role === "ADMIN").length,
              highlight: "text-indigo-600",
              accent: "bg-indigo-500",
            },
            { label: "Total Datasets", value: datasets.length, accent: "bg-violet-400" },
            {
              label: "Parsed",
              value: datasets.filter((d) => d.status === "PARSED").length,
              highlight: "text-emerald-600",
              accent: "bg-emerald-500",
            },
          ].map((s) => (
            <div
              key={s.label}
              className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className={`absolute left-0 top-0 h-full w-1 rounded-l-xl ${s.accent}`} />
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                {s.label}
              </p>
              <p className={`mt-1 text-2xl font-bold ${s.highlight ?? "text-slate-900"}`}>
                {s.value}
              </p>
            </div>
          ))}
        </section>

        {/* Tabs */}
        <div className="mb-4 flex w-fit gap-1 rounded-xl bg-slate-200 p-1">
          {(["users", "datasets"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`rounded-lg px-5 py-2 text-sm font-semibold capitalize transition ${
                activeTab === tab
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {tab}{" "}
              <span className="ml-1 text-xs opacity-60">
                ({tab === "users" ? users.length : datasets.length})
              </span>
            </button>
          ))}
        </div>

        {/* Users table */}
        {activeTab === "users" && (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="font-semibold text-slate-900">Users</h2>
            </div>
            {users.length === 0 ? (
              <p className="p-8 text-center text-sm text-slate-400">No users found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                      <th className="px-5 py-3">Name</th>
                      <th className="px-5 py-3">Email</th>
                      <th className="px-5 py-3">Role</th>
                      <th className="px-5 py-3">Joined</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {users.map((user) => (
                      <tr key={user.id} className="transition hover:bg-slate-50">
                        <td className="px-5 py-3 font-semibold text-slate-900">{user.name}</td>
                        <td className="px-5 py-3 text-slate-500">{user.email}</td>
                        <td className="px-5 py-3">
                          <span
                            className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${
                              user.role === "ADMIN"
                                ? "bg-indigo-50 text-indigo-700 ring-indigo-200"
                                : "bg-slate-100 text-slate-600 ring-slate-200"
                            }`}
                          >
                            {user.role}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-slate-400">
                          {new Date(user.createdAt).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Datasets table */}
        {activeTab === "datasets" && (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="font-semibold text-slate-900">All Datasets</h2>
            </div>
            {datasets.length === 0 ? (
              <p className="p-8 text-center text-sm text-slate-400">No datasets found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                      <th className="px-5 py-3">Name</th>
                      <th className="px-5 py-3">Owner</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3">Rows</th>
                      <th className="px-5 py-3">Created</th>
                      <th className="px-5 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {datasets.map((dataset) => {
                      const statusCfg =
                        STATUS_CONFIG[dataset.status] ?? {
                          className: "bg-slate-100 text-slate-600 ring-1 ring-slate-200",
                        };
                      return (
                        <tr key={dataset.id} className="transition hover:bg-slate-50">
                          <td className="px-5 py-3 font-semibold text-slate-900">{dataset.name}</td>
                          <td className="px-5 py-3 text-slate-500">{dataset.user.email}</td>
                          <td className="px-5 py-3">
                            <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusCfg.className}`}>
                              {dataset.status}
                            </span>
                          </td>
                          <td className="px-5 py-3 tabular-nums text-slate-500">
                            {dataset.rowCount.toLocaleString()}
                          </td>
                          <td className="px-5 py-3 text-slate-400">
                            {new Date(dataset.createdAt).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </td>
                          <td className="px-5 py-3">
                            <button
                              type="button"
                              onClick={() => void onDeleteDataset(dataset.id, dataset.name)}
                              className="rounded-lg border border-red-200 px-2.5 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-50 hover:border-red-300"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
