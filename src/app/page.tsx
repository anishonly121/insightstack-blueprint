import Link from "next/link";

// ── Inline SVG icons (no extra deps) ──────────────────────────────────────────

function UploadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
    </svg>
  );
}

function SparkleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
    </svg>
  );
}

function ChartBarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  );
}

function ShieldCheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
    </svg>
  );
}

// ── Mock dashboard preview (no interactivity, pure CSS) ─────────────────────

function DashboardPreview() {
  const bars = [42, 68, 54, 82, 71, 90, 63, 78];
  return (
    <div className="pointer-events-none select-none overflow-hidden rounded-xl border border-white/10 shadow-[0_32px_80px_-12px_rgba(0,0,0,0.6)] ring-1 ring-white/5">
      {/* Browser chrome */}
      <div className="flex items-center gap-3 bg-[#1e2433] px-4 py-3">
        <div className="flex gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
          <div className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
          <div className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
        </div>
        <div className="ml-1 flex-1 rounded-md bg-slate-700/70 px-3 py-1 text-left text-[11px] text-slate-400">
          insightstack-peach.vercel.app/dashboard
        </div>
      </div>

      {/* App chrome */}
      <div className="bg-slate-100 p-4">
        {/* Top bar */}
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-[9px] font-extrabold uppercase tracking-[0.15em] text-indigo-600">InsightStack</p>
            <p className="text-sm font-bold text-slate-900">Welcome back, Jane</p>
            <p className="text-[10px] text-slate-400">jane@example.com</p>
          </div>
          <span className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[9px] font-semibold text-slate-600 shadow-sm">
            Logout
          </span>
        </div>

        {/* Stats row */}
        <div className="mb-3 grid grid-cols-4 gap-2">
          {[
            { label: "Datasets", value: "3" },
            { label: "Parsed", value: "3", color: "text-emerald-600" },
            { label: "Total Rows", value: "248" },
            { label: "Failed", value: "0", color: "text-red-500" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
              <p className="mb-0.5 text-[8px] font-semibold uppercase tracking-wide text-slate-400">
                {s.label}
              </p>
              <p className={`text-base font-bold ${s.color ?? "text-slate-900"}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Main area */}
        <div className="grid grid-cols-5 gap-2">
          {/* Dataset list */}
          <div className="col-span-3 rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-3 py-2">
              <p className="text-[11px] font-semibold text-slate-900">Your Datasets</p>
            </div>
            <div className="divide-y divide-slate-50 px-2 py-1">
              {[
                { name: "Jan 2026 Expenses", rows: 87 },
                { name: "Feb 2026 Expenses", rows: 94 },
                { name: "Mar 2026 Expenses", rows: 67 },
              ].map((d) => (
                <div key={d.name} className="flex items-center justify-between py-1.5">
                  <div>
                    <p className="text-[11px] font-semibold text-slate-800">{d.name}</p>
                    <p className="text-[9px] text-slate-400">{d.rows} rows</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="rounded-full bg-emerald-50 px-1.5 py-0.5 text-[8px] font-bold text-emerald-700">
                      PARSED
                    </span>
                    <div className="rounded bg-indigo-600 px-1.5 py-0.5 text-[8px] font-bold text-white">
                      Open →
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mini bar chart */}
          <div className="col-span-2 rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm">
            <p className="mb-2 text-[9px] font-semibold uppercase tracking-wide text-slate-400">
              Monthly Expenses
            </p>
            <div className="flex h-14 items-end gap-1">
              {bars.map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t-sm transition-all"
                  style={{
                    height: `${h}%`,
                    backgroundColor: i === bars.length - 1 ? "#6366f1" : "#e0e7ff",
                  }}
                />
              ))}
            </div>
            <div className="mt-1.5 flex justify-between">
              <span className="text-[8px] text-slate-400">Jan</span>
              <span className="text-[8px] font-semibold text-indigo-500">Aug</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Page data ─────────────────────────────────────────────────────────────────

const features = [
  {
    Icon: UploadIcon,
    iconBg: "bg-indigo-600",
    title: "CSV Upload Pipeline",
    description:
      "Import any bank or credit card export. PapaParse validates every row, reports rejected entries, and inserts accepted transactions atomically via Prisma.",
  },
  {
    Icon: SparkleIcon,
    iconBg: "bg-violet-600",
    title: "AI-Powered Insights",
    description:
      "GPT-4o-mini analyses PII-redacted transactions and returns structured JSON: top spending categories, anomaly detection, and three personalised recommendations.",
  },
  {
    Icon: ChartBarIcon,
    iconBg: "bg-emerald-600",
    title: "Visual Analytics",
    description:
      "Interactive pie charts, monthly income vs. expense bars, and a net savings trend line — all computed server-side and cached as MetricSnapshots for 1 hour.",
  },
  {
    Icon: ShieldCheckIcon,
    iconBg: "bg-sky-600",
    title: "Secure by Design",
    description:
      "JWT auth, bcrypt password hashing, CSRF protection, Zod schema validation, per-endpoint rate limiting, and PII scrubbing before any data reaches OpenAI.",
  },
];

const steps = [
  {
    number: "01",
    title: "Create an account",
    body: "Register with your email. Passwords are hashed with bcrypt — we never store plaintext credentials.",
  },
  {
    number: "02",
    title: "Upload a CSV",
    body: "Create a dataset, then upload any bank export with date, description, category, and amount columns. Every row is validated.",
  },
  {
    number: "03",
    title: "Get AI insights",
    body: "Click Generate Insights. OpenAI analyses your transactions and returns anomalies, top categories, and personalised recommendations.",
  },
];

const stats = [
  { value: "29", label: "Integration Tests" },
  { value: "30+", label: "API Endpoints" },
  { value: "6", label: "Core Systems" },
  { value: "GPT-4o", label: "AI Model" },
];

const stack = [
  "Next.js 16", "React 19", "TypeScript", "PostgreSQL",
  "Prisma 7", "OpenAI", "Zod", "Recharts", "Tailwind CSS", "SendGrid",
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-slate-900">

      {/* ── Nav ─────────────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <span className="text-lg font-bold tracking-tight text-slate-900">
            Insight<span className="text-indigo-600">Stack</span>
          </span>
          <div className="flex items-center gap-1">
            <Link
              href="/demo"
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
            >
              Demo
            </Link>
            <Link
              href="/about"
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
            >
              About
            </Link>
            <Link
              href="/login"
              className="ml-1 rounded-lg px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900 px-6 pb-0 pt-24 text-white">
        {/* Radial glow top-right */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_60%_0%,rgba(99,102,241,0.25),transparent)]" />
        {/* Dot grid */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "radial-gradient(circle, #a5b4fc 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />

        {/* Text content */}
        <div className="relative mx-auto max-w-4xl text-center">
          <span className="animate-slide-up inline-block rounded-full border border-indigo-400/30 bg-indigo-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-indigo-300">
            Full-Stack Portfolio Project · AI · Finance · Analytics
          </span>
          <h1 className="animate-slide-up delay-100 mt-5 text-5xl font-bold leading-tight tracking-tight sm:text-6xl">
            Turn your transactions into{" "}
            <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
              actionable insights
            </span>
          </h1>
          <p className="animate-slide-up delay-200 mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-300">
            Upload a CSV of your spending history. InsightStack parses it,
            visualises the patterns, and lets OpenAI generate personalised
            recommendations — all in under a minute.
          </p>
          <div className="animate-slide-up delay-300 mt-10 flex flex-wrap justify-center gap-4">
            <Link
              href="/register"
              className="rounded-xl bg-indigo-500 px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:bg-indigo-400 hover:shadow-indigo-400/40"
            >
              Start for free →
            </Link>
            <Link
              href="/demo"
              className="rounded-xl border border-white/20 bg-white/10 px-8 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
            >
              View demo
            </Link>
          </div>
        </div>

        {/* Mock dashboard preview */}
        <div className="animate-scale-in delay-500 relative mx-auto mt-16 max-w-4xl">
          <DashboardPreview />
          {/* Fade-out gradient at bottom so it bleeds into next section */}
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-slate-900 to-transparent" />
        </div>
      </section>

      {/* ── Stats strip ─────────────────────────────────────────────────────── */}
      <section className="border-b border-slate-200 bg-white px-6 py-12">
        <div className="mx-auto max-w-4xl">
          <p className="mb-8 text-center text-xs font-semibold uppercase tracking-widest text-slate-400">
            By the numbers
          </p>
          <div className="grid grid-cols-2 gap-6 text-center sm:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label}>
                <p className="text-4xl font-black text-indigo-600">{s.value}</p>
                <p className="mt-1 text-sm text-slate-500">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────────────────── */}
      <section className="bg-slate-50 px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-slate-900">
              Everything you need, nothing you don&apos;t
            </h2>
            <p className="mt-3 text-slate-500">
              Built with a production-ready stack and security-first principles.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => (
              <div
                key={f.title}
                className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
              >
                <div
                  className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl ${f.iconBg} text-white shadow-sm`}
                >
                  <f.Icon className="h-5 w-5" />
                </div>
                <h3 className="mb-2 font-semibold text-slate-900">{f.title}</h3>
                <p className="text-sm leading-relaxed text-slate-500">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ────────────────────────────────────────────────────── */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-slate-900">How it works</h2>
            <p className="mt-3 text-slate-500">Three steps from CSV to AI insight.</p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {steps.map((s, i) => (
              <div key={s.number} className="relative flex flex-col">
                {/* Connector line */}
                {i < steps.length - 1 && (
                  <div className="absolute left-[calc(50%+24px)] top-5 hidden h-0.5 w-[calc(100%-48px)] bg-gradient-to-r from-indigo-200 to-transparent md:block" />
                )}
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white shadow-md shadow-indigo-200">
                  {s.number}
                </div>
                <h3 className="mb-2 text-lg font-semibold text-slate-900">{s.title}</h3>
                <p className="text-sm leading-relaxed text-slate-500">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Tech stack ──────────────────────────────────────────────────────── */}
      <section className="border-y border-slate-100 bg-slate-50 px-6 py-14">
        <div className="mx-auto max-w-4xl text-center">
          <p className="mb-6 text-xs font-semibold uppercase tracking-widest text-slate-400">
            Built with
          </p>
          <div className="flex flex-wrap justify-center gap-2.5">
            {stack.map((tech) => (
              <span
                key={tech}
                className="rounded-full border border-slate-200 bg-white px-4 py-1.5 text-sm font-medium text-slate-700 shadow-sm transition hover:border-indigo-200 hover:text-indigo-700"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-indigo-600 px-6 py-20 text-center text-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(255,255,255,0.08),transparent)]" />
        <div className="relative">
          <h2 className="text-3xl font-bold">Ready to understand your spending?</h2>
          <p className="mt-3 text-indigo-200">Free to use. No credit card required.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/register"
              className="rounded-xl bg-white px-8 py-3.5 text-sm font-semibold text-indigo-700 shadow-lg transition hover:bg-indigo-50"
            >
              Create your account →
            </Link>
            <Link
              href="/about"
              className="rounded-xl border border-white/30 bg-white/10 px-8 py-3.5 text-sm font-semibold text-white transition hover:bg-white/20"
            >
              About the project
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <footer className="border-t border-slate-200 bg-white px-6 py-10">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div>
              <span className="text-base font-bold text-slate-900">
                Insight<span className="text-indigo-600">Stack</span>
              </span>
              <p className="mt-1 text-xs text-slate-400">
                AI-Powered Personal Finance Analytics
              </p>
            </div>
            <nav className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-500">
              <Link href="/demo" className="transition hover:text-slate-900">Demo</Link>
              <Link href="/about" className="transition hover:text-slate-900">About</Link>
              <Link href="/login" className="transition hover:text-slate-900">Login</Link>
              <Link href="/register" className="transition hover:text-slate-900">Register</Link>
              <a
                href="https://github.com/anishonly121/insightstack-blueprint"
                target="_blank"
                rel="noopener noreferrer"
                className="transition hover:text-slate-900"
              >
                GitHub ↗
              </a>
            </nav>
          </div>
          <p className="mt-6 border-t border-slate-100 pt-6 text-center text-xs text-slate-400">
            Built with Next.js · PostgreSQL · OpenAI · Deployed on Vercel
          </p>
        </div>
      </footer>

    </div>
  );
}
