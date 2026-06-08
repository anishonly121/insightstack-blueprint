import type { Metadata } from "next";
import Link from "next/link";
import { LogoMark } from "@/components/LogoMark";

export const metadata: Metadata = {
  title: "Changelog — InsightStack",
  description: "What's new in InsightStack — every version, every improvement.",
};

type ChangeEntry = {
  type: "added" | "fixed" | "changed" | "security";
  text: string;
};

type Version = {
  version: string;
  date: string;
  summary: string;
  changes: ChangeEntry[];
};

const BADGE: Record<ChangeEntry["type"], { label: string; className: string }> = {
  added:    { label: "New",      className: "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20" },
  fixed:    { label: "Fixed",    className: "bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/20" },
  changed:  { label: "Changed",  className: "bg-violet-500/10 text-violet-400 ring-1 ring-violet-500/20" },
  security: { label: "Security", className: "bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20" },
};

const VERSIONS: Version[] = [
  {
    version: "2.2.0",
    date: "June 2026",
    summary: "Financial Health Score, spending forecast with 95% CI, Explainable AI panel, and z-score display on anomaly cards.",
    changes: [
      { type: "added",   text: "Financial Health Score (0–100) — composite of savings rate (45%), HHI concentration (20%), trend (15%), anomaly count (10%), deficit/surplus (10%); rendered as SVG ring on insight cards" },
      { type: "added",   text: "Spending forecast — OLS extrapolation to next month with RMSE-based 95% confidence interval (requires ≥3 months of data)" },
      { type: "added",   text: "Explainable AI panel — collapsible section on each insight showing every expert rule that fired, its severity, and confidence score" },
      { type: "added",   text: "Z-score badges on anomaly cards — surfaces the statistical deviation value (e.g. 3.2σ) for each flagged transaction" },
      { type: "added",   text: "Engine confidence displayed as a badge next to the model identifier on each insight card" },
      { type: "changed", text: "InsightPayload now stores forecast, healthScore, confidence, and findings in the DB alongside summary, categories, and recommendations" },
    ],
  },
  {
    version: "2.1.0",
    date: "June 2026",
    summary: "Replaced OpenAI with a custom-built FinanceAI engine — BM25 retrieval, linear regression, expert rules, and intent-based chat. Zero external AI dependency.",
    changes: [
      { type: "added",   text: "FinanceAI engine (src/lib/ai/) — multi-strategy AI built from scratch, no external API" },
      { type: "added",   text: "BM25 probabilistic retrieval — Elasticsearch-class algorithm over a 38-document financial knowledge base" },
      { type: "added",   text: "Linear regression trend detection — OLS slope over monthly expense data (increasing / decreasing / stable)" },
      { type: "added",   text: "Herfindahl-Hirschman Index — DOJ antitrust metric adapted for spending concentration" },
      { type: "added",   text: "Expert rule engine — 10 typed financial rules with confidence scores (deficit, savings rate, concentration, anomaly, trend)" },
      { type: "added",   text: "NLG composer — 3 summary templates selected by financial health profile; context-aware category and anomaly reasons" },
      { type: "added",   text: "Intent-based chat engine — keyword-scored intent detection with referential pronoun resolution" },
      { type: "changed", text: "insights/route.ts — swapped OpenAI fetch for generateInsights()" },
      { type: "changed", text: "insights/stream/route.ts — swapped OpenAI streaming for streamInsightSummary()" },
      { type: "changed", text: "chat/route.ts — swapped OpenAI streaming chat for streamChatAnswer()" },
      { type: "changed", text: "Removed OPENAI_API_KEY from env.ts and .env.example" },
      { type: "changed", text: "Model identifier in DB insight records changed from gpt-4o-mini to finance-ai-v1" },
    ],
  },
  {
    version: "2.0.0",
    date: "June 2026",
    summary: "Major UX overhaul — toast notifications, FAQ accordion, pricing toggle, drag-and-drop uploads, demo dataset, keyboard shortcuts, and full SEO setup.",
    changes: [
      { type: "added",    text: "Toast notification system with success/error/warning/info types, auto-dismiss, and stacking" },
      { type: "added",    text: "FAQ accordion on landing page and /pricing — CSS grid-template-rows animation, no max-height snapping" },
      { type: "added",    text: "Annual / monthly billing toggle on landing and /pricing — Pro plan $9/mo or $7/mo (billed $84/yr) with Save 20% badge" },
      { type: "added",    text: "Drag-and-drop CSV upload zone on every dashboard dataset card with live visual feedback" },
      { type: "added",    text: "One-click demo dataset loader in empty dashboard state — 47 transactions, built-in anomaly spike" },
      { type: "added",    text: "Keyboard shortcuts panel (press ?) — N focuses new dataset input, arrow keys paginate, Esc closes" },
      { type: "added",    text: "Sample CSV download button in landing page hero" },
      { type: "added",    text: "robots.txt and sitemap.xml via Next.js Metadata API" },
      { type: "added",    text: "Dataset search — server-side name filtering with 300ms debounce" },
      { type: "added",    text: "Dataset sort — Newest, Oldest, A→Z, Z→A via API query params" },
      { type: "added",    text: "Created timestamps on each dashboard dataset card" },
      { type: "added",    text: "Password strength meter on registration form (Weak / Good / Strong)" },
      { type: "added",    text: "Quick-stats pills on insight cards — top category, anomaly count, recommendation count" },
      { type: "added",    text: "JSON-LD structured data (schema.org/SoftwareApplication) in root layout" },
      { type: "added",    text: "Public /changelog page" },
      { type: "fixed",    text: "HSTS header — Strict-Transport-Security was claimed in the About page but missing from next.config.ts" },
      { type: "fixed",    text: "TiltCard relative positioning — production-grade feature cards had absolute overlays escaping card boundaries" },
      { type: "fixed",    text: "/pricing 'Coming soon' badge replaced with 'Most popular' to match landing page CTAs" },
    ],
  },
  {
    version: "1.5.0",
    date: "May 2026",
    summary: "Daily insight quota API, paginated activity log, and quota progress bar on dataset detail.",
    changes: [
      { type: "added",    text: "GET /api/auth/me/quota — returns insightsToday, quota, remaining for today's insight usage" },
      { type: "added",    text: "GET /api/activity with pagination (page + pageSize query params, Zod-validated)" },
      { type: "added",    text: "/dashboard/activity page — per-action icons/colors, relative timestamps, load-more pagination" },
      { type: "added",    text: "Quota progress bar on dataset detail — color transitions at 20+ and 30/30 usage" },
      { type: "fixed",    text: "React Compiler purity violation — Date.now() moved to module-level constant in RelativeTime" },
    ],
  },
  {
    version: "1.4.0",
    date: "May 2026",
    summary: "Error boundaries, account settings with password change and account deletion.",
    changes: [
      { type: "added",    text: "Global error boundary (error.tsx) — branded 500 page with Try again + error digest" },
      { type: "added",    text: "Dashboard error boundary — inline compact error card" },
      { type: "added",    text: "/dashboard/settings — change password and delete account with confirmation phrase" },
      { type: "added",    text: "PATCH /api/auth/me — change password (validates current password, writes audit log)" },
      { type: "added",    text: "DELETE /api/auth/me — delete account (cascades all data, clears cookie)" },
      { type: "fixed",    text: "2 ESLint errors — <a href='/#pricing'> replaced with Next.js <Link>" },
    ],
  },
  {
    version: "1.3.0",
    date: "May 2026",
    summary: "Playwright E2E suite, structured logging, SECURITY.md, Dependabot, and CI lint step.",
    changes: [
      { type: "added",    text: "8-test Playwright E2E suite — landing, auth, CSV upload, dataset detail navigation" },
      { type: "added",    text: "Structured JSON logger — JSON in production, human-readable in dev; replaces all console.*" },
      { type: "added",    text: "SECURITY.md — vulnerability reporting policy and security design overview" },
      { type: "added",    text: "Dependabot config — weekly npm + monthly GitHub Actions updates" },
      { type: "added",    text: "Architecture Mermaid diagram + Design Tradeoffs section in README" },
      { type: "added",    text: "CONTRIBUTING.md — local setup, test instructions, code style, PR process" },
      { type: "added",    text: "Lint step added to CI pipeline" },
    ],
  },
  {
    version: "1.2.0",
    date: "May 2026",
    summary: "Stripe billing, pricing page, budget tracker, data chat, shareable insights, and weekly digest.",
    changes: [
      { type: "added",    text: "Stripe subscription integration — checkout, billing portal, and webhook handler" },
      { type: "added",    text: "/pricing standalone page with Free and Pro plan comparison" },
      { type: "added",    text: "Budget tracker — set monthly limits per category, over-budget alerts" },
      { type: "added",    text: "Chat with your data — SSE streaming AI conversation grounded in your transactions" },
      { type: "added",    text: "Shareable insight links — public /share/[insightId] pages with CTA" },
      { type: "added",    text: "Weekly email digest via SendGrid (Vercel cron, Mondays 8am UTC)" },
      { type: "added",    text: "Dataset comparison page — side-by-side metrics and bar chart diff" },
      { type: "added",    text: "Streaming AI insight generation (SSE) with step-by-step progress panel" },
    ],
  },
  {
    version: "1.1.0",
    date: "April 2026",
    summary: "Production hardening — 29 integration tests, admin panel, rate limiting, audit logging, PII redaction.",
    changes: [
      { type: "added",    text: "29 integration tests with zero mocks — auth, datasets, upload, metrics, insights, rename, delete" },
      { type: "added",    text: "Admin panel — view all users and datasets; admin-scoped dataset deletion" },
      { type: "added",    text: "DB-backed rate limiting via RateLimitBucket table (no Redis)" },
      { type: "added",    text: "Immutable AuditLog — every sensitive action appended; quota enforced by counting rows" },
      { type: "added",    text: "PII redaction — strips email, phone, NRIC, long digit strings before AI processing" },
      { type: "added",    text: "MetricSnapshot caching — 1-hour TTL on dashboard analytics" },
      { type: "added",    text: "Data hash cache — identical transaction sets skip recomputation entirely" },
      { type: "security", text: "CSRF protection on all cookie-authenticated mutations" },
      { type: "security", text: "CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy headers" },
    ],
  },
  {
    version: "1.0.0",
    date: "March 2026",
    summary: "Initial production-ready release. Full auth pipeline, CSV ingestion, metrics, and AI insights.",
    changes: [
      { type: "added",    text: "JWT auth — register, login, logout, forgot password, reset password" },
      { type: "added",    text: "Dual auth transport — Bearer token + HttpOnly cookie simultaneously" },
      { type: "added",    text: "Dataset CRUD — create, list, rename, delete with Prisma cascade" },
      { type: "added",    text: "CSV upload and parsing via PapaParse — row-level validation, atomic insertion" },
      { type: "added",    text: "Server-side metrics computation — income, expenses, savings rate, top categories, monthly breakdown" },
      { type: "added",    text: "AI insights — structured output, Zod-typed, with data-hash caching" },
      { type: "added",    text: "Dashboard with Recharts — category pie, monthly bar, savings line chart" },
      { type: "added",    text: "Role-based access control — USER and ADMIN roles" },
      { type: "added",    text: "Deployment to Vercel + Neon PostgreSQL" },
    ],
  },
];

