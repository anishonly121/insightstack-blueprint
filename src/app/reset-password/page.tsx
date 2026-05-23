"use client";

import { Suspense } from "react";
import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { LogoMark } from "@/components/LogoMark";

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const email = searchParams.get("email") ?? "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const hasRequiredParams = useMemo(() => token.length > 0 && email.length > 0, [token, email]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (newPassword.length < 8) { setError("Password must be at least 8 characters"); return; }
    if (newPassword !== confirmPassword) { setError("Passwords do not match"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token, newPassword }),
      });
      const body = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
      if (!res.ok) throw new Error(body?.error?.message ?? "Unable to reset password");
      setSuccess(true);
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#050B18] px-6 py-12">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div style={{ position: "absolute", top: "-20%", left: "10%", width: "80%", height: "70%", background: "radial-gradient(ellipse, rgba(59,130,246,0.08) 0%, transparent 65%)", filter: "blur(48px)" }} />
      </div>
      <div className="relative w-full max-w-md">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2 text-xl font-bold text-white">
          <LogoMark size={28} />
          <span>Insight<span className="text-blue-400">Stack</span></span>
        </Link>

        <div className="rounded-2xl border border-white/[0.06] bg-[#0A1628]/80 p-8 shadow-[0_32px_80px_rgba(0,0,0,0.6)] backdrop-blur-xl">
          {!hasRequiredParams ? (
            <>
              <h1 className="mb-2 text-2xl font-semibold text-white">Invalid reset link</h1>
              <p className="mb-6 text-sm text-[#8892A4]">This reset link is missing required parameters.</p>
              <Link href="/forgot-password" className="block w-full rounded-xl bg-blue-500 py-3.5 text-center text-sm font-semibold text-white shadow-[0_0_25px_rgba(59,130,246,0.3)] transition hover:bg-blue-400">
                Request a new link
              </Link>
            </>
          ) : success ? (
            <>
              <div className="mb-6 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-5 text-center ring-1 ring-emerald-500/10">
                <p className="font-bold text-emerald-400">Password updated</p>
                <p className="mt-1.5 text-sm text-emerald-500/70">Your password has been reset. You can now sign in.</p>
              </div>
              <Link href="/login" className="block w-full rounded-xl bg-blue-500 py-3.5 text-center text-sm font-semibold text-white shadow-[0_0_25px_rgba(59,130,246,0.3)] transition hover:bg-blue-400">
                Sign in →
              </Link>
            </>
          ) : (
            <>
              <h1 className="mb-1 text-2xl font-semibold text-white">Set new password</h1>
              <p className="mb-7 text-sm text-[#8892A4]">
                Resetting password for <span className="text-zinc-200">{email}</span>
              </p>
              <form onSubmit={onSubmit} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#8892A4]">New password</label>
                  <input
                    type="password"
                    placeholder="Min. 8 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    className="w-full rounded-xl border border-white/[0.06] bg-[#050B18] px-4 py-3 text-sm text-white placeholder-[#8892A4]/50 transition focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#8892A4]">Confirm password</label>
                  <input
                    type="password"
                    placeholder="Repeat your new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    className="w-full rounded-xl border border-white/[0.06] bg-[#050B18] px-4 py-3 text-sm text-white placeholder-[#8892A4]/50 transition focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                {error && (
                  <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                    {error}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-blue-500 py-3.5 text-sm font-semibold text-white shadow-[0_0_25px_rgba(59,130,246,0.35)] transition hover:bg-blue-400 hover:shadow-[0_0_40px_rgba(59,130,246,0.55)] disabled:opacity-50"
                >
                  {loading ? "Resetting..." : "Reset password"}
                </button>
              </form>
            </>
          )}
          <p className="mt-6 text-center text-xs text-[#8892A4]/50">
            <Link href="/login" className="transition hover:text-zinc-400">← Back to login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#050B18]">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" />
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
