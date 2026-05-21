import Link from "next/link";

const built = [
  {
    title: "JWT Auth System",
    desc: "Register, login, password reset via email, role-based access (USER / ADMIN). Passwords hashed with bcrypt, tokens signed with RS256-style secrets.",
    tag: "Security",
    color: "bg-indigo-50 text-indigo-700 border-indigo-200",
  },
  {
    title: "CSV Ingestion Pipeline",
    desc: "Upload any bank-format CSV. PapaParse validates every row, rejected rows are reported, accepted rows inserted atomically via Prisma transactions.",
    tag: "Data",
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  {
    title: "Metrics Engine",
    desc: "Server-side computation of income, expenses, savings rate, category totals, and monthly breakdown. Results cached as MetricSnapshot with a 1-hour TTL.",
    tag: "Analytics",
    color: "bg-amber-50 text-amber-700 border-amber-200",
  },
  {
    title: "AI Insights Pipeline",
    desc: "Transactions are PII-redacted, chunked to 50k chars, and sent to GPT-4o-mini. Responses are schema-validated with Zod. Fallback local analysis runs if OpenAI fails.",
    tag: "AI",
    color: "bg-purple-50 text-purple-700 border-purple-200",
  },
  {
    title: "Rate Limiting & Quotas",
    desc: "Per-user, per-IP rate limits on every mutating endpoint backed by a PostgreSQL RateLimitBucket table. Daily quota cap on AI generation.",
    tag: "Production",
    color: "bg-red-50 text-red-700 border-red-200",
  },
  {
    title: "Audit Logging",
    desc: "Every significant action (upload, insight, rename, delete) writes an immutable AuditLog row with IP, user-agent, and entity reference.",
    tag: "Observability",
    color: "bg-cyan-50 text-cyan-700 border-cyan-200",
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
    <div className="min-h-screen bg-white text-slate-900">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-lg font-bold tracking-tight">
            Insight<span className="text-indigo-600">Stack</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/demo" className="text-sm font-medium text-slate-600 hover:text-slate-900">
              Demo
            </Link>
            <Link
              href="/login"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
            >
              Open App
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="border-b border-slate-100 bg-slate-50 px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <span className="mb-3 inline-block rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-indigo-600">
            Portfolio Project
          </span>
          <h1 className="mt-3 text-4xl font-bold leading-tight text-slate-900">
            About InsightStack
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-slate-500">
            A production-style full-stack application demonstrating authentication,
            data ingestion, analytics, and AI integration — built to the standard
            I hold myself to in a professional environment.
          </p>
        </div>
      </section>

      {/* What I built */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-2 text-2xl font-bold text-slate-900">What I built</h2>
          <p className="mb-10 text-slate-500">
            Six distinct systems, each designed and implemented independently.
          </p>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {built.map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
              >
                <span
                  className={`mb-3 inline-block rounded-full border px-2.5 py-0.5 text-xs font-semibold ${item.color}`}
                >
                  {item.tag}
                </span>
                <h3 className="mb-2 font-semibold text-slate-900">{item.title}</h3>
                <p className="text-sm leading-relaxed text-slate-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech stack */}
      <section className="border-y border-slate-100 bg-slate-50 px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-8 text-2xl font-bold text-slate-900">Tech stack</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {stack.map((s) => (
              <div
                key={s.name}
                className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3"
              >
                <span className="font-semibold text-slate-800">{s.name}</span>
                <span className="text-slate-400">·</span>
                <span className="text-sm text-slate-500">{s.role}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What I learned */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-8 text-2xl font-bold text-slate-900">What I learned</h2>
          <ul className="space-y-4">
            {learned.map((item, i) => (
              <li key={i} className="flex items-start gap-4">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
                  {i + 1}
                </span>
                <p className="pt-0.5 text-slate-600">{item}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-slate-100 bg-slate-50 px-6 py-12 text-center">
        <p className="text-slate-500">See it in action</p>
        <div className="mt-4 flex justify-center gap-3">
          <Link
            href="/demo"
            className="rounded-xl border border-slate-300 bg-white px-6 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            Demo walkthrough
          </Link>
          <Link
            href="/login"
            className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
          >
            Open the app →
          </Link>
        </div>
      </section>
    </div>
  );
}
