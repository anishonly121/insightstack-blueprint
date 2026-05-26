"use client";

import { useEffect } from "react";
import Link from "next/link";
import { LogoMark } from "@/components/LogoMark";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[GlobalError]", error.message, error.digest);
  }, [error]);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#050B18] px-6 text-center">
      <div className="pointer-events-none absolute inset-0">
        <div style={{ position: "absolute", top: "-20%", left: "10%", width: "80%", height: "70%", background: "radial-gradient(ellipse, rgba(239,68,68,0.06) 0%, transparent 65%)", filter: "blur(52px)" }} />
      </div>

      <Link href="/" className="relative mb-12 flex items-center gap-2 text-xl font-bold text-white">
        <LogoMark size={28} />
        Insight<span className="text-blue-400">Stack</span>
      </Link>

      <div className="relative mb-8">
        <p className="text-[9rem] font-black leading-none tracking-tight text-white/[0.04] sm:text-[12rem]">500</p>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-red-400">Something went wrong</p>
          <h1 className="text-2xl font-black text-white sm:text-3xl">Unexpected error</h1>
        </div>
      </div>

      <p className="mb-8 max-w-sm text-sm text-zinc-500">
        An unexpected error occurred. You can try again or return to the dashboard.
      </p>

      {error.digest && (
        <p className="mb-6 font-mono text-xs text-zinc-700">Error ID: {error.digest}</p>
      )}

      <div className="flex gap-3">
        <button
          onClick={reset}
          className="rounded-xl bg-blue-500 px-6 py-3 text-sm font-bold text-white shadow-[0_0_20px_rgba(59,130,246,0.3)] transition hover:bg-blue-400"
        >
          Try again
        </button>
        <Link
          href="/dashboard"
          className="rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/8"
        >
          Go to dashboard
        </Link>
      </div>
    </div>
  );
}
