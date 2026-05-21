"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, setToken } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const mode = new URLSearchParams(window.location.search).get("mode");
      if (mode === "register") setMode("register");
    }
  }, []);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res =
        mode === "login"
          ? await api.login({ email, password })
          : await api.register({ name, email, password });
      setToken(res.token);
      const nextPath =
        typeof window !== "undefined"
          ? new URLSearchParams(window.location.search).get("next")
          : null;
      router.push(nextPath ?? "/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 text-white">
        <Link href="/" className="text-lg font-bold tracking-tight">
          Insight<span className="text-indigo-400">Stack</span>
        </Link>
        <div>
          <blockquote className="mb-4 text-3xl font-bold leading-snug">
            "Turn your transactions into actionable insights."
          </blockquote>
          <p className="text-indigo-300">
            Upload a CSV · Visualise spending · Generate AI recommendations
          </p>
        </div>
        <p className="text-xs text-slate-500">Built with Next.js · PostgreSQL · OpenAI</p>
      </div>

      {/* Right panel — form */}
      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm">
          {/* Logo (mobile only) */}
          <Link href="/" className="mb-6 block text-center text-lg font-bold text-white lg:hidden">
            Insight<span className="text-indigo-400">Stack</span>
          </Link>

          <h1 className="mb-1 text-2xl font-bold text-white">
            {mode === "login" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="mb-6 text-sm text-slate-400">
            {mode === "login"
              ? "Sign in to access your financial dashboard."
              : "Start analysing your spending in minutes."}
          </p>

          {/* Tab toggle */}
          <div className="mb-6 grid grid-cols-2 gap-1 rounded-xl bg-white/10 p-1">
            {(["login", "register"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => { setMode(m); setError(""); }}
                className={`rounded-lg py-2 text-sm font-semibold transition ${
                  mode === m
                    ? "bg-white text-slate-900 shadow"
                    : "text-slate-300 hover:text-white"
                }`}
              >
                {m === "login" ? "Login" : "Register"}
              </button>
            ))}
          </div>

          <form onSubmit={onSubmit} className="space-y-3">
            {mode === "register" && (
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-400">Full name</label>
                <input
                  className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/30"
                  placeholder="Jane Smith"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoComplete="name"
                />
              </div>
            )}
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-400">Email</label>
              <input
                className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/30"
                placeholder="jane@example.com"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-400">Password</label>
              <input
                className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/30"
                placeholder="••••••••"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete={mode === "login" ? "current-password" : "new-password"}
              />
            </div>

            {error && (
              <div className="rounded-lg border border-red-400/30 bg-red-400/10 px-3 py-2 text-sm text-red-300">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-1 w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-50"
            >
              {loading
                ? mode === "login" ? "Signing in..." : "Creating account..."
                : mode === "login" ? "Sign in →" : "Create account →"}
            </button>

            {mode === "login" && (
              <p className="text-right text-sm">
                <Link href="/forgot-password" className="text-slate-400 hover:text-indigo-400 transition">
                  Forgot password?
                </Link>
              </p>
            )}
          </form>

          <p className="mt-6 text-center text-xs text-slate-500">
            <Link href="/" className="hover:text-slate-300 transition">
              ← Back to home
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
