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

const STATUS_STYLES: Record<string, string> = {
  PARSED: "bg-emerald-100 text-emerald-700",
  UPLOADED: "bg-amber-100 text-amber-700",
  FAILED: "bg-red-100 text-red-700",
};

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
      await authedFetch<{ data: { id: string } }>(`/api/admin/datasets/${id}`, { method: "DELETE" });
      setDatasets((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete dataset");
    }
  };

  if (checkingRole) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex items-center gap-3 text-slate-500">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
            Verifying admin access...
          </div>
        </div>
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 px-6">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm text-center">
          <div className="mb-4 text-4xl">🚫</div>
          <h1 className="mb-2 text-xl font-bold text-slate-900">Access denied</h1>
          <p className="mb-6 text-sm text-slate-500">
            You need ADMIN role to view this page.
          </p>
          <Link
            href="/dashboard"
            className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
          >
            Back to Dashboard
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-indigo-600">
              InsightStack
            </p>
            <h1 className="text-2xl font-bold text-slate-900">Admin Panel</h1>
            <p className="text-sm text-slate-500">
              {users.length} users · {datasets.length} datasets
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void loadAdminData()}
              disabled={loading}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              {loading ? "Refreshing..." : "↻ Refresh"}
            </button>
            <Link
              href="/dashboard"
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              ← Dashboard
            </Link>
          </div>
        </div>

        {error && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Stats */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Total Users", value: users.length },
            { label: "Admin Users", value: users.filter((u) => u.role === "ADMIN").length, highlight: "text-indigo-600" },
            { label: "Total Datasets", value: datasets.length },
            { label: "Parsed", value: datasets.filter((d) => d.status === "PARSED").length, highlight: "text-emerald-600" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{s.label}</p>
              <p className={`mt-1 text-2xl font-bold ${s.highlight ?? "text-slate-900"}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="mb-4 flex gap-1 rounded-xl bg-slate-200 p-1 w-fit">
          {(["users", "datasets"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`rounded-lg px-4 py-2 text-sm font-semibold capitalize transition ${
                activeTab === tab
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {tab} ({tab === "users" ? users.length : datasets.length})
            </button>
          ))}
        </div>

        {/* Users table */}
        {activeTab === "users" && (
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="font-semibold text-slate-900">Users</h2>
            </div>
            {users.length === 0 ? (
              <p className="p-6 text-sm text-slate-500">No users found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      <th className="px-5 py-3">Name</th>
                      <th className="px-5 py-3">Email</th>
                      <th className="px-5 py-3">Role</th>
                      <th className="px-5 py-3">Joined</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-slate-50">
                        <td className="px-5 py-3 font-medium text-slate-900">{user.name}</td>
                        <td className="px-5 py-3 text-slate-500">{user.email}</td>
                        <td className="px-5 py-3">
                          <span
                            className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                              user.role === "ADMIN"
                                ? "bg-indigo-100 text-indigo-700"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {user.role}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-slate-500">
                          {new Date(user.createdAt).toLocaleDateString()}
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
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="font-semibold text-slate-900">All Datasets</h2>
            </div>
            {datasets.length === 0 ? (
              <p className="p-6 text-sm text-slate-500">No datasets found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      <th className="px-5 py-3">Name</th>
                      <th className="px-5 py-3">Owner</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3">Rows</th>
                      <th className="px-5 py-3">Created</th>
                      <th className="px-5 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {datasets.map((dataset) => (
                      <tr key={dataset.id} className="hover:bg-slate-50">
                        <td className="px-5 py-3 font-medium text-slate-900">{dataset.name}</td>
                        <td className="px-5 py-3 text-slate-500">{dataset.user.email}</td>
                        <td className="px-5 py-3">
                          <span
                            className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[dataset.status] ?? "bg-slate-100 text-slate-600"}`}
                          >
                            {dataset.status}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-slate-500">{dataset.rowCount.toLocaleString()}</td>
                        <td className="px-5 py-3 text-slate-500">
                          {new Date(dataset.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-5 py-3">
                          <button
                            type="button"
                            onClick={() => void onDeleteDataset(dataset.id, dataset.name)}
                            className="rounded-lg border border-red-200 px-2.5 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
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
