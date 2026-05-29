"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, type AuthUser, clearToken } from "@/lib/api";
import { LogoMark } from "@/components/LogoMark";

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState(false);

  const [deletePassword, setDeletePassword] = useState("");
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [showDeleteForm, setShowDeleteForm] = useState(false);

  const [quota, setQuota] = useState<import("@/lib/api").QuotaInfo | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const [digestEnabled, setDigestEnabled] = useState(true);
  const [digestLoading, setDigestLoading] = useState(false);
  const [digestSaved, setDigestSaved] = useState(false);

  useEffect(() => {
    api.me().then((res) => setUser(res.user)).catch(() => router.push("/login"));
    api.getNotifications().then((res) => setDigestEnabled(res.data.emailDigestEnabled)).catch(() => {});
    api.quota().then((res) => setQuota(res.data)).catch(() => {});
  }, [router]);

  const onToggleDigest = async (enabled: boolean) => {
    setDigestEnabled(enabled);
    setDigestLoading(true);
    setDigestSaved(false);
    try {
      await api.updateNotifications({ emailDigestEnabled: enabled });
      setDigestSaved(true);
      setTimeout(() => setDigestSaved(false), 2000);
    } catch {
      setDigestEnabled(!enabled);
    } finally {
      setDigestLoading(false);
    }
  };

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

        {/* Billing */}
        <section className="mb-6 rounded-2xl border border-white/6 bg-zinc-900 p-6">
          <h2 className="mb-1 text-sm font-bold uppercase tracking-widest text-zinc-500">Plan &amp; Billing</h2>
          <p className="mb-5 text-xs text-zinc-600">Manage your subscription and usage limits.</p>

          <div className="mb-4 rounded-xl border border-white/5 bg-zinc-800/50 p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 ${quota?.isPro ? "bg-blue-500/10 text-blue-400 ring-blue-500/20" : "bg-zinc-700/50 text-zinc-400 ring-zinc-600/30"}`}>
                    {quota?.isPro ? "Pro" : "Free"}
                  </span>
                  {quota?.isPro && quota.stripeCurrentPeriodEnd && (
                    <span className="text-xs text-zinc-600">
                      Renews {new Date(quota.stripeCurrentPeriodEnd).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                  )}
                </div>
                {quota && (
                  <p className="mt-1.5 text-xs text-zinc-500">
                    {quota.insightsUsed} / {quota.insightsLimit} AI insights used {quota.insightsPeriod}
                    {!quota.isPro && quota.datasetLimit !== null && (
                      <> · {quota.datasetCount} / {quota.datasetLimit} datasets</>
                    )}
                  </p>
                )}
              </div>
              {quota?.isPro ? (
                <button
                  type="button"
                  disabled={portalLoading}
                  onClick={async () => {
                    setPortalLoading(true);
                    try {
                      const res = await api.createPortalSession();
                      window.location.href = res.data.url;
                    } catch {
                      setPortalLoading(false);
                    }
                  }}
                  className="shrink-0 rounded-xl border border-white/8 px-4 py-2 text-sm font-semibold text-zinc-300 transition hover:border-white/15 hover:text-white disabled:opacity-50"
                >
                  {portalLoading ? "Opening…" : "Manage billing"}
                </button>
              ) : (
                <button
                  type="button"
                  disabled={checkoutLoading}
                  onClick={async () => {
                    setCheckoutLoading(true);
                    try {
                      const res = await api.createCheckoutSession();
                      window.location.href = res.data.url;
                    } catch {
                      setCheckoutLoading(false);
                    }
                  }}
                  className="shrink-0 rounded-xl bg-blue-500 px-4 py-2 text-sm font-black text-white shadow-[0_0_15px_rgba(59,130,246,0.25)] transition hover:bg-blue-400 disabled:opacity-50"
                >
                  {checkoutLoading ? "Opening…" : "Upgrade to Pro →"}
                </button>
              )}
            </div>
          </div>

          {!quota?.isPro && (
            <div className="grid grid-cols-2 gap-3 text-xs text-zinc-600">
              <div className="rounded-lg border border-white/5 bg-zinc-800/30 p-3">
                <p className="font-semibold text-zinc-400">Free</p>
                <ul className="mt-1.5 space-y-1">
                  <li>3 datasets</li>
                  <li>5 AI insights / month</li>
                  <li>All core features</li>
                </ul>
              </div>
              <div className="rounded-lg border border-blue-500/15 bg-blue-500/5 p-3">
                <p className="font-semibold text-blue-400">Pro — $9/mo</p>
                <ul className="mt-1.5 space-y-1 text-zinc-400">
                  <li>Unlimited datasets</li>
                  <li>30 AI insights / day</li>
                  <li>14-day free trial</li>
                </ul>
              </div>
            </div>
          )}
        </section>

        {/* Notifications */}
        <section className="mb-6 rounded-2xl border border-white/6 bg-zinc-900 p-6">
          <h2 className="mb-1 text-sm font-bold uppercase tracking-widest text-zinc-500">Notifications</h2>
          <p className="mb-5 text-xs text-zinc-600">Control which emails InsightStack sends you.</p>

          <div className="flex items-center justify-between gap-4 rounded-xl border border-white/5 bg-zinc-800/50 px-4 py-3.5">
            <div>
              <p className="text-sm font-semibold text-zinc-200">Weekly email digest</p>
              <p className="text-xs text-zinc-600">A spending summary every Monday morning with budget alerts and AI recommendations.</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={digestEnabled}
              disabled={digestLoading}
              onClick={() => void onToggleDigest(!digestEnabled)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none disabled:opacity-50 ${digestEnabled ? "bg-blue-500" : "bg-zinc-700"}`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg transition-transform duration-200 ${digestEnabled ? "translate-x-5" : "translate-x-0"}`}
              />
            </button>
          </div>

          {digestSaved && (
            <p className="mt-3 text-xs text-emerald-400">Preference saved.</p>
          )}
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
