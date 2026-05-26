"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[DashboardError]", error.message, error.digest);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#050B18] px-6">
      <div className="w-full max-w-md rounded-2xl border border-red-500/20 bg-zinc-900 p-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10">
          <svg className="h-6 w-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
        </div>
        <h2 className="mb-2 text-lg font-black text-white">Dashboard error</h2>
        <p className="mb-6 text-sm text-zinc-500">
          Something went wrong loading this page.
          {error.digest && <span className="mt-1 block font-mono text-xs text-zinc-700">ID: {error.digest}</span>}
        </p>
        <div className="flex justify-center gap-3">
          <button
            onClick={reset}
            className="rounded-lg bg-blue-500 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-blue-400"
          >
            Try again
          </button>
          <Link
            href="/"
            className="rounded-lg border border-white/10 px-5 py-2.5 text-sm font-semibold text-zinc-400 transition hover:text-white"
          >
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
