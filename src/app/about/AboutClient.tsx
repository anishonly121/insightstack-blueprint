"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { LogoMark } from "@/components/LogoMark";

// ── Module-level constants ──────────────────────────────────────────────────

const STEP_DURATION_MS = 2800;

const PIPELINE = [
  {
    icon: "↑",
    label: "CSV Upload",
    sub: "Any bank or card export",
    detail: "PapaParse streams the file client-side, validates headers, and type-infers every column. Malformed rows are reported before a single row touches the database.",
    color: "#3B82F6",
    glow: "rgba(59,130,246,0.25)",
  },
  {
    icon: "✓",
    label: "Parse & Validate",
    sub: "Row-level integrity",
    detail: "Zod schemas validate date formats, decimal amounts, and category strings. Atomic Prisma transactions guarantee all-or-nothing insertion — partial imports are impossible.",
    color: "#10B981",
    glow: "rgba(16,185,129,0.25)",
  },
  {
    icon: "∑",
    label: "Compute Metrics",
    sub: "Server-side aggregation",
    detail: "Income, expenses, savings rate, category totals, and monthly breakdown are computed in one query. Results are cached as a MetricSnapshot with a 1-hour TTL.",
    color: "#06B6D4",
    glow: "rgba(6,182,212,0.25)",
  },
  {
    icon: "✦",
    label: "AI Analysis",
    sub: "GPT-4o-mini with guardrails",
    detail: "Transactions are PII-redacted (email, phone, NRIC), chunked to 50k chars, and sent with a structured prompt. Every response is Zod-validated before storage. Local fallback if OpenAI fails.",
    color: "#8B5CF6",
    glow: "rgba(139,92,246,0.25)",
  },
  {
    icon: "→",
    label: "Insight Ready",
    sub: "Plain-English recommendations",
    detail: "Anomalies, top categories, and three actionable recommendations returned as structured JSON and cached 24 hours per unique transaction fingerprint.",
    color: "#F59E0B",
    glow: "rgba(245,158,11,0.25)",
  },
];

const SECURITY_ITEMS = [
  { label: "bcrypt password hashing (cost 10)",       color: "text-blue-400"    },
  { label: "JWT with 7-day expiry",                   color: "text-blue-400"    },
  { label: "HttpOnly + Secure + SameSite cookies",    color: "text-blue-400"    },
  { label: "CSRF origin validation on mutations",     color: "text-emerald-400" },
  { label: "Per-IP rate limiting on auth endpoints",  color: "text-emerald-400" },
  { label: "Per-user daily AI quota (30/day)",        color: "text-emerald-400" },
  { label: "PII auto-redacted before AI processing",  color: "text-cyan-400"    },
  { label: "Zod schema validation on all inputs",     color: "text-cyan-400"    },
  { label: "Content-Security-Policy headers",         color: "text-violet-400"  },
  { label: "X-Frame-Options: DENY",                   color: "text-violet-400"  },
  { label: "X-Content-Type-Options: nosniff",         color: "text-violet-400"  },
  { label: "Strict-Transport-Security (HSTS)",        color: "text-violet-400"  },
];

const SYSTEMS = [
  { tag: "Security",      tagCls: "bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/20",       accent: "#3B82F6", title: "JWT Auth System",        desc: "Register, login, password reset via SendGrid, role-based access control. Bcrypt-hashed passwords, dual-auth via Bearer token and HttpOnly cookie." },
  { tag: "Data",          tagCls: "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20", accent: "#10B981", title: "CSV Ingestion Pipeline",  desc: "Upload any bank export. PapaParse validates every row, rejected rows are reported, accepted rows inserted atomically via Prisma transactions." },
  { tag: "Analytics",     tagCls: "bg-cyan-500/10 text-cyan-400 ring-1 ring-cyan-500/20",       accent: "#06B6D4", title: "Metrics Engine",          desc: "Server-side computation of income, expenses, savings rate, category totals, and monthly breakdown. Cached as MetricSnapshot with a 1-hour TTL." },
  { tag: "AI",            tagCls: "bg-violet-500/10 text-violet-400 ring-1 ring-violet-500/20", accent: "#8B5CF6", title: "AI Insights Pipeline",    desc: "Transactions are PII-redacted, chunked, and sent to GPT-4o-mini. Responses are Zod-validated. Fallback local analysis runs if OpenAI is unavailable." },
  { tag: "Production",    tagCls: "bg-red-500/10 text-red-400 ring-1 ring-red-500/20",          accent: "#EF4444", title: "Rate Limiting & Quotas",  desc: "Per-user and per-IP limits on every mutating endpoint, backed by a PostgreSQL RateLimitBucket table with serializable transactions." },
  { tag: "Observability", tagCls: "bg-orange-500/10 text-orange-400 ring-1 ring-orange-500/20", accent: "#F97316", title: "Audit Logging",           desc: "Every significant action writes an immutable AuditLog row with IP, user-agent, and entity reference. Structured JSON logging in production." },
];

