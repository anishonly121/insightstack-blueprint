"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, setToken } from "@/lib/api";
import { LogoMark } from "@/components/LogoMark";

function getPasswordStrength(pwd: string): {
  level: 0 | 1 | 2 | 3;
  label: string;
  barColor: string;
  width: string;
} {
  if (!pwd) return { level: 0, label: "", barColor: "", width: "0%" };
  const hasUpper   = /[A-Z]/.test(pwd);
  const hasLower   = /[a-z]/.test(pwd);
  const hasNumber  = /[0-9]/.test(pwd);
  const hasSpecial = /[^A-Za-z0-9]/.test(pwd);
  const variety = [hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length;
  if (pwd.length < 8 || variety < 2) return { level: 1, label: "Weak",   barColor: "bg-red-500",     width: "33%"  };
  if (pwd.length < 12 || variety < 3) return { level: 2, label: "Good",   barColor: "bg-amber-400",   width: "66%"  };
  return                               { level: 3, label: "Strong", barColor: "bg-emerald-400", width: "100%" };
}

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
      const m = new URLSearchParams(window.location.search).get("mode");
      if (m === "register") setMode("register");
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
    <div className="relative flex min-h-screen overflow-hidden bg-[#050B18]">

      {/* Gradient mesh background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div style={{ position: "absolute", top: "-20%", left: "-10%", width: "80%", height: "80%", background: "radial-gradient(ellipse, rgba(59,130,246,0.10) 0%, transparent 65%)", filter: "blur(48px)" }} />
        <div style={{ position: "absolute", bottom: "-10%", right: "-10%", width: "60%", height: "60%", background: "radial-gradient(ellipse, rgba(99,102,241,0.08) 0%, transparent 65%)", filter: "blur(48px)" }} />
      </div>

      {/* Left panel — branding */}
      <div className="relative hidden flex-col justify-between p-14 lg:flex lg:w-[52%]">
        {/* Dot grid */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.018]" style={{ backgroundImage: "radial-gradient(rgba(255,255,255,1) 1px, transparent 1px)", backgroundSize: "32px 32px" }} />

        <Link href="/" className="relative flex items-center gap-2 text-xl font-bold tracking-tight text-white">
          <LogoMark size={28} />
          <span>Insight<span className="text-blue-400">Stack</span></span>
        </Link>

        <div className="relative">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-500/15 bg-blue-500/5 px-3 py-1.5 text-xs font-semibold uppercase tracking-widest text-blue-300">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
            AI-Powered Finance Analytics
          </div>
          <blockquote className="mb-5 text-4xl font-black leading-[1.1] tracking-tight text-white">
            &ldquo;Financial intelligence<br />
            <span className="text-gradient-blue">that actually pays off.</span>&rdquo;
          </blockquote>
          <p className="text-[#8892A4]">
            Upload a CSV · Map your spending · Generate GPT-4o recommendations
          </p>

          <div className="mt-10 grid grid-cols-3 gap-4">
            {[
              { val: "60 s", label: "CSV to insight" },
              { val: "$2.4k", label: "Avg error caught" },
              { val: "GPT-4o", label: "AI Engine" },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4">
                <p className="text-xl font-black text-blue-400">{s.val}</p>
                <p className="mt-0.5 text-xs text-[#8892A4]">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-[#8892A4]/50">Built with Next.js · PostgreSQL · OpenAI · Deployed on Vercel</p>
      </div>

      {/* Right panel — form */}
      <div className="relative flex flex-1 items-center justify-center border-l border-white/[0.04] px-6 py-12">
        <div className="w-full max-w-md">

          {/* Logo — mobile only */}
          <Link href="/" className="mb-8 flex items-center justify-center gap-2 text-xl font-bold text-white lg:hidden">
            <LogoMark size={28} />
            Insight<span className="text-blue-400">Stack</span>
          </Link>

          {/* Card */}
          <div className="rounded-2xl border border-white/[0.06] bg-[#0A1628]/80 p-8 shadow-[0_32px_80px_rgba(0,0,0,0.6)] backdrop-blur-xl">
            <h1 className="mb-1 text-2xl font-black text-white">
              {mode === "login" ? "Welcome back" : "Create your account"}
            </h1>
            <p className="mb-7 text-sm text-[#8892A4]">
              {mode === "login"
                ? "Sign in to access your financial dashboard."
                : "Start analysing your spending in minutes."}
            </p>

            {/* Tab toggle */}
            <div className="mb-7 grid grid-cols-2 gap-1 rounded-xl bg-[#050B18] p-1">
              {(["login", "register"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => { setMode(m); setError(""); }}
                  className={`rounded-lg py-2.5 text-sm font-semibold transition-all duration-200 ${
                    mode === m
                      ? "bg-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.3)]"
                      : "text-[#8892A4] hover:text-zinc-300"
                  }`}
                >
                  {m === "login" ? "Login" : "Register"}
                </button>
              ))}
            </div>

            <form onSubmit={onSubmit} className="space-y-4">
              {mode === "register" && (
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#8892A4]">Full name</label>
                  <input
                    className="w-full rounded-xl border border-white/[0.06] bg-[#050B18] px-4 py-3 text-sm text-white placeholder-[#8892A4]/50 transition focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    placeholder="Jane Smith"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    autoComplete="name"
                  />
                </div>
              )}
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#8892A4]">Email</label>
                <input
                  className="w-full rounded-xl border border-white/[0.06] bg-[#050B18] px-4 py-3 text-sm text-white placeholder-[#8892A4]/50 transition focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  placeholder="jane@example.com"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#8892A4]">Password</label>
                <input
                  className="w-full rounded-xl border border-white/[0.06] bg-[#050B18] px-4 py-3 text-sm text-white placeholder-[#8892A4]/50 transition focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  placeholder="••••••••"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                />
                {mode === "register" && password && (() => {
                  const s = getPasswordStrength(password);
                  return (
                    <div className="mt-2">
                      <div className="h-1 w-full overflow-hidden rounded-full bg-white/[0.06]">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${s.barColor}`}
                          style={{ width: s.width }}
                        />
                      </div>
                      <p className={`mt-1 text-right text-[10px] font-semibold ${
                        s.level === 1 ? "text-red-400" :
                        s.level === 2 ? "text-amber-400" : "text-emerald-400"
                      }`}>
                        {s.label}
                      </p>
                    </div>
                  );
                })()}
              </div>

              {error && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="group relative mt-2 w-full overflow-hidden rounded-xl bg-blue-500 py-3.5 text-sm font-semibold text-white shadow-[0_0_25px_rgba(59,130,246,0.35),inset_0_1px_0_rgba(255,255,255,0.15)] transition-all duration-300 hover:bg-blue-400 hover:shadow-[0_0_40px_rgba(59,130,246,0.55)] disabled:opacity-50"
              >
                <span className="relative z-10">
                  {loading
                    ? (mode === "login" ? "Signing in…" : "Creating account…")
                    : (mode === "login" ? "Sign in →" : "Create account →")}
                </span>
                <div className="absolute inset-0 translate-x-[-100%] bg-gradient-to-r from-white/0 via-white/10 to-white/0 transition-transform duration-700 group-hover:translate-x-[100%]" />
              </button>

              {mode === "login" && (
                <p className="text-right text-sm">
                  <Link href="/forgot-password" className="text-[#8892A4] transition hover:text-blue-400">
                    Forgot password?
                  </Link>
                </p>
              )}
            </form>
          </div>

          {/* Demo credentials quick-fill */}
          <div className="mt-4 rounded-xl border border-white/[0.05] bg-white/[0.02] px-5 py-4 text-center">
            <p className="mb-2 text-xs text-zinc-700">Just browsing? Try the demo account.</p>
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setEmail("demo@insightstack.app");
                setPassword("Demo1234!");
                setError("");
              }}
              className="text-xs font-semibold text-[#8892A4] transition hover:text-blue-400"
            >
              Fill demo credentials →
            </button>
          </div>

          <p className="mt-4 text-center text-xs text-[#8892A4]/50">
            <Link href="/" className="transition hover:text-[#8892A4]">← Back to home</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
