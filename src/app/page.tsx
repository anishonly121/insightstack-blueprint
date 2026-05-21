import Link from "next/link";

const features = [
  {
    icon: "📤",
    title: "Upload CSV",
    description:
      "Import your bank or credit card statement in seconds. We parse and validate every row, storing transactions linked to your account.",
  },
  {
    icon: "🤖",
    title: "AI-Powered Insights",
    description:
      "OpenAI analyses your spending patterns and returns a structured report: top categories, anomalies, and three personalised recommendations.",
  },
  {
    icon: "📊",
    title: "Visual Dashboard",
    description:
      "Interactive pie charts, monthly trend lines, and a searchable transaction table give you a full picture of your finances at a glance.",
  },
  {
    icon: "🔒",
    title: "Secure by Design",
    description:
      "JWT authentication, bcrypt password hashing, CSRF protection, Zod validation, PII redaction before any data reaches the AI.",
  },
];

const steps = [
  { number: "01", title: "Create an account", body: "Register with your email. Passwords are hashed with bcrypt — we never store plaintext credentials." },
  { number: "02", title: "Upload a CSV", body: "Create a dataset, then upload a CSV with date, description, category, and amount columns. We validate every row." },
  { number: "03", title: "Get AI insights", body: "Click Generate Insights. OpenAI analyses your transactions and returns anomalies, top categories, and recommendations." },
];

const stack = [
  "Next.js 16", "React 19", "TypeScript", "PostgreSQL", "Prisma 7",
  "OpenAI", "Zod", "Recharts", "Tailwind CSS", "SendGrid",
];

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <span className="text-lg font-bold tracking-tight text-slate-900">
            Insight<span className="text-indigo-600">Stack</span>
          </span>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 px-6 py-28 text-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-500/20 via-transparent to-transparent" />
        <div className="relative mx-auto max-w-4xl text-center">
          <span className="mb-4 inline-block rounded-full border border-indigo-400/40 bg-indigo-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-indigo-300">
            AI · Finance · Analytics
          </span>
          <h1 className="mt-4 text-5xl font-bold leading-tight tracking-tight sm:text-6xl">
            Turn your transactions into{" "}
            <span className="text-indigo-400">actionable insights</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-300">
            Upload a CSV of your spending history. InsightStack parses it,
            visualises the patterns, and lets OpenAI generate personalised
            recommendations — all in under a minute.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              href="/register"
              className="rounded-xl bg-indigo-500 px-7 py-3.5 text-sm font-semibold text-white shadow-lg transition hover:bg-indigo-400"
            >
              Start for free →
            </Link>
            <Link
              href="/demo"
              className="rounded-xl border border-white/20 bg-white/10 px-7 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
            >
              View demo
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-slate-50 px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-slate-900">Everything you need, nothing you don't</h2>
            <p className="mt-3 text-slate-500">
              Built with a production-ready tech stack and security-first principles.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md"
              >
                <div className="mb-4 text-3xl">{f.icon}</div>
                <h3 className="mb-2 font-semibold text-slate-900">{f.title}</h3>
                <p className="text-sm leading-relaxed text-slate-500">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-slate-900">How it works</h2>
            <p className="mt-3 text-slate-500">Three steps from CSV to AI insight.</p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {steps.map((s) => (
              <div key={s.number} className="flex flex-col">
                <span className="mb-3 text-4xl font-black text-indigo-100">{s.number}</span>
                <h3 className="mb-2 text-lg font-semibold text-slate-900">{s.title}</h3>
                <p className="text-sm leading-relaxed text-slate-500">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech stack */}
      <section className="bg-slate-50 px-6 py-16">
        <div className="mx-auto max-w-4xl text-center">
          <p className="mb-6 text-xs font-semibold uppercase tracking-widest text-slate-400">
            Built with
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {stack.map((tech) => (
              <span
                key={tech}
                className="rounded-full border border-slate-200 bg-white px-4 py-1.5 text-sm font-medium text-slate-700 shadow-sm"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-indigo-600 px-6 py-20 text-center text-white">
        <h2 className="text-3xl font-bold">Ready to understand your spending?</h2>
        <p className="mt-3 text-indigo-200">
          Free to use. No credit card required.
        </p>
        <Link
          href="/register"
          className="mt-8 inline-block rounded-xl bg-white px-8 py-3.5 text-sm font-semibold text-indigo-700 shadow-lg transition hover:bg-indigo-50"
        >
          Create your account →
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white px-6 py-8 text-center text-sm text-slate-400">
        <p>
          <span className="font-semibold text-slate-700">InsightStack</span> — AI-Powered Personal Finance Analytics
        </p>
        <p className="mt-1">
          Built with Next.js · PostgreSQL · OpenAI ·{" "}
          <Link href="/login" className="underline hover:text-slate-600">
            Login
          </Link>{" "}
          ·{" "}
          <Link href="/register" className="underline hover:text-slate-600">
            Register
          </Link>
        </p>
      </footer>
    </div>
  );
}
