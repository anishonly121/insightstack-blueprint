import Link from "next/link";
import { LogoMark } from "@/components/LogoMark";

const steps = [
  {
    n: "01",
    title: "Register & login",
    detail: "Create an account with email + password. Passwords are hashed with bcrypt. A JWT is issued and stored client-side for subsequent requests.",
    api: "POST /api/auth/register → POST /api/auth/login",
    color: "#3B82F6",
  },
  {
    n: "02",
    title: "Create a dataset",
    detail: "Name your dataset — e.g. 'Jan 2026 Expenses'. This creates a Dataset row in Postgres with status UPLOADED.",
    api: "POST /api/datasets",
    color: "#06B6D4",
  },
  {
    n: "03",
    title: "Upload a CSV",
    detail: "Upload a CSV with date, description, category, amount columns. The server parses every row, validates fields, and batch-inserts Transaction rows. Status advances to PARSED.",
    api: "POST /api/datasets/:id/upload",
    color: "#10B981",
  },
  {
    n: "04",
    title: "View metrics",
    detail: "The metrics endpoint aggregates income, expenses, net savings, savings rate, top categories, and monthly breakdown. Results are cached as a MetricSnapshot for 1 hour.",
    api: "GET /api/datasets/:id/metrics",
    color: "#8B5CF6",
  },
  {
    n: "05",
    title: "Generate AI insights",
    detail: "Up to 100 transactions are PII-redacted and sent to GPT-4o-mini. The response is schema-validated with Zod. If OpenAI fails, a local fallback analysis is generated and saved.",
    api: "POST /api/datasets/:id/insights",
    color: "#3B82F6",
  },
  {
    n: "06",
    title: "Read your insights",
    detail: "Structured output: summary text, top spending categories with reasons, anomaly transactions, and 3 personalised recommendations — all rendered as expandable cards.",
    api: "GET /api/datasets/:id/insights",
    color: "#06B6D4",
  },
];

const highlights = [
  { label: "PII Redaction", desc: "Emails, phone numbers, NRICs, and long digit strings are scrubbed from transaction descriptions before any data reaches OpenAI." },
  { label: "Graceful Fallback", desc: "If OpenAI is unavailable or returns malformed JSON, a local algorithm computes category totals and anomalies and saves them as the insight." },
  { label: "Daily Quota", desc: "Each user has a 30-insights-per-day cap enforced via AuditLog counting, preventing runaway API spend." },
  { label: "Cache Layer", desc: "Identical prompt hashes skip the OpenAI call entirely and return the cached insight. Metrics snapshots cache for 1 hour." },
  { label: "CSRF Protection", desc: "Cookie-authenticated requests require a matching CSRF header. Bearer token requests bypass this (standard SPA pattern)." },
  { label: "Audit Log", desc: "Every upload, insight generation, rename, and delete writes an immutable AuditLog row with IP and user-agent metadata." },
];

export default function DemoPage() {
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
            <Link href="/about" className="text-sm font-medium text-zinc-500 transition hover:text-white">About</Link>
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
          style={{ background: "radial-gradient(ellipse 50% 40% at 20% 0%, rgba(6,182,212,0.06) 0%, transparent 70%)" }}
        />
        <div className="relative mx-auto max-w-5xl">
          <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/8 px-3 py-1.5 text-xs font-semibold uppercase tracking-widest text-cyan-400">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
            Walkthrough
          </span>
          <h1 className="mt-4 text-4xl font-black leading-tight text-white sm:text-5xl">
            How InsightStack works
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-zinc-400">
            A step-by-step trace from CSV upload to AI-generated spending recommendations.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link
              href="/register"
              className="rounded-xl bg-blue-500 px-6 py-3 text-sm font-black text-white shadow-[0_0_25px_rgba(59,130,246,0.35)] transition hover:bg-blue-400"
            >
              Try it yourself →
            </Link>
            <Link
              href="/about"
              className="rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:border-white/20 hover:bg-white/8"
            >
              About the project
            </Link>
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-blue-500">Flow</p>
          <h2 className="mb-12 text-2xl font-black text-white">User flow</h2>
          <div className="space-y-0">
            {steps.map((step, i) => (
              <div key={step.n} className="flex gap-6">
                <div className="flex flex-col items-center">
                  <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-black text-white"
                    style={{ backgroundColor: step.color, boxShadow: `0 0 20px ${step.color}40` }}
                  >
                    {step.n}
                  </div>
                  {i < steps.length - 1 && (
                    <div className="mt-1 w-px flex-1 bg-gradient-to-b from-white/10 to-transparent" style={{ minHeight: "3rem" }} />
                  )}
                </div>
                <div className={`pb-10 ${i === steps.length - 1 ? "pb-0" : ""}`}>
                  <h3 className="font-bold text-zinc-100">{step.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-zinc-500">{step.detail}</p>
                  <code className="mt-2.5 inline-block rounded-lg border border-white/6 bg-zinc-900 px-3 py-1.5 text-xs font-mono text-blue-400">
                    {step.api}
                  </code>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Engineering highlights */}
      <section className="border-y border-white/5 bg-zinc-900/40 px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-blue-500">Engineering</p>
          <h2 className="mb-3 text-2xl font-black text-white">Engineering highlights</h2>
          <p className="mb-12 text-zinc-500">Production-grade details that are invisible when they work.</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {highlights.map((h) => (
              <div
                key={h.label}
                className="rounded-2xl border border-white/6 bg-zinc-900 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-500/20"
              >
                <h3 className="mb-2 font-bold text-blue-400">{h.label}</h3>
                <p className="text-sm leading-relaxed text-zinc-500">{h.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CSV format */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-blue-500">Format</p>
          <h2 className="mb-4 text-2xl font-black text-white">CSV format</h2>
          <p className="mb-7 text-zinc-500">Any bank or credit card export works. The parser expects four columns:</p>
          <pre className="overflow-x-auto rounded-2xl border border-white/6 bg-zinc-900 px-6 py-5 text-sm text-emerald-400 shadow-[0_0_0_1px_rgba(255,255,255,0.03)]">
{`date,description,category,amount
2026-01-02,McDonalds,Food,-9.50
2026-01-22,Salary,Income,1200.00
2026-01-25,Phone bill,Utilities,-25.00
2026-02-01,Netflix,Entertainment,-15.99`}
          </pre>
          <ul className="mt-5 space-y-1.5 text-sm text-zinc-600">
            <li><span className="font-bold text-zinc-300">date</span> — any parseable date string</li>
            <li><span className="font-bold text-zinc-300">description</span> — merchant or transaction label</li>
            <li><span className="font-bold text-zinc-300">category</span> — e.g. Food, Transport, Income, Utilities</li>
            <li><span className="font-bold text-zinc-300">amount</span> — negative for expenses, positive for income</li>
          </ul>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden border-t border-white/5 px-6 py-20 text-center">
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: "radial-gradient(ellipse 60% 60% at 50% 50%, rgba(59,130,246,0.05) 0%, transparent 70%)" }}
        />
        <div className="relative">
          <h2 className="text-2xl font-black text-white">Ready to see your own spending insights?</h2>
          <p className="mt-3 text-zinc-500">Upload a CSV and get AI analysis in under a minute.</p>
          <Link
            href="/register"
            className="mt-8 inline-block rounded-xl bg-blue-500 px-10 py-4 text-sm font-black text-white shadow-[0_0_30px_rgba(59,130,246,0.4)] transition hover:bg-blue-400 hover:shadow-[0_0_50px_rgba(59,130,246,0.6)]"
          >
            Get started for free →
          </Link>
        </div>
      </section>
    </div>
  );
}
