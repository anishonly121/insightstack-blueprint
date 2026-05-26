"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, type AuthUser, clearToken } from "@/lib/api";
import { LogoMark } from "@/components/LogoMark";

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);

  // ── Password change state ────────────────────────────────────────────────────
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState(false);

  // ── Delete account state ─────────────────────────────────────────────────────
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [showDeleteForm, setShowDeleteForm] = useState(false);

  useEffect(() => {
    api.me().then((res) => setUser(res.user)).catch(() => router.push("/login"));
  }, [router]);

  const onChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError(""); setPwSuccess(false);
    if (newPassword !== confirmPassword) { setPwError("New passwords don't match"); return; }
    if (newPassword.length < 8) { setPwError("New password must be at least 8 characters"); return; }
    setPwLoading(true);
    try {
      await api.changePassword({ currentPassword, newPassword });
      setPwSuccess(true);
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
    } catch (err) {
      setPwError(err instanceof Error ? err.message : "Failed to change password");
    } finally {
      setPwLoading(false);
    }
  };

  const onDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeleteError("");
    if (deleteConfirmText !== "delete my account") {
      setDeleteError('Type "delete my account" to confirm');
      return;
    }
    setDeleteLoading(true);
    try {
      await api.deleteAccount({ password: deletePassword });
      clearToken();
      router.push("/");
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Failed to delete account");
      setDeleteLoading(false);
    }
  };

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
            <h1 className="text-2xl font-black text-white">Account settings</h1>
            {user && <p className="mt-0.5 text-sm text-zinc-500">{user.email}</p>}
          </div>
          <Link
            href="/dashboard"
            className="rounded-lg border border-white/8 bg-zinc-900 px-3 py-2 text-sm font-medium text-zinc-400 transition hover:text-white"
          >
            ← Dashboard
          </Link>
        </header>

        {/* Profile info (read-only) */}
        <section className="mb-6 rounded-2xl border border-white/6 bg-zinc-900 p-6">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-zinc-500">Profile</h2>
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-violet-600 text-base font-black text-white">
              {user?.name?.charAt(0).toUpperCase() ?? "?"}
            </div>
            <div>
              <p className="font-semibold text-white">{user?.name ?? "—"}</p>
              <p className="text-sm text-zinc-500">{user?.email ?? "—"}</p>
            </div>
            <span className="ml-auto rounded-full border border-white/8 px-2.5 py-1 text-xs font-semibold text-zinc-500">
              {user?.role ?? "USER"}
            </span>
          </div>
        </section>

        {/* Change password */}
        <section className="mb-6 rounded-2xl border border-white/6 bg-zinc-900 p-6">
          <h2 className="mb-1 text-sm font-bold uppercase tracking-widest text-zinc-500">Change password</h2>
          <p className="mb-5 text-xs text-zinc-600">Your new password must be at least 8 characters.</p>
          <form onSubmit={(e) => void onChangePassword(e)} className="space-y-3">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-zinc-400">Current password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="w-full rounded-xl border border-white/8 bg-zinc-800 px-4 py-3 text-sm text-white placeholder-zinc-600 focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                placeholder="Enter current password"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-zinc-400">New password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="w-full rounded-xl border border-white/8 bg-zinc-800 px-4 py-3 text-sm text-white placeholder-zinc-600 focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                placeholder="Min. 8 characters"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-zinc-400">Confirm new password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full rounded-xl border border-white/8 bg-zinc-800 px-4 py-3 text-sm text-white placeholder-zinc-600 focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                placeholder="Repeat new password"
              />
            </div>
            {pwError && (
              <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400">{pwError}</p>
            )}
            {pwSuccess && (
              <p className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-400">
                Password changed successfully.
              </p>
            )}
            <button
              type="submit"
              disabled={pwLoading}
              className="rounded-xl bg-blue-500 px-5 py-2.5 text-sm font-bold text-white shadow-[0_0_15px_rgba(59,130,246,0.25)] transition hover:bg-blue-400 disabled:opacity-50"
            >
              {pwLoading ? "Saving…" : "Update password"}
            </button>
          </form>
        </section>

        {/* Danger zone */}
        <section className="rounded-2xl border border-red-500/20 bg-zinc-900 p-6">
          <h2 className="mb-1 text-sm font-bold uppercase tracking-widest text-red-500">Danger zone</h2>
          <p className="mb-5 text-xs text-zinc-600">
            Permanently deletes your account, all datasets, transactions, and insights. This cannot be undone.
          </p>
          {!showDeleteForm ? (
            <button
              type="button"
              onClick={() => setShowDeleteForm(true)}
              className="rounded-xl border border-red-500/30 bg-red-500/8 px-5 py-2.5 text-sm font-bold text-red-400 transition hover:bg-red-500/15"
            >
              Delete account
            </button>
          ) : (
            <form onSubmit={(e) => void onDeleteAccount(e)} className="space-y-3">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-zinc-400">Confirm your password</label>
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  required
                  className="w-full rounded-xl border border-white/8 bg-zinc-800 px-4 py-3 text-sm text-white placeholder-zinc-600 focus:border-red-500/50 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                  placeholder="Your current password"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-zinc-400">
                  Type <span className="font-mono text-red-400">delete my account</span> to confirm
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  required
                  className="w-full rounded-xl border border-white/8 bg-zinc-800 px-4 py-3 text-sm text-white placeholder-zinc-600 focus:border-red-500/50 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                  placeholder="delete my account"
                />
              </div>
              {deleteError && (
                <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400">{deleteError}</p>
              )}
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={deleteLoading || deleteConfirmText !== "delete my account"}
                  className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {deleteLoading ? "Deleting…" : "Permanently delete account"}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowDeleteForm(false); setDeleteError(""); setDeletePassword(""); setDeleteConfirmText(""); }}
                  className="rounded-xl border border-white/8 px-5 py-2.5 text-sm font-medium text-zinc-400 transition hover:text-white"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </section>
      </div>
    </main>
  );
}