export default function ChangelogPage() {
  return (
    <div className="min-h-screen bg-[#050B18] text-white">
      <nav className="sticky top-0 z-50 border-b border-white/[0.05] bg-[#050B18]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2 text-[15px] font-bold tracking-tight text-white">
            <LogoMark size={24} />
            <span>Insight<span className="text-blue-400">Stack</span></span>
          </Link>
          <Link
            href="/register"
            className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-400"
          >
            Try free →
          </Link>
        </div>
      </nav>

      <main className="mx-auto max-w-3xl px-6 py-20">
        <div className="mb-16">
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-blue-400">History</p>
          <h1 className="text-4xl font-black tracking-tight text-white">Changelog</h1>
          <p className="mt-3 text-zinc-500">
            Every improvement to InsightStack, documented version by version.
          </p>
        </div>

        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-0 top-2 bottom-0 w-px bg-white/[0.05]" />

          <div className="space-y-16 pl-8">
            {VERSIONS.map((v) => (
              <div key={v.version} className="relative">
                {/* Timeline dot */}
                <div className="absolute -left-[33px] top-1.5 flex h-3 w-3 items-center justify-center rounded-full border border-white/20 bg-[#050B18]">
                  <div className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                </div>

                {/* Version header */}
                <div className="mb-5 flex flex-wrap items-baseline gap-3">
                  <span className="rounded-lg border border-blue-500/25 bg-blue-500/8 px-3 py-1 font-mono text-sm font-bold text-blue-400">
                    v{v.version}
                  </span>
                  <span className="text-xs text-zinc-600">{v.date}</span>
                </div>

                <p className="mb-5 text-sm leading-relaxed text-zinc-400">{v.summary}</p>

                {/* Changes */}
                <ul className="space-y-2.5">
                  {v.changes.map((c, i) => {
                    const badge = BADGE[c.type];
                    return (
                      <li key={i} className="flex items-start gap-3">
                        <span
                          className={`mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-widest ${badge.className}`}
                        >
                          {badge.label}
                        </span>
                        <span className="text-sm leading-relaxed text-zinc-400">{c.text}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-20 border-t border-white/[0.05] pt-10 text-center">
          <p className="mb-4 text-sm text-zinc-600">Built in public. Source available on GitHub.</p>
          <div className="flex flex-wrap items-center justify-center gap-3 text-sm">
            <a
              href="https://github.com/anishonly121/insightstack-blueprint"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-white/8 px-4 py-2 text-zinc-400 transition hover:border-white/15 hover:text-white"
            >
              View source →
            </a>
            <Link href="/demo" className="rounded-lg border border-white/8 px-4 py-2 text-zinc-400 transition hover:border-white/15 hover:text-white">
              See the demo →
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
