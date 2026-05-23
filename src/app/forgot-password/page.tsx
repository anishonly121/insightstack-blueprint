"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { LogoMark } from "@/components/LogoMark";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const body = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
      if (!res.ok) throw new Error(body?.error?.message ?? "Request failed");
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
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
          Insight<span className="text-blue-400">Stack</span>
        </Link>

        <div className="rounded-2xl border border-white/[0.06] bg-[#0A1628]/80 p-8 shadow-[0_32px_80px_rgba(0,0,0,0.6)] backdrop-blur-xl">
          <h1 className="mb-1 text-2xl font-black text-white">Forgot password?</h1>
          <p className="mb-7 text-sm text-[#8892A4]">
            Enter your email and we&apos;ll send a reset link if an account exists.
          </p>

          {submitted ? (
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-5 text-center">
              <p className="font-bold text-emerald-400">Check your inbox</p>
              <p className="mt-1.5 text-sm text-emerald-500/70">
                If an account exists for <strong>{email}</strong>, a reset link has been sent.
              </p>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#8892A4]">Email</label>
                <input
                  type="email"
                  placeholder="jane@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
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
                className="group relative w-full overflow-hidden rounded-xl bg-blue-500 py-3.5 text-sm font-semibold text-white shadow-[0_0_25px_rgba(59,130,246,0.35),inset_0_1px_0_rgba(255,255,255,0.15)] transition hover:bg-blue-400 hover:shadow-[0_0_40px_rgba(59,130,246,0.55)] disabled:opacity-50"
              >
                <span className="relative z-10">{loading ? "Sending…" : "Send reset link"}</span>
                <div className="absolute inset-0 translate-x-[-100%] bg-gradient-to-r from-white/0 via-white/10 to-white/0 transition-transform duration-700 group-hover:translate-x-[100%]" />
              </button>
            </form>
          )}

          <p className="mt-6 text-center text-xs text-[#8892A4]/50">
            <Link href="/login" className="transition hover:text-[#8892A4]">← Back to login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
