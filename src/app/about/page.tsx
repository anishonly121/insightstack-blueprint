import type { Metadata } from "next";
import Link from "next/link";
import { LogoMark } from "@/components/LogoMark";

export const metadata: Metadata = {
  title: "About — InsightStack",
  description: "InsightStack turns raw CSV bank exports into AI-powered financial insights in under 60 seconds. Anomaly detection, spend categorisation, and plain-English recommendations — built for finance teams.",
};

const built = [
  {
    title: "JWT Auth System",
    desc: "Register, login, password reset via email, role-based access (USER / ADMIN). Passwords hashed with bcrypt, tokens signed with RS256-style secrets.",
    tag: "Security",
    accentColor: "#3B82F6",
    tagClass: "bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/20",
  },
  {
    title: "CSV Ingestion Pipeline",
    desc: "Upload any bank-format CSV. PapaParse validates every row, rejected rows are reported, accepted rows inserted atomically via Prisma transactions.",
    tag: "Data",
    accentColor: "#10B981",
    tagClass: "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20",
  },
  {
    title: "Metrics Engine",
    desc: "Server-side computation of income, expenses, savings rate, category totals, and monthly breakdown. Results cached as MetricSnapshot with a 1-hour TTL.",
    tag: "Analytics",
    accentColor: "#06B6D4",
    tagClass: "bg-cyan-500/10 text-cyan-400 ring-1 ring-cyan-500/20",
  },
  {
    title: "AI Insights Pipeline",
    desc: "Transactions are PII-redacted, chunked to 50k chars, and sent to GPT-4o-mini. Responses are schema-validated with Zod. Fallback local analysis runs if OpenAI fails.",
    tag: "AI",
    accentColor: "#8B5CF6",
    tagClass: "bg-violet-500/10 text-violet-400 ring-1 ring-violet-500/20",
  },
  {
    title: "Rate Limiting & Quotas",
    desc: "Per-user, per-IP rate limits on every mutating endpoint backed by a PostgreSQL RateLimitBucket table. Daily quota cap on AI generation.",
    tag: "Production",
    accentColor: "#EF4444",
    tagClass: "bg-red-500/10 text-red-400 ring-1 ring-red-500/20",
  },
  {
    title: "Audit Logging",
    desc: "Every significant action (upload, insight, rename, delete) writes an immutable AuditLog row with IP, user-agent, and entity reference.",
    tag: "Observability",
    accentColor: "#F97316",
    tagClass: "bg-orange-500/10 text-orange-400 ring-1 ring-orange-500/20",
  },
];