const STACK = [
  { cat: "Framework",   items: ["Next.js 16", "React 19", "TypeScript 5"] },
  { cat: "Styling",     items: ["Tailwind CSS v4", "Recharts", "Framer-style CSS"] },
  { cat: "Backend",     items: ["Next.js Route Handlers", "Prisma 7", "Zod"] },
  { cat: "Database",    items: ["PostgreSQL (Neon)", "Prisma Migrations"] },
  { cat: "AI",          items: ["OpenAI GPT-4o-mini", "Structured prompts", "Local fallback"] },
  { cat: "Auth",        items: ["JWT", "bcrypt", "HttpOnly cookies"] },
  { cat: "Security",    items: ["CSRF", "Rate limiting", "CSP headers", "HSTS"] },
  { cat: "Email",       items: ["SendGrid", "Password reset flow"] },
  { cat: "Parsing",     items: ["PapaParse", "CSV streaming"] },
  { cat: "Testing",     items: ["29 integration tests", "Playwright E2E", "Node test runner"] },
  { cat: "CI/CD",       items: ["GitHub Actions", "Vercel", "Prisma migrate"] },
  { cat: "Monitoring",  items: ["Structured JSON logs", "Request IDs", "Audit trail"] },
];

const METRICS = [
  { value: 60,  suffix: "s",   label: "CSV to first AI insight",       color: "text-blue-400"    },
  { value: 29,  suffix: "",    label: "integration tests — zero mocks", color: "text-emerald-400" },
  { value: 30,  suffix: "+",   label: "typed API endpoints",            color: "text-violet-400"  },
  { value: 50,  suffix: "k",   label: "char prompt cap for cost control",color: "text-cyan-400"   },
  { value: 100, suffix: "%",   label: "TypeScript — strict mode",       color: "text-amber-400"   },
  { value: 24,  suffix: "hr",  label: "insight cache TTL per fingerprint", color: "text-red-400"  },
];

// ── Cursor spotlight ────────────────────────────────────────────────────────

function CursorSpotlight() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const move = (e: MouseEvent) => {
      if (ref.current)
        ref.current.style.background = `radial-gradient(700px circle at ${e.clientX}px ${e.clientY}px, rgba(59,130,246,0.04), transparent 50%)`;
    };
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, []);
  return <div ref={ref} className="pointer-events-none fixed inset-0 z-30 transition-none" />;
}

// ── Scroll reveal ───────────────────────────────────────────────────────────

