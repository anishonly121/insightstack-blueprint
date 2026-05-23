import Link from "next/link";

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

const learned = [
  "Designing API contracts upfront and keeping frontend types derived from them.",
  "Using Prisma transactions to guarantee data integrity across multiple table writes.",
  "Hardening AI features: schema-validating LLM output, building fallbacks, capping token spend.",
  "Next.js App Router patterns — server components, streaming loading states, route handlers.",
  "Security defaults that matter in production: CSP, CSRF, referrer policy, permissions policy.",
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
          <Link href="/" className="text-lg font-bold tracking-tight text-white">
            Insight<span className="text-blue-400">Stack</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/demo" className="text-sm font-medium text-zinc-500 transition hover:text-white">Demo</Link>
            <Link
              href="/login"
              className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-bold text-zinc-900 shadow-[0_0_20px_rgba(59,130,246,0.3)] transition hover:bg-blue-400"
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
          <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/8 px-3 py-1.5 text-xs font-semibold uppercase tracking-widest text-blue-400">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
            Portfolio Project
          </span>
          <h1 className="mt-4 text-4xl font-black leading-tight text-white sm:text-5xl">
            About InsightStack
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-zinc-400">
            A production-style full-stack application demonstrating authentication,
            data ingestion, analytics, and AI integration — built to the standard
            I hold myself to in a professional environment.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link
              href="/register"
              className="rounded-xl bg-blue-500 px-6 py-3 text-sm font-black text-zinc-900 shadow-[0_0_25px_rgba(59,130,246,0.35)] transition hover:bg-blue-400 hover:shadow-[0_0_40px_rgba(59,130,246,0.55)]"
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
          </div>
        </div>
      </section>

      {/* Quick stats */}
      <section className="border-b border-white/5 px-6 py-12">
        <div className="mx-auto max-w-5xl">
          <div className="grid grid-cols-2 gap-6 text-center sm:grid-cols-4">
            {[
              { value: "29", label: "Integration tests" },
              { value: "30+", label: "API endpoints" },
              { value: "6", label: "Core systems" },
              { value: "100%", label: "TypeScript" },
            ].map((s) => (
              <div key={s.label} className="group">
                <p className="text-3xl font-black text-blue-400 transition group-hover:drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]">{s.value}</p>
                <p className="mt-1.5 text-sm text-zinc-600">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What I built */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-blue-500">Systems</p>
          <h2 className="mb-3 text-2xl font-black text-white">What I built</h2>
          <p className="mb-12 text-zinc-500">Six distinct systems, each designed and implemented independently.</p>
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

      {/* What I learned */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-blue-500">Growth</p>
          <h2 className="mb-10 text-2xl font-black text-white">What I learned</h2>
          <ul className="space-y-5">
            {learned.map((item, i) => (
              <li key={i} className="flex items-start gap-4">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-500 text-xs font-black text-zinc-900 shadow-[0_0_12px_rgba(59,130,246,0.25)]">
                  {i + 1}
                </span>
                <p className="pt-0.5 leading-relaxed text-zinc-400">{item}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Engineering decisions */}
      <section className="border-y border-white/5 bg-zinc-900/50 px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-blue-500">Architecture</p>
          <h2 className="mb-3 text-2xl font-black text-white">Key engineering decisions</h2>
          <p className="mb-10 text-zinc-500">Choices I made intentionally and the reasoning behind them.</p>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              {
                decision: "Prisma driver adapter over connection pooler",
                reason: "Using @prisma/adapter-pg with pg.Pool gives direct SSL control per environment — no surprise cert failures between local, CI, and Neon (Vercel Postgres).",
              },
              {
                decision: "URL-based SSL detection",
                reason: "Rather than branching on NODE_ENV (which is 'production' in CI too), I check the connection string for 'localhost' — a more reliable signal.",
              },
              {
                decision: "Zod on LLM output boundaries",
                reason: "GPT-4o-mini returns freeform JSON. Schema-validating every response means a malformed reply triggers the local fallback, never a runtime crash.",
              },
              {
                decision: "Metric caching at the database layer",
                reason: "MetricSnapshot rows have a 1-hour TTL. Aggregation queries run once per hour per dataset, not on every page load — keeps costs and latency low.",
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
        <p className="mb-6 text-zinc-500">See it in action or read the source</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/demo" className="rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:border-white/20 hover:bg-white/8">
            Demo walkthrough
          </Link>
          <Link
            href="/register"
            className="rounded-xl bg-blue-500 px-6 py-3 text-sm font-black text-zinc-900 shadow-[0_0_25px_rgba(59,130,246,0.35)] transition hover:bg-blue-400"
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