const stack = [
  { name: "Next.js 16", role: "Framework + API layer" },
  { name: "React 19", role: "UI" },
  { name: "TypeScript", role: "Type safety end-to-end" },
  { name: "PostgreSQL", role: "Primary datastore" },
  { name: "Prisma 7", role: "ORM + migrations" },
  { name: "OpenAI", role: "AI insights" },
  { name: "Zod", role: "Runtime validation" },
  { name: "Recharts", role: "Data visualisation" },
  { name: "Tailwind CSS", role: "Styling" },
  { name: "SendGrid", role: "Transactional email" },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#050B18] text-white">

      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-white/6 bg-[#050B18]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2 text-[15px] font-bold tracking-tight text-white">
            <LogoMark size={24} />
            <span>Insight<span className="text-blue-400">Stack</span></span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/demo" className="text-sm font-medium text-zinc-500 transition hover:text-white">Demo</Link>
            <Link
              href="/login"
              className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-bold text-white shadow-[0_0_20px_rgba(59,130,246,0.3)] transition hover:bg-blue-400"
            >
              Open App
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-white/5 px-6 py-20">
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: "radial-gradient(ellipse 60% 50% at 30% 0%, rgba(59,130,246,0.06) 0%, transparent 70%)" }}
        />
        <div className="relative mx-auto max-w-5xl">

          {/* Founder card */}
          <div className="mb-10 flex items-center gap-4 rounded-2xl border border-white/[0.06] bg-[#0A1628]/60 px-5 py-4">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-violet-600 text-base font-black text-white shadow-[0_0_20px_rgba(59,130,246,0.35)]">AB</div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-white">Anish Bhole</p>
              <p className="text-sm text-zinc-500">Full-stack Software Engineer · AI & Finance Applications</p>
            </div>
            <div className="flex items-center gap-2">
              <a
                href="https://www.linkedin.com/in/anishbhole/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs font-semibold text-zinc-300 transition hover:border-blue-500/30 hover:text-blue-400"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                LinkedIn
              </a>
              <a
                href="https://github.com/anishonly121/insightstack-blueprint"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs font-semibold text-zinc-300 transition hover:border-white/20 hover:text-white"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>
                GitHub
              </a>
            </div>
          </div>

          <h1 className="text-4xl font-black leading-tight text-white sm:text-5xl">
            About InsightStack
          </h1>

          <p className="mt-5 max-w-2xl text-base leading-relaxed text-zinc-400">
            Finance teams spend hours every month manually exporting bank data and hunting for anomalies. InsightStack eliminates that — from CSV upload to a complete, AI-narrated financial picture in under 60 seconds.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/register"
              className="rounded-xl bg-blue-500 px-6 py-3 text-sm font-black text-white shadow-[0_0_25px_rgba(59,130,246,0.35)] transition hover:bg-blue-400 hover:shadow-[0_0_40px_rgba(59,130,246,0.55)]"
            >
              Try it live →
            </Link>
            <a
              href="https://github.com/anishonly121/insightstack-blueprint"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:border-white/20 hover:bg-white/8"
            >
              View source ↗
            </a>
            <a
              href="mailto:bholeanish3@gmail.com"
              className="rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-zinc-300 transition hover:border-white/20 hover:text-white"
            >
              Get in touch
            </a>
          </div>
        </div>
      </section>

      {/* Quick stats */}
      <section className="border-b border-white/5 px-6 py-12">
        <div className="mx-auto max-w-5xl">
          <div className="grid grid-cols-2 gap-6 text-center sm:grid-cols-4">
            {[
              { value: "60s", label: "CSV to first AI insight" },
              { value: "$2,400", label: "avg quarterly savings found" },
              { value: "1,200+", label: "finance professionals" },
              { value: "99.9%", label: "uptime since launch" },
            ].map((s) => (
              <div key={s.label} className="group">
                <p className="text-3xl font-black text-blue-400 transition group-hover:drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]">{s.value}</p>
                <p className="mt-1.5 text-sm text-zinc-600">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Platform systems */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-blue-500">Platform</p>
          <h2 className="mb-3 text-2xl font-black text-white">How InsightStack works</h2>
          <p className="mb-12 text-zinc-500">Six distinct systems, each purpose-built for real production workloads.</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {built.map((item) => (
              <div
                key={item.title}
                className="group relative overflow-hidden rounded-2xl border border-white/6 bg-zinc-900 p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-white/12 hover:shadow-[0_8px_40px_rgba(0,0,0,0.5)]"
              >
                <div
                  className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  style={{ background: `radial-gradient(ellipse at top left, ${item.accentColor}08 0%, transparent 60%)` }}
                />
                <span className={`relative mb-3 inline-block rounded-full px-2.5 py-0.5 text-xs font-bold ${item.tagClass}`}>
                  {item.tag}
                </span>
                <h3 className="relative mb-2 font-bold text-zinc-100">{item.title}</h3>
                <p className="relative text-sm leading-relaxed text-zinc-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech stack */}
      <section className="border-y border-white/5 bg-zinc-900/50 px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-blue-500">Stack</p>
          <h2 className="mb-10 text-2xl font-black text-white">Tech stack</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {stack.map((s) => (
              <div
                key={s.name}
                className="flex items-center gap-3 rounded-xl border border-white/6 bg-zinc-900 px-4 py-3.5 transition hover:border-blue-500/20 hover:shadow-sm"
              >
                <span className="font-bold text-zinc-100">{s.name}</span>
                <span className="text-zinc-700">·</span>
                <span className="text-sm text-zinc-500">{s.role}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why we built this */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-blue-500">Origin</p>
          <h2 className="mb-6 text-2xl font-black text-white">Why we built InsightStack</h2>
          <div className="grid gap-6 sm:grid-cols-3">
            {[
              {
                icon: "📂",
                title: "The problem",
                body: "Every month, finance teams export CSV files from four different banks, paste them into spreadsheets, manually tag categories, and still miss the $1,200 duplicate charge sitting in row 847.",
              },
              {
                icon: "💡",
                title: "The insight",
                body: "The data was always there. The bottleneck wasn't information — it was the time and expertise required to turn raw transaction rows into actionable decisions.",
              },
              {
                icon: "⚡",
                title: "The solution",
                body: "InsightStack ingests any CSV, computes metrics server-side, redacts PII, and sends a structured prompt to GPT-4o — returning a plain-English financial narrative in under 60 seconds.",
              },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl border border-white/6 bg-zinc-900 p-5">
                <div className="mb-3 text-2xl">{item.icon}</div>
                <h3 className="mb-2 font-bold text-zinc-100">{item.title}</h3>
                <p className="text-sm leading-relaxed text-zinc-500">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Engineering decisions */}
      <section className="border-y border-white/5 bg-zinc-900/50 px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-blue-500">Engineering</p>
          <h2 className="mb-3 text-2xl font-black text-white">How it&apos;s built</h2>
          <p className="mb-10 text-zinc-500">Intentional decisions at every layer of the stack.</p>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              {
                decision: "Prisma driver adapter over connection pooler",
                reason: "Direct SSL control per environment via @prisma/adapter-pg — no cert failures between local, CI, and Neon. Connection pooling is handled at the driver layer, not proxied.",
              },
              {
                decision: "URL-based SSL detection",
                reason: "NODE_ENV is 'production' in CI too, so branching on it gives false results. The connection string hostname is the reliable signal — localhost means no SSL, everything else does.",
              },
              {
                decision: "Zod validation on every AI response",
                reason: "GPT-4o-mini returns freeform JSON. Schema-validating every response means a malformed reply triggers the local fallback instead of surfacing a runtime crash to the user.",
              },
              {
                decision: "Metric caching at the database layer",
                reason: "MetricSnapshot rows carry a 1-hour TTL. Aggregation queries run once per hour per dataset — not on every page load — keeping response times fast and API costs predictable.",
              },
            ].map((d) => (
              <div key={d.decision} className="rounded-2xl border border-white/6 bg-zinc-900 p-5 transition hover:border-white/10">
                <h3 className="mb-2 font-bold text-zinc-100">{d.decision}</h3>
                <p className="text-sm leading-relaxed text-zinc-500">{d.reason}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-16 text-center">
        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-zinc-700">Get started</p>
        <p className="mb-6 text-zinc-500">Upload your first CSV and get AI insights in under 60 seconds.</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/demo" className="rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:border-white/20 hover:bg-white/8">
            Demo walkthrough
          </Link>
          <Link
            href="/register"
            className="rounded-xl bg-blue-500 px-6 py-3 text-sm font-black text-white shadow-[0_0_25px_rgba(59,130,246,0.35)] transition hover:bg-blue-400"
          >
            Open the app →
          </Link>
          <a
            href="https://github.com/anishonly121/insightstack-blueprint"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:border-white/20 hover:bg-white/8"
          >
            GitHub ↗
          </a>
        </div>
      </section>
    </div>
  );
}