function Reveal({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setTimeout(() => setOn(true), delay); obs.disconnect(); }
    }, { threshold: 0.07, rootMargin: "0px 0px -40px 0px" });
    obs.observe(el);
    return () => obs.disconnect();
  }, [delay]);
  return (
    <div ref={ref} className={className} style={{
      opacity: on ? 1 : 0,
      filter: on ? "blur(0px)" : "blur(6px)",
      transform: on ? "translateY(0)" : "translateY(18px)",
      transition: `opacity 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}ms, filter 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
    }}>
      {children}
    </div>
  );
}

// ── Count-up ────────────────────────────────────────────────────────────────

function CountUp({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      obs.disconnect();
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min((now - start) / 1600, 1);
        setCount(Math.round((1 - Math.pow(1 - t, 3)) * target));
        if (t < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, { threshold: 0.5 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [target]);
  return <span ref={ref}>{count}{suffix}</span>;
}

// ── 3D tilt card ────────────────────────────────────────────────────────────

function TiltCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const r = useRef<HTMLDivElement>(null);
  const onMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = r.current; if (!el) return;
    const b = el.getBoundingClientRect();
    el.style.setProperty("--rx", `${((-(e.clientY - b.top - b.height / 2) / b.height) * 7).toFixed(2)}deg`);
    el.style.setProperty("--ry", `${(((e.clientX - b.left - b.width / 2) / b.width) * 7).toFixed(2)}deg`);
  }, []);
  const onLeave = useCallback(() => {
    if (r.current) { r.current.style.setProperty("--rx", "0deg"); r.current.style.setProperty("--ry", "0deg"); }
  }, []);
  return <div ref={r} onMouseMove={onMove} onMouseLeave={onLeave} className={`tilt-card ${className}`}>{children}</div>;
}

// ── Pipeline demo ───────────────────────────────────────────────────────────

function PipelineDemo() {
  const [active, setActive] = useState(0);
  const [manualActive, setManualActive] = useState<number | null>(null);
  const displayActive = manualActive ?? active;

  useEffect(() => {
    const t = setInterval(() => {
      setActive(a => (a + 1) % PIPELINE.length);
      setManualActive(null);
    }, STEP_DURATION_MS);
    return () => clearInterval(t);
  }, []);

  const step = PIPELINE[displayActive];

  return (
    <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-[#030810]">
      {/* Step selector */}
      <div className="flex border-b border-white/[0.05]">
        {PIPELINE.map((s, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setManualActive(i)}
            className="flex flex-1 flex-col items-center gap-1.5 px-2 py-4 transition-all duration-300"
            style={{
              background: i === displayActive ? `${s.color}0F` : "transparent",
              borderBottom: i === displayActive ? `2px solid ${s.color}` : "2px solid transparent",
            }}
          >
            <span className="text-lg font-black" style={{ color: i === displayActive ? s.color : "#4B5563" }}>{s.icon}</span>
            <span className="hidden text-[10px] font-semibold sm:block" style={{ color: i === displayActive ? s.color : "#4B5563" }}>
              {s.label}
            </span>
          </button>
        ))}
      </div>

      {/* Detail panel */}
      <div className="p-6" key={displayActive} style={{ animation: "fadeIn 0.35s ease" }}>
        <div className="mb-2 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl text-lg font-black"
            style={{ background: `${step.color}18`, color: step.color, boxShadow: `0 0 20px ${step.glow}` }}>
            {step.icon}
          </span>
          <div>
            <p className="font-bold text-white">{step.label}</p>
            <p className="text-xs" style={{ color: step.color }}>{step.sub}</p>
          </div>
          <div className="ml-auto flex items-center gap-1.5 rounded-full px-3 py-1" style={{ background: `${step.color}18` }}>
            <span className="h-1.5 w-1.5 animate-pulse rounded-full" style={{ background: step.color }} />
            <span className="text-[10px] font-semibold" style={{ color: step.color }}>Step {displayActive + 1} / {PIPELINE.length}</span>
          </div>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-zinc-500">{step.detail}</p>
        {/* Progress bar */}
        <div className="mt-4 h-0.5 w-full overflow-hidden rounded-full bg-white/5">
          <div
            className="h-full rounded-full transition-none"
            style={{ background: step.color, width: manualActive !== null ? "100%" : "0%", animation: manualActive === null ? `progressBar ${STEP_DURATION_MS}ms linear forwards` : "none" }}
          />
        </div>
      </div>
    </div>
  );
}

// ── Security scan ───────────────────────────────────────────────────────────

function SecurityScan({ active }: { active: boolean }) {
  const [visible, setVisible] = useState(0);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    if (active && !scanning) setScanning(true);
  }, [active, scanning]);

  useEffect(() => {
    if (!scanning || visible >= SECURITY_ITEMS.length) return;
    const t = setTimeout(() => setVisible(v => v + 1), 100);
    return () => clearTimeout(t);
  }, [scanning, visible]);

  const rescan = () => { setVisible(0); };

  return (
    <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-[#030810] p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} className="h-4 w-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-bold text-white">Security scan</p>
            <p className="text-[10px] text-zinc-600">{visible} / {SECURITY_ITEMS.length} layers verified</p>
          </div>
        </div>
        {visible >= SECURITY_ITEMS.length && (
          <button type="button" onClick={rescan} className="rounded-lg border border-white/[0.06] px-3 py-1.5 text-[10px] font-semibold text-zinc-500 transition hover:text-white">
            Re-scan
          </button>
        )}
      </div>
      <div className="grid gap-1.5 sm:grid-cols-2">
        {SECURITY_ITEMS.map((item, i) => (
          <div
            key={i}
            className="flex items-center gap-2 rounded-lg px-3 py-2 transition-all duration-300"
            style={{
              opacity: visible > i ? 1 : 0,
              background: visible > i ? "rgba(255,255,255,0.02)" : "transparent",
              transform: visible > i ? "translateX(0)" : "translateX(-8px)",
              transition: "opacity 0.25s ease, transform 0.25s ease, background 0.25s ease",
            }}
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5} className={`h-3.5 w-3.5 shrink-0 ${item.color}`}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
            <span className="text-[11px] text-zinc-400">{item.label}</span>
          </div>
        ))}
      </div>
      {visible >= SECURITY_ITEMS.length && (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/8 px-4 py-2.5" style={{ animation: "fadeIn 0.4s ease" }}>
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          <span className="text-xs font-semibold text-emerald-400">All {SECURITY_ITEMS.length} security layers verified</span>
        </div>
      )}
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────────────────

export function AboutClient() {
  const securityRef = useRef<HTMLDivElement>(null);
  const [securityActive, setSecurityActive] = useState(false);

  useEffect(() => {
    const el = securityRef.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setSecurityActive(true); obs.disconnect(); }
    }, { threshold: 0.15 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-[#050B18] text-white">
      <CursorSpotlight />

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes progressBar { from { width: 0%; } to { width: 100%; } }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.05); }
        }
      `}</style>

      {/* ── Nav ─────────────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 border-b border-white/[0.05] bg-[#050B18]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2 text-[15px] font-bold tracking-tight text-white">
            <LogoMark size={24} />
            <span>Insight<span className="text-blue-400">Stack</span></span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/demo" className="text-sm font-medium text-zinc-500 transition hover:text-white">Demo</Link>
            <Link href="/#pricing" className="text-sm font-medium text-zinc-500 transition hover:text-white">Pricing</Link>
            <Link href="/register" className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-bold text-white shadow-[0_0_20px_rgba(59,130,246,0.3)] transition hover:bg-blue-400">
              Get started free
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden px-6 pb-24 pt-24">
        <div className="pointer-events-none absolute inset-0">
          <div style={{ position: "absolute", top: "-20%", left: "-5%", width: "80%", height: "90%", background: "radial-gradient(ellipse, rgba(59,130,246,0.10) 0%, transparent 65%)", filter: "blur(64px)" }} />
          <div style={{ position: "absolute", top: "5%", right: "-10%", width: "65%", height: "80%", background: "radial-gradient(ellipse, rgba(139,92,246,0.07) 0%, transparent 65%)", filter: "blur(64px)" }} />
        </div>
        <div className="pointer-events-none absolute inset-0 opacity-[0.015]" style={{ backgroundImage: "radial-gradient(rgba(255,255,255,1) 1px, transparent 1px)", backgroundSize: "28px 28px" }} />

        <div className="relative mx-auto max-w-4xl text-center">
          <Reveal>
            <div className="inline-flex items-center gap-2.5 rounded-full border border-blue-500/20 bg-blue-500/8 px-4 py-1.5 text-xs font-semibold text-blue-300">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-400" />
              Production-grade · AI-powered · Open source
            </div>
          </Reveal>

          <Reveal delay={80}>
            <h1 className="mt-7 text-5xl font-black leading-[1.06] tracking-[-0.025em] sm:text-6xl lg:text-7xl">
              Financial intelligence
              <br />
              <span style={{ background: "linear-gradient(135deg, #3B82F6 0%, #8B5CF6 45%, #06B6D4 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                that actually works.
              </span>
            </h1>
          </Reveal>

          <Reveal delay={160}>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-zinc-500">
              InsightStack is a full-stack financial analytics platform built to production standards —
              not a demo. Real auth, real caching, real tests, real AI. Upload a CSV and get
              AI-generated spending insights in under 60 seconds.
            </p>
          </Reveal>

          <Reveal delay={240}>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-xs">
              {[
                { label: "29 integration tests",       color: "text-blue-400",    bg: "bg-blue-500/8 border-blue-500/15"    },
                { label: "Zero mocks",                 color: "text-emerald-400", bg: "bg-emerald-500/8 border-emerald-500/15" },
                { label: "60s CSV to insight",         color: "text-violet-400",  bg: "bg-violet-500/8 border-violet-500/15" },
                { label: "100% TypeScript strict",     color: "text-cyan-400",    bg: "bg-cyan-500/8 border-cyan-500/15"    },
                { label: "12-layer security",          color: "text-amber-400",   bg: "bg-amber-500/8 border-amber-500/15"  },
              ].map(b => (
                <span key={b.label} className={`rounded-full border px-3 py-1.5 font-semibold ${b.color} ${b.bg}`}>{b.label}</span>
              ))}
            </div>
          </Reveal>

          <Reveal delay={320}>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/register" className="rounded-xl bg-blue-500 px-7 py-3 text-sm font-bold text-white shadow-[0_0_25px_rgba(59,130,246,0.35)] transition hover:bg-blue-400">
                Try it free →
              </Link>
              <Link href="/demo" className="rounded-xl border border-white/10 bg-white/5 px-7 py-3 text-sm font-semibold text-zinc-200 transition hover:border-white/20 hover:text-white">
                See live demo
              </Link>
              <a href="https://github.com/anishonly121/insightstack-blueprint" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-zinc-400 transition hover:text-white">
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" /></svg>
                View source
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Metrics bar ──────────────────────────────────────────────────────── */}
      <Reveal>
        <section className="border-y border-white/[0.04] bg-[#030810]/60 px-6 py-10">
          <div className="mx-auto max-w-5xl">
            <div className="grid grid-cols-2 gap-8 text-center sm:grid-cols-3 lg:grid-cols-6">
              {METRICS.map((m) => (
                <div key={m.label} className="group flex flex-col items-center">
                  <p className={`text-3xl font-black tabular-nums sm:text-4xl ${m.color} transition-all duration-500 group-hover:drop-shadow-[0_0_16px_currentColor]`}>
                    <CountUp target={m.value} suffix={m.suffix} />
                  </p>
                  <p className="mt-1.5 text-[11px] leading-tight text-zinc-600">{m.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </Reveal>

      {/* ── Pipeline ─────────────────────────────────────────────────────────── */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <Reveal className="mb-10">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-blue-500">Data pipeline</p>
            <h2 className="text-3xl font-black tracking-tight sm:text-4xl">
              From CSV to insight in 5 steps.
            </h2>
            <p className="mt-3 text-zinc-500">Click any step to explore the implementation detail.</p>
          </Reveal>
          <Reveal delay={80}>
            <PipelineDemo />
          </Reveal>
        </div>
      </section>

      {/* ── Platform systems ─────────────────────────────────────────────────── */}
      <section className="border-y border-white/[0.04] bg-[#030810]/30 px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <Reveal className="mb-10">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-blue-500">Architecture</p>
            <h2 className="text-3xl font-black tracking-tight sm:text-4xl">Six systems. One platform.</h2>
            <p className="mt-3 text-zinc-500">Each independently designed and production-hardened.</p>
          </Reveal>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SYSTEMS.map((s, i) => (
              <Reveal key={s.title} delay={i * 55}>
                <TiltCard className="group relative h-full overflow-hidden rounded-2xl border border-white/[0.06] bg-zinc-900 p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-white/[0.12] hover:shadow-[0_12px_40px_rgba(0,0,0,0.5)]">
                  <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                    style={{ background: `radial-gradient(ellipse at top left, ${s.accent}0C 0%, transparent 60%)` }} />
                  <span className={`relative mb-3 inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold ${s.tagCls}`}>{s.tag}</span>
                  <h3 className="relative mb-2 font-bold text-zinc-100">{s.title}</h3>
                  <p className="relative text-sm leading-relaxed text-zinc-500">{s.desc}</p>
                </TiltCard>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Security scan ────────────────────────────────────────────────────── */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <Reveal className="mb-10">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-blue-500">Security</p>
            <h2 className="text-3xl font-black tracking-tight sm:text-4xl">Security-first, by default.</h2>
            <p className="mt-3 text-zinc-500">Every layer hardened before the first line of feature code was written.</p>
          </Reveal>
          <div ref={securityRef}>
            <Reveal delay={80}>
              <SecurityScan active={securityActive} />
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── Tech stack ───────────────────────────────────────────────────────── */}
      <section className="border-y border-white/[0.04] bg-[#030810]/30 px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <Reveal className="mb-10">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-blue-500">Stack</p>
            <h2 className="text-3xl font-black tracking-tight sm:text-4xl">World-class open source.</h2>
            <p className="mt-3 text-zinc-500">Every dependency is a deliberate choice.</p>
          </Reveal>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {STACK.map((group, i) => (
              <Reveal key={group.cat} delay={i * 40}>
                <div className="group flex items-start gap-3 rounded-xl border border-white/[0.05] bg-[#0A1628]/60 p-4 transition-all duration-300 hover:border-blue-500/20 hover:bg-[#0A1628]">
                  <p className="w-24 shrink-0 text-[10px] font-bold uppercase tracking-widest text-zinc-700 transition group-hover:text-blue-500">{group.cat}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {group.items.map(item => (
                      <span key={item} className="rounded-full border border-white/[0.06] bg-white/[0.03] px-2 py-0.5 text-[11px] text-zinc-400 transition group-hover:border-white/[0.10] group-hover:text-zinc-300">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Engineering decisions ────────────────────────────────────────────── */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <Reveal className="mb-10">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-blue-500">Engineering</p>
            <h2 className="text-3xl font-black tracking-tight sm:text-4xl">Decisions that matter.</h2>
            <p className="mt-3 text-zinc-500">Intentional choices at every layer — and the reasoning behind them.</p>
          </Reveal>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              {
                n: "01",
                decision: "Prisma driver adapter over a connection pooler",
                reason: "Direct SSL control per environment via @prisma/adapter-pg — no certificate failures between local, CI, and Neon. Connection pooling is handled at the driver layer, not proxied through a third service.",
              },
              {
                n: "02",
                decision: "Connection string SSL detection over NODE_ENV",
                reason: "NODE_ENV is 'production' in CI too, making it an unreliable signal. Checking the connection string hostname for 'localhost' is the precise signal — it's either a local socket or it isn't.",
              },
              {
                n: "03",
                decision: "Zod validation on every AI response",
                reason: "GPT-4o-mini returns freeform JSON. Schema-validating every response means a malformed reply triggers the local fallback instantly — no runtime crashes surface to the user.",
              },
              {
                n: "04",
                decision: "MetricSnapshot caching at the database layer",
                reason: "Aggregation queries run once per hour per dataset, not on every page load. This keeps response times fast and OpenAI API costs predictable regardless of traffic spikes.",
              },
            ].map((d, i) => (
              <Reveal key={d.n} delay={i * 60}>
                <TiltCard className="group h-full rounded-2xl border border-white/[0.06] bg-[#0A1628] p-6 transition-all duration-300 hover:border-white/[0.12]">
                  <p className="mb-3 font-mono text-2xl font-black text-white/[0.08] transition group-hover:text-blue-500/20">{d.n}</p>
                  <h3 className="mb-2 font-bold text-zinc-100">{d.decision}</h3>
                  <p className="text-sm leading-relaxed text-zinc-500">{d.reason}</p>
                </TiltCard>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Open source CTA ──────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-t border-white/[0.04] px-6 py-24 text-center">
        <div className="pointer-events-none absolute inset-0">
          <div style={{ position: "absolute", top: "10%", left: "15%", width: "70%", height: "80%", background: "radial-gradient(ellipse, rgba(59,130,246,0.07) 0%, transparent 65%)", filter: "blur(64px)" }} />
        </div>
        <div className="relative mx-auto max-w-2xl">
          <Reveal>
            <div className="mb-6 inline-flex items-center gap-2.5 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-zinc-300">
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" /></svg>
              Fully open source on GitHub
            </div>
            <h2 className="text-4xl font-black leading-tight tracking-tight sm:text-5xl">
              See every line.<br />
              <span style={{ background: "linear-gradient(135deg, #3B82F6, #8B5CF6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                Run it yourself.
              </span>
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-zinc-500">
              The full source — every API route, migration, test, and CI config — is public on GitHub.
              Clone it, audit it, deploy it.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <a href="https://github.com/anishonly121/insightstack-blueprint" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-xl bg-white/10 px-8 py-3.5 text-sm font-bold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] transition hover:bg-white/15">
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" /></svg>
                View on GitHub ↗
              </a>
              <Link href="/register" className="rounded-xl bg-blue-500 px-8 py-3.5 text-sm font-bold text-white shadow-[0_0_25px_rgba(59,130,246,0.35)] transition hover:bg-blue-400">
                Start for free →
              </Link>
            </div>
            <p className="mt-5 text-xs text-zinc-700">
              MIT licensed · No credit card required · Deploy to Vercel in one click
            </p>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
