import Link from "next/link";

const steps = [
  {
    n: "01",
    title: "Register & login",
    detail:
      "Create an account with email + password. Passwords are hashed with bcrypt. A JWT is issued and stored client-side for subsequent requests.",
    api: "POST /api/auth/register → POST /api/auth/login",
  },
  {
    n: "02",
    title: "Create a dataset",
    detail:
      "Name your dataset — e.g. 'Jan 2026 Expenses'. This creates a Dataset row in Postgres with status UPLOADED.",
    api: "POST /api/datasets",
  },
  {
    n: "03",
    title: "Upload a CSV",
    detail:
      "Upload a CSV with date, description, category, amount columns. The server parses every row, validates fields, and batch-inserts Transaction rows. Status advances to PARSED.",
    api: "POST /api/datasets/:id/upload",
  },
  {
    n: "04",
    title: "View metrics",
    detail:
      "The metrics endpoint aggregates income, expenses, net savings, savings rate, top categories, and monthly breakdown. Results are cached as a MetricSnapshot for 1 hour.",
    api: "GET /api/datasets/:id/metrics",
  },
  {
    n: "05",
    title: "Generate AI insights",
    detail:
      "Up to 100 transactions are PII-redacted and sent to GPT-4o-mini. The response is schema-validated with Zod. If OpenAI fails, a local fallback analysis is generated and saved.",
    api: "POST /api/datasets/:id/insights",
  },
  {
    n: "06",
    title: "Read your insights",
    detail:
      "Structured output: summary text, top spending categories with reasons, anomaly transactions, and 3 personalised recommendations — all rendered as expandable cards.",
    api: "GET /api/datasets/:id/insights",
  },
];

const highlights = [
  {
    label: "PII Redaction",
    desc: "Emails, phone numbers, NRICs, and long digit strings are scrubbed from transaction descriptions before any data reaches OpenAI.",
  },
  {
    label: "Graceful Fallback",
    desc: "If OpenAI is unavailable or returns malformed JSON, a local algorithm computes category totals and anomalies and saves them as the insight.",
  },
  {
    label: "Daily Quota",
    desc: "Each user has a 30-insights-per-day cap enforced via AuditLog counting, preventing runaway API spend.",
  },
  {
    label: "Cache Layer",
    desc: "Identical prompt hashes skip the OpenAI call entirely and return the cached insight. Metrics snapshots cache for 1 hour.",
  },
  {
    label: "CSRF Protection",
    desc: "Cookie-authenticated requests require a matching CSRF header. Bearer token requests bypass this (standard SPA pattern).",
  },
  {
    label: "Audit Log",
    desc: "Every upload, insight generation, rename, and delete writes an immutable AuditLog row with IP and user-agent metadata.",
  },
];

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-lg font-bold tracking-tight">
            Insight<span className="text-indigo-600">Stack</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/about" className="text-sm font-medium text-slate-600 hover:text-slate-900">
              About
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
      <section className="border-b border-slate-100 bg-gradient-to-br from-slate-50 via-indigo-50/40 to-slate-50 px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <span className="mb-3 inline-block rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-indigo-600">
            Walkthrough
          </span>
          <h1 className="mt-3 text-4xl font-bold leading-tight text-slate-900">
            How InsightStack works
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-slate-500">
            A step-by-step trace from CSV upload to AI-generated spending recommendations.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/register"
              className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
            >
              Try it yourself →
            </Link>
            <Link
              href="/about"
              className="rounded-xl border border-slate-300 bg-white px-6 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              About the project
            </Link>
          </div>
        </div>
      </section>

      {/* Step-by-step */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-10 text-2xl font-bold text-slate-900">User flow</h2>
          <div className="relative space-y-0">
            {steps.map((step, i) => (
              <div key={step.n} className="flex gap-6">
                {/* Timeline */}
                <div className="flex flex-col items-center">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white shadow">
                    {step.n}
                  </div>
                  {i < steps.length - 1 && (
                    <div className="mt-1 w-0.5 flex-1 bg-indigo-100" style={{ minHeight: "3rem" }} />
                  )}
                </div>
                {/* Content */}
                <div className={`pb-10 ${i === steps.length - 1 ? "pb-0" : ""}`}>
                  <h3 className="font-semibold text-slate-900">{step.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-slate-500">{step.detail}</p>
                  <code className="mt-2 inline-block rounded-md bg-slate-100 px-2.5 py-1 text-xs font-mono text-slate-600">
                    {step.api}
                  </code>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Engineering highlights */}
      <section className="border-y border-slate-100 bg-slate-50 px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-2 text-2xl font-bold text-slate-900">
            Engineering highlights
          </h2>
          <p className="mb-10 text-slate-500">
            Production-grade details that are invisible when they work.
          </p>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {highlights.map((h) => (
              <div
                key={h.label}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
              >
                <h3 className="mb-2 font-semibold text-indigo-700">{h.label}</h3>
                <p className="text-sm leading-relaxed text-slate-500">{h.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CSV format */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-4 text-2xl font-bold text-slate-900">CSV format</h2>
          <p className="mb-6 text-slate-500">
            Any bank or credit card export works. The parser expects four columns:
          </p>
          <pre className="overflow-x-auto rounded-2xl bg-slate-900 px-6 py-5 text-sm text-emerald-300">
{`date,description,category,amount
2026-01-02,McDonalds,Food,-9.50
2026-01-22,Salary,Income,1200.00
2026-01-25,Phone bill,Utilities,-25.00
2026-02-01,Netflix,Entertainment,-15.99`}
          </pre>
          <ul className="mt-4 space-y-1 text-sm text-slate-500">
            <li><span className="font-semibold text-slate-700">date</span> — any parseable date string</li>
            <li><span className="font-semibold text-slate-700">description</span> — merchant or transaction label</li>
            <li><span className="font-semibold text-slate-700">category</span> — e.g. Food, Transport, Income, Utilities</li>
            <li><span className="font-semibold text-slate-700">amount</span> — negative for expenses, positive for income</li>
          </ul>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-slate-100 bg-indigo-600 px-6 py-14 text-center text-white">
        <h2 className="text-2xl font-bold">Ready to see your own spending insights?</h2>
        <p className="mt-2 text-indigo-200">
          Upload a CSV and get AI analysis in under a minute.
        </p>
        <Link
          href="/register"
          className="mt-6 inline-block rounded-xl bg-white px-8 py-3 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-50"
        >
          Get started for free →
        </Link>
      </section>
    </div>
  );
}
