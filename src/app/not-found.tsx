import Link from "next/link";
import { LogoMark } from "@/components/LogoMark";

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#050B18] px-6 text-center">

      {/* Background glows */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div style={{ position: "absolute", top: "-20%", left: "10%", width: "80%", height: "70%", background: "radial-gradient(ellipse, rgba(59,130,246,0.08) 0%, transparent 65%)", filter: "blur(52px)" }} />
      </div>

      {/* Dot grid */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.018]" style={{ backgroundImage: "radial-gradient(rgba(255,255,255,1) 1px, transparent 1px)", backgroundSize: "32px 32px" }} />

      {/* Logo */}
      <Link href="/" className="relative mb-12 flex items-center gap-2 text-xl font-bold text-white">
        <LogoMark size={28} />
        Insight<span className="text-blue-400">Stack</span>
      </Link>

      {/* 404 */}
      <div className="relative">
        <p className="text-[9rem] font-black leading-none tracking-tight text-white/[0.04] sm:text-[12rem]">404</p>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-blue-400">Page not found</p>
          <h1 className="text-2xl font-black text-white sm:text-3xl">Nothing here.</h1>
        </div>
      </div>

      <p className="relative mt-6 max-w-sm text-sm leading-relaxed text-[#8892A4]">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>

      <div className="relative mt-10 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="rounded-xl bg-blue-500 px-6 py-2.5 text-sm font-semibold text-white shadow-[0_0_24px_rgba(59,130,246,0.35)] transition hover:bg-blue-400 hover:shadow-[0_0_40px_rgba(59,130,246,0.5)]"
        >
          Back to home
        </Link>
        <Link
          href="/dashboard"
          className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-6 py-2.5 text-sm font-medium text-zinc-300 transition hover:border-white/[0.14] hover:text-white"
        >
          Go to dashboard
        </Link>
      </div>
    </div>
  );
}
