"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { LogoMark } from "@/components/LogoMark";

// ── Module-level constants (React Compiler purity) ──────────────────────────

const TITLES = [
  "Full-Stack Software Engineer",
  "AI & Finance Enthusiast",
  "CapitaLand Digital Intern",
  "Building production-grade software",
];

const GIT_LOG = [
  { hash: "a3f9b2c", color: "#60A5FA", type: "feat",    msg: "CapitaLand internship — Digital & Technology, Commercial Management Solutions" },
  { hash: "8d4e1a0", color: "#A78BFA", type: "cert",    msg: "Mixpanel Strategic Growth Framework & Fundamentals certifications" },
  { hash: "7c2f3b9", color: "#34D399", type: "award",   msg: "2nd Place — SP Sustainability Hackathon (GreenLoop × E-COLLECT)" },
  { hash: "5e8a4c1", color: "#A78BFA", type: "feat",    msg: "InsightStack — production-grade AI finance platform, 29 integration tests" },
  { hash: "3b7d9f2", color: "#22D3EE", type: "feat",    msg: "IoT Alert Dashboard — Raspberry Pi + ThingSpeak + real-time SendGrid alerts" },
  { hash: "1a5c8e4", color: "#FBBF24", type: "intern",  msg: "Junior IT Administrator — United Overseas Bank (UOB)" },
  { hash: "9f2b6d3", color: "#60A5FA", type: "edu",     msg: "Singapore Polytechnic — Diploma in Information Technology" },
  { hash: "4e7a1c8", color: "#F87171", type: "lead",    msg: "Elected Head Prefect — St. Patrick's School" },
  { hash: "2d9f5b7", color: "#34D399", type: "sport",   msg: "NSG Cricket — Top 3 nationally across National School Games" },
  { hash: "0a1c4e6", color: "#A78BFA", type: "init",    msg: "Shipped first app at 15 — Pomodoro timer for GCE O-level revision" },
];

const PROJECTS = [
  {
    name: "InsightStack",
    tagline: "AI-powered financial analytics platform",
    desc: "Production-grade full-stack app built solo. JWT auth, bcrypt, CSRF, per-endpoint rate limiting, OpenAI GPT-4o with PII redaction, server-side MetricSnapshot caching, 29 integration tests, Playwright E2E — zero mocks.",
    tech: ["Next.js 16", "TypeScript", "PostgreSQL", "OpenAI", "Prisma", "Zod", "Tailwind"],
    live: "https://insightstack-peach.vercel.app",
    github: "https://github.com/anishonly121/insightstack-blueprint",
    gradient: "from-blue-500/15 via-violet-500/8 to-transparent",
    accent: "#3B82F6",
    badge: { label: "Live", cls: "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20" },
  },
  {
    name: "IoT Alert Dashboard",
    tagline: "Live sensor monitoring with automated alerts",
    desc: "End-to-end IoT pipeline: Raspberry Pi sensors → ThingSpeak → real-time Chart.js dashboard → SendGrid email alerts when readings breach thresholds. Cooldown prevents spam. Secrets isolated in Node.js/Express backend.",
    tech: ["JavaScript", "Node.js", "Express", "Chart.js", "SendGrid", "ThingSpeak", "Raspberry Pi"],
    live: "https://iot-dashboard-alerts.vercel.app",
    github: null,
    gradient: "from-cyan-500/15 via-emerald-500/8 to-transparent",
    accent: "#06B6D4",
    badge: { label: "Live", cls: "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20" },
  },
  {
    name: "School Mobile App",
    tagline: "Student-facing UI/UX design in Figma",
    desc: "High-fidelity Figma prototype centralising timetables, exam schedules, CCA updates, and announcements. Built from user research through wireframes to a polished, accessible interface grounded in real student needs.",
    tech: ["Figma", "Prototyping", "Wireframing", "User Research", "UX Design"],
    live: null,
    github: null,
    gradient: "from-violet-500/15 via-pink-500/8 to-transparent",
    accent: "#8B5CF6",
    badge: { label: "Design", cls: "bg-violet-500/10 text-violet-400 ring-1 ring-violet-500/20" },
  },
];

const SKILLS = [
  { category: "Languages",      color: "blue",    items: ["TypeScript", "JavaScript", "Python", "Java", "HTML/CSS"] },
  { category: "Frontend",       color: "violet",  items: ["React 19", "Next.js 16", "Tailwind CSS", "Chart.js", "Recharts"] },
  { category: "Backend & DB",   color: "emerald", items: ["Node.js", "Express", "PostgreSQL", "MySQL", "Prisma"] },
  { category: "AI & Analytics", color: "amber",   items: ["OpenAI GPT-4o", "Zod", "Mixpanel", "PapaParse", "ThingSpeak"] },
  { category: "Security",       color: "red",     items: ["JWT Auth", "bcrypt", "CSRF", "Rate Limiting", "PII Redaction"] },
  { category: "Tooling & Infra",color: "cyan",    items: ["Vercel", "Git", "GitHub Actions", "SendGrid", "Raspberry Pi", "Figma"] },
];

const BADGE_COLORS: Record<string, string> = {
  blue:    "border-blue-500/20 bg-blue-500/10 text-blue-300",
  violet:  "border-violet-500/20 bg-violet-500/10 text-violet-300",
  emerald: "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
  amber:   "border-amber-500/20 bg-amber-500/10 text-amber-300",
  red:     "border-red-500/20 bg-red-500/10 text-red-300",
  cyan:    "border-cyan-500/20 bg-cyan-500/10 text-cyan-300",
};

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

// ── Typing title ────────────────────────────────────────────────────────────

function TypingTitle() {
  const [idx, setIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused) {
      const t = setTimeout(() => { setPaused(false); setDeleting(true); }, 2200);
      return () => clearTimeout(t);
    }
    const current = TITLES[idx];
    if (!deleting) {
      if (charIdx < current.length) {
        const t = setTimeout(() => setCharIdx(c => c + 1), 50);
        return () => clearTimeout(t);
      } else {
        const t = setTimeout(() => setPaused(true), 0);
        return () => clearTimeout(t);
      }
    } else {
      if (charIdx > 0) {
        const t = setTimeout(() => setCharIdx(c => c - 1), 25);
        return () => clearTimeout(t);
      } else {
        const t = setTimeout(() => { setDeleting(false); setIdx(i => (i + 1) % TITLES.length); }, 0);
        return () => clearTimeout(t);
      }
    }
  }, [charIdx, deleting, paused, idx]);
  return (
    <span className="font-mono">
      <span className="text-blue-400">{TITLES[idx].slice(0, charIdx)}</span>
      <span className="animate-pulse text-blue-400">▌</span>
    </span>
  );
}

// ── Git terminal ────────────────────────────────────────────────────────────

function GitTerminal({ active }: { active: boolean }) {
  const [visible, setVisible] = useState(0);
  useEffect(() => {
    if (!active || visible >= GIT_LOG.length) return;
    const t = setTimeout(() => setVisible(v => v + 1), 240);
    return () => clearTimeout(t);
  }, [active, visible]);
  return (
    <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-[#020810] shadow-[0_20px_80px_rgba(0,0,0,0.7)]">
      <div className="flex items-center gap-2 border-b border-white/[0.05] bg-[#0A1628] px-5 py-3.5">
        <div className="flex gap-1.5">
          <div className="h-3 w-3 rounded-full bg-red-500/70" />
          <div className="h-3 w-3 rounded-full bg-yellow-500/70" />
          <div className="h-3 w-3 rounded-full bg-emerald-500/70" />
        </div>
        <span className="ml-2 font-mono text-[11px] text-[#8892A4]">anish@dev <span className="text-blue-400">~/career</span></span>
      </div>
      <div className="p-6 font-mono text-[12px] leading-[2]">
        <p className="mb-2 text-[#8892A4]">
          $ git log --oneline --author=<span className="text-emerald-400">&quot;Anish Bhole&quot;</span> --all
        </p>
        {GIT_LOG.slice(0, visible).map((entry, i) => (
          <div key={i} className="flex flex-wrap items-baseline gap-x-2" style={{ animation: "gitLineIn 0.25s ease forwards" }}>
            <span className="shrink-0 text-[#4B5563]">{entry.hash}</span>
            <span style={{ color: entry.color }} className="shrink-0 font-bold">{entry.type}:</span>
            <span className="text-zinc-300">{entry.msg}</span>
          </div>
        ))}
        {visible < GIT_LOG.length && <span className="animate-pulse text-blue-400">▌</span>}
        {visible >= GIT_LOG.length && (
          <p className="mt-2 text-[#8892A4]">$ <span className="animate-pulse text-blue-400">▌</span></p>
        )}
      </div>
    </div>
  );
}

// ── 3D tilt card ────────────────────────────────────────────────────────────

function TiltCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const r = useRef<HTMLDivElement>(null);
  const onMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = r.current; if (!el) return;
    const b = el.getBoundingClientRect();
    el.style.setProperty("--rx", `${((-(e.clientY - b.top - b.height / 2) / b.height) * 8).toFixed(2)}deg`);
    el.style.setProperty("--ry", `${(((e.clientX - b.left - b.width / 2) / b.width) * 8).toFixed(2)}deg`);
  }, []);
  const onLeave = useCallback(() => {
    if (r.current) { r.current.style.setProperty("--rx", "0deg"); r.current.style.setProperty("--ry", "0deg"); }
  }, []);
  return <div ref={r} onMouseMove={onMove} onMouseLeave={onLeave} className={`tilt-card ${className}`}>{children}</div>;
}

// ── Main component ──────────────────────────────────────────────────────────

export function AboutClient() {
  const [terminalActive, setTerminalActive] = useState(false);
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = terminalRef.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setTerminalActive(true); obs.disconnect(); }
    }, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-[#050B18] text-white">
      <CursorSpotlight />

      <style>{`
        @keyframes gitLineIn {
          from { opacity: 0; transform: translateX(-10px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes floatA {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50%       { transform: translateY(-7px) rotate(0.5deg); }
        }
        @keyframes floatB {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50%       { transform: translateY(-5px) rotate(-0.5deg); }
        }
        @keyframes floatC {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-8px); }
        }
        .float-a { animation: floatA 3.8s ease-in-out infinite; }
        .float-b { animation: floatB 4.2s ease-in-out infinite 0.6s; }
        .float-c { animation: floatC 3.4s ease-in-out infinite 1.1s; }
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
              Open App
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden px-6 pb-24 pt-20">
        <div className="pointer-events-none absolute inset-0">
          <div style={{ position: "absolute", top: "-25%", left: "-10%", width: "85%", height: "100%", background: "radial-gradient(ellipse, rgba(59,130,246,0.10) 0%, transparent 65%)", filter: "blur(64px)" }} />
          <div style={{ position: "absolute", top: "5%", right: "-10%", width: "65%", height: "80%", background: "radial-gradient(ellipse, rgba(139,92,246,0.08) 0%, transparent 65%)", filter: "blur(64px)" }} />
        </div>
        <div className="pointer-events-none absolute inset-0 opacity-[0.014]" style={{ backgroundImage: "radial-gradient(rgba(255,255,255,1) 1px, transparent 1px)", backgroundSize: "28px 28px" }} />

        <div className="relative mx-auto max-w-5xl">
          <div className="flex flex-col items-start gap-12 lg:flex-row lg:items-center lg:gap-20">

            {/* Left — identity */}
            <div className="flex-1">
              <Reveal>
                <div className="mb-5 inline-flex items-center gap-2.5 rounded-full border border-emerald-500/25 bg-emerald-500/8 px-4 py-1.5 text-xs font-semibold text-emerald-400">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                  Open to opportunities · Based in Singapore
                </div>
              </Reveal>

              <Reveal delay={80}>
                <h1 className="text-5xl font-black leading-[1.04] tracking-[-0.02em] text-white sm:text-6xl lg:text-7xl">
                  Anish<br />
                  <span style={{ background: "linear-gradient(135deg, #3B82F6 0%, #8B5CF6 50%, #06B6D4 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                    Bhole.
                  </span>
                </h1>
              </Reveal>

              <Reveal delay={160}>
                <div className="mt-4 min-h-[28px] text-lg text-zinc-400 sm:text-xl">
                  <TypingTitle />
                </div>
              </Reveal>

              <Reveal delay={240}>
                <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-zinc-500">
                  IT student at <span className="font-semibold text-zinc-300">Singapore Polytechnic</span>. Currently interning at{" "}
                  <span className="font-semibold text-zinc-300">CapitaLand</span> — one of Asia&apos;s largest real estate investment managers.
                  I build full-stack apps, AI pipelines, and IoT systems, and I ship them to production.
                </p>
              </Reveal>

              <Reveal delay={320}>
                <div className="mt-8 flex flex-wrap gap-3">
                  <a
                    href="mailto:bholeanish3@gmail.com"
                    className="rounded-xl bg-blue-500 px-6 py-2.5 text-sm font-bold text-white shadow-[0_0_24px_rgba(59,130,246,0.35)] transition hover:bg-blue-400 hover:shadow-[0_0_40px_rgba(59,130,246,0.5)]"
                  >
                    Get in touch →
                  </a>
                  <a
                    href="https://www.linkedin.com/in/anishbhole/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-semibold text-zinc-200 transition hover:border-blue-500/30 hover:text-blue-400"
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
                    LinkedIn
                  </a>
                  <a
                    href="https://github.com/anishonly121/insightstack-blueprint"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-semibold text-zinc-200 transition hover:border-white/20 hover:text-white"
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" /></svg>
                    GitHub
                  </a>
                </div>
              </Reveal>
            </div>

            {/* Right — floating stat cards */}
            <Reveal delay={200} className="w-full shrink-0 lg:w-72">
              <div className="flex flex-col gap-3">
                <div className="float-a rounded-2xl border border-white/[0.07] bg-[#0A1628] p-5 shadow-[0_12px_40px_rgba(0,0,0,0.5)]">
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">Current role</p>
                  <p className="font-bold text-white">Digital & Technology Intern</p>
                  <p className="text-sm text-blue-400">CapitaLand · Mar 2026</p>
                  <div className="mt-2 flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                    <span className="text-[10px] font-semibold text-emerald-400">Active</span>
                  </div>
                </div>
                <div className="float-b rounded-2xl border border-white/[0.07] bg-[#0A1628] p-5 shadow-[0_12px_40px_rgba(0,0,0,0.5)]">
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">Education</p>
                  <p className="font-bold text-white">Diploma in IT</p>
                  <p className="text-sm text-violet-400">Singapore Polytechnic</p>
                  <p className="mt-1 text-[10px] text-zinc-600">Apr 2024 – Mar 2027</p>
                </div>
                <div className="float-c rounded-2xl border border-white/[0.07] bg-[#0A1628] p-5 shadow-[0_12px_40px_rgba(0,0,0,0.5)]">
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">Latest award</p>
                  <p className="font-bold text-white">🥈 2nd Place</p>
                  <p className="text-sm text-amber-400">SP Sustainability Hackathon</p>
                  <p className="mt-1 text-[10px] text-zinc-600">Feb 2026 · Singapore Polytechnic</p>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── Quick stats bar ──────────────────────────────────────────────────── */}
      <Reveal>
        <section className="border-y border-white/[0.04] bg-[#030810]/60 px-6 py-8">
          <div className="mx-auto max-w-5xl">
            <div className="grid grid-cols-2 gap-6 text-center sm:grid-cols-4">
              {[
                { value: "2",    label: "Corporate internships",   color: "text-blue-400"    },
                { value: "3",    label: "Shipped projects",        color: "text-violet-400"  },
                { value: "Top 3",label: "NSG Cricket nationally",  color: "text-emerald-400" },
                { value: "2×",   label: "Mixpanel certified",      color: "text-amber-400"   },
              ].map((s) => (
                <div key={s.label} className="group">
                  <p className={`text-3xl font-black tabular-nums sm:text-4xl ${s.color} transition-all duration-500 group-hover:drop-shadow-[0_0_16px_currentColor]`}>{s.value}</p>
                  <p className="mt-1.5 text-xs text-zinc-600">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </Reveal>

      {/* ── Git log timeline ─────────────────────────────────────────────────── */}
      <section className="border-b border-white/[0.04] bg-[#030810]/30 px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <Reveal className="mb-10">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-blue-500">Timeline</p>
            <h2 className="text-2xl font-black text-white">The journey, as commits.</h2>
            <p className="mt-2 text-sm text-zinc-600">From first shipped app at 15 to production internships at Singapore&apos;s biggest companies.</p>
          </Reveal>
          <div ref={terminalRef}>
            <GitTerminal active={terminalActive} />
          </div>
        </div>
      </section>

      {/* ── Experience ──────────────────────────────────────────────────────── */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <Reveal className="mb-10">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-blue-500">Experience</p>
            <h2 className="text-2xl font-black text-white">Real-world, real stakes.</h2>
          </Reveal>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              {
                company: "CapitaLand",
                overview: "One of Asia's largest real estate investment managers. $100B+ AUM, operations across 40+ countries.",
                role: "Digital & Technology Intern",
                team: "Commercial Management Solutions",
                period: "Mar 2026 – Present · 3 months",
                location: "Singapore · On-site",
                gradient: "from-blue-500/10",
                border: "border-blue-500/15",
                pulse: "bg-blue-400",
                tags: ["Enterprise Systems", "Digital Technology", "Commercial Solutions"],
              },
              {
                company: "United Overseas Bank (UOB)",
                overview: "One of Singapore's three largest banks. 500+ branches across 19 countries in Asia Pacific.",
                role: "Junior IT Administrator (Intern)",
                team: "via Innovatiq Technologies Pte Ltd",
                period: "Aug – Oct 2024 · 3 months",
                location: "Singapore · On-site",
                gradient: "from-amber-500/10",
                border: "border-amber-500/15",
                pulse: "bg-amber-400",
                tags: ["Technical Support", "System Maintenance", "Network Operations", "Microsoft Excel"],
              },
            ].map((exp, i) => (
              <Reveal key={exp.company} delay={i * 80}>
                <TiltCard className={`relative h-full overflow-hidden rounded-2xl border ${exp.border} bg-[#0A1628] p-6`}>
                  <div className={`absolute inset-0 bg-gradient-to-br ${exp.gradient} to-transparent opacity-60`} />
                  <div className="relative">
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-black text-white">{exp.company}</h3>
                        <p className="mt-0.5 text-xs leading-relaxed text-zinc-600">{exp.overview}</p>
                      </div>
                      <span className={`mt-1 h-2.5 w-2.5 shrink-0 animate-pulse rounded-full ${exp.pulse}`} />
                    </div>
                    <p className="font-semibold text-zinc-100">{exp.role}</p>
                    <p className="text-sm text-zinc-500">{exp.team}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[11px] text-zinc-600">
                      <span>{exp.period}</span>
                      <span className="text-zinc-800">·</span>
                      <span>{exp.location}</span>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {exp.tags.map(t => (
                        <span key={t} className="rounded-full border border-white/[0.07] bg-white/[0.04] px-2.5 py-0.5 text-[10px] font-medium text-zinc-400">{t}</span>
                      ))}
                    </div>
                  </div>
                </TiltCard>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Projects ─────────────────────────────────────────────────────────── */}
      <section className="border-y border-white/[0.04] bg-[#030810]/30 px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <Reveal className="mb-10">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-blue-500">Projects</p>
            <h2 className="text-2xl font-black text-white">What I ship.</h2>
            <p className="mt-2 text-sm text-zinc-600">Full-stack, IoT, and design — across different domains and different constraints.</p>
          </Reveal>
          <div className="grid gap-4 lg:grid-cols-3">
            {PROJECTS.map((proj, i) => (
              <Reveal key={proj.name} delay={i * 80}>
                <TiltCard className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0A1628] p-6 transition-all duration-500 hover:border-white/[0.12] hover:shadow-[0_24px_80px_rgba(0,0,0,0.6)]">
                  <div className={`absolute inset-0 bg-gradient-to-br ${proj.gradient} opacity-0 transition-opacity duration-500 group-hover:opacity-100`} />
                  <div className="relative flex flex-1 flex-col">
                    <div className="mb-5 flex items-start justify-between">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04]">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5} className="h-5 w-5" style={{ color: proj.accent }}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
                        </svg>
                      </div>
                      <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${proj.badge.cls}`}>{proj.badge.label}</span>
                    </div>
                    <h3 className="mb-1 font-bold text-zinc-100">{proj.name}</h3>
                    <p className="mb-3 text-xs font-semibold" style={{ color: proj.accent }}>{proj.tagline}</p>
                    <p className="mb-5 flex-1 text-sm leading-relaxed text-zinc-500">{proj.desc}</p>
                    <div className="mb-5 flex flex-wrap gap-1.5">
                      {proj.tech.map(t => (
                        <span key={t} className="rounded-full border border-white/[0.07] bg-white/[0.03] px-2 py-0.5 text-[10px] font-medium text-zinc-500">{t}</span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      {proj.live && (
                        <a href={proj.live} target="_blank" rel="noopener noreferrer"
                          className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-zinc-300 transition hover:border-white/20 hover:text-white">
                          Live ↗
                        </a>
                      )}
                      {proj.github && (
                        <a href={proj.github} target="_blank" rel="noopener noreferrer"
                          className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-zinc-300 transition hover:border-white/20 hover:text-white">
                          Code ↗
                        </a>
                      )}
                    </div>
                  </div>
                </TiltCard>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Skills ───────────────────────────────────────────────────────────── */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <Reveal className="mb-10">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-blue-500">Skills</p>
            <h2 className="text-2xl font-black text-white">The toolbox.</h2>
          </Reveal>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SKILLS.map((group, i) => (
              <Reveal key={group.category} delay={i * 60}>
                <div className="group h-full rounded-2xl border border-white/[0.06] bg-[#0A1628] p-5 transition-all duration-300 hover:border-white/[0.10]">
                  <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-zinc-600">{group.category}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {group.items.map(item => (
                      <span
                        key={item}
                        className={`cursor-default rounded-full border px-2.5 py-1 text-[11px] font-medium transition duration-200 hover:-translate-y-0.5 hover:shadow-sm ${BADGE_COLORS[group.color]}`}
                      >
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

      {/* ── Awards & certs ───────────────────────────────────────────────────── */}
      <section className="border-y border-white/[0.04] bg-[#030810]/30 px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <Reveal className="mb-10">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-blue-500">Recognition</p>
            <h2 className="text-2xl font-black text-white">Awards & certifications.</h2>
          </Reveal>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              {
                icon: "🥈",
                title: "2nd Place",
                org: "SP Sustainability Hackathon",
                date: "Feb 2026",
                body: "GreenLoop × E-COLLECT — a QR-based reusable container system with gamified incentive mechanism for campus-wide waste reduction. Competed against multidisciplinary teams across the polytechnic.",
                border: "border-amber-500/20 bg-gradient-to-b from-amber-500/5",
              },
              {
                icon: "📊",
                title: "Mixpanel Certified",
                org: "Strategic Growth Framework",
                date: "May 2026",
                body: "Growth strategy, product-led growth principles, data-driven user acquisition, engagement, and retention. Issued by Mixpanel Customer Education.",
                border: "border-violet-500/20 bg-gradient-to-b from-violet-500/5",
              },
              {
                icon: "📈",
                title: "Mixpanel Certified",
                org: "Fundamentals Certification",
                date: "May 2026",
                body: "Event tracking, user behaviour analysis, funnel and retention reports, and extracting actionable insights from product analytics data.",
                border: "border-blue-500/20 bg-gradient-to-b from-blue-500/5",
              },
            ].map((a, i) => (
              <Reveal key={a.org} delay={i * 80}>
                <div className={`h-full rounded-2xl border ${a.border} to-[#0A1628] p-5`}>
                  <div className="mb-3 text-3xl">{a.icon}</div>
                  <p className="font-black text-white">{a.title}</p>
                  <p className="mb-3 text-sm font-semibold text-zinc-400">{a.org}</p>
                  <p className="mb-4 text-sm leading-relaxed text-zinc-600">{a.body}</p>
                  <p className="text-[10px] font-semibold text-zinc-700">{a.date}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Platform systems ─────────────────────────────────────────────────── */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <Reveal className="mb-10">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-blue-500">Platform</p>
            <h2 className="text-2xl font-black text-white">How InsightStack works.</h2>
            <p className="mt-2 text-sm text-zinc-600">Six distinct systems powering every InsightStack feature — each purpose-built for real production workloads.</p>
          </Reveal>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { tag: "Security",      tagCls: "bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/20",    accent: "#3B82F6", title: "JWT Auth System",         desc: "Register, login, password reset via email, role-based access. Passwords hashed with bcrypt, tokens signed with secure secrets, HttpOnly cookies." },
              { tag: "Data",          tagCls: "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20", accent: "#10B981", title: "CSV Ingestion Pipeline",  desc: "Upload any bank export. PapaParse validates every row, rejected rows are reported, accepted rows inserted atomically via Prisma transactions." },
              { tag: "Analytics",     tagCls: "bg-cyan-500/10 text-cyan-400 ring-1 ring-cyan-500/20",    accent: "#06B6D4", title: "Metrics Engine",          desc: "Server-side computation of income, expenses, savings rate, category totals, and monthly breakdown. Results cached as MetricSnapshot with a 1-hour TTL." },
              { tag: "AI",            tagCls: "bg-violet-500/10 text-violet-400 ring-1 ring-violet-500/20", accent: "#8B5CF6", title: "AI Insights Pipeline",    desc: "Transactions are PII-redacted, chunked to 50k chars, and sent to GPT-4o-mini. Responses are schema-validated with Zod. Local fallback if OpenAI fails." },
              { tag: "Production",    tagCls: "bg-red-500/10 text-red-400 ring-1 ring-red-500/20",       accent: "#EF4444", title: "Rate Limiting & Quotas",  desc: "Per-user, per-IP rate limits on every mutating endpoint backed by a PostgreSQL RateLimitBucket table. Daily quota cap on AI generation." },
              { tag: "Observability", tagCls: "bg-orange-500/10 text-orange-400 ring-1 ring-orange-500/20", accent: "#F97316", title: "Audit Logging",           desc: "Every significant action writes an immutable AuditLog row with IP, user-agent, and entity reference. Structured JSON logging in production." },
            ].map((item, i) => (
              <Reveal key={item.title} delay={i * 60}>
                <div className="group relative h-full overflow-hidden rounded-2xl border border-white/[0.06] bg-zinc-900 p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-white/[0.12] hover:shadow-[0_8px_40px_rgba(0,0,0,0.5)]">
                  <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                    style={{ background: `radial-gradient(ellipse at top left, ${item.accent}0A 0%, transparent 60%)` }} />
                  <span className={`relative mb-3 inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold ${item.tagCls}`}>{item.tag}</span>
                  <h3 className="relative mb-2 font-bold text-zinc-100">{item.title}</h3>
                  <p className="relative text-sm leading-relaxed text-zinc-500">{item.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Beyond the keyboard ──────────────────────────────────────────────── */}
      <section className="border-y border-white/[0.04] bg-[#030810]/30 px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <Reveal className="mb-10">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-blue-500">Character</p>
            <h2 className="text-2xl font-black text-white">Beyond the keyboard.</h2>
            <p className="mt-2 text-sm text-zinc-600">The experiences that shaped how I think, lead, and work under pressure.</p>
          </Reveal>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { emoji: "⭐", title: "Head Prefect", sub: "St. Patrick's School · Elected", body: "Led school-wide initiatives, represented 1,000+ students, and worked directly with staff on institutional decisions. Elected by peers — not appointed.", border: "border-amber-500/15" },
              { emoji: "🏏", title: "NSG Cricket — Top 3", sub: "National School Games · Multiple years", body: "Represented St. Patrick's at national level, consistently finishing top 3 in Singapore. Competing nationally demands discipline, composure, and team synchronisation under real pressure.", border: "border-blue-500/15" },
              { emoji: "🏉", title: "Rugby", sub: "Singapore Polytechnic", body: "SP Rugby demands physical resilience, precise communication, and the ability to trust your team when it matters. The same traits that make good engineering teams.", border: "border-emerald-500/15" },
              { emoji: "🤝", title: "Community Service", sub: "SP CSCC · Ongoing", body: "Singapore Polytechnic Community Service & Cultural Club. The best engineers build for people — staying connected to the community keeps that perspective grounded.", border: "border-violet-500/15" },
            ].map((item, i) => (
              <Reveal key={item.title} delay={i * 60}>
                <div className={`h-full rounded-2xl border ${item.border} bg-[#0A1628] p-5`}>
                  <div className="mb-3 text-2xl">{item.emoji}</div>
                  <p className="mb-0.5 font-bold text-zinc-100">{item.title}</p>
                  <p className="mb-3 text-[10px] font-semibold text-zinc-600">{item.sub}</p>
                  <p className="text-sm leading-relaxed text-zinc-600">{item.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Engineering principles ───────────────────────────────────────────── */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <Reveal className="mb-10">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-blue-500">Engineering</p>
            <h2 className="text-2xl font-black text-white">How it&apos;s built.</h2>
            <p className="mt-2 text-sm text-zinc-600">Intentional decisions at every layer of the stack.</p>
          </Reveal>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { decision: "Prisma driver adapter over connection pooler", reason: "Direct SSL control per environment via @prisma/adapter-pg — no cert failures between local, CI, and Neon. Connection pooling is handled at the driver layer, not proxied." },
              { decision: "URL-based SSL detection", reason: "NODE_ENV is 'production' in CI too, so branching on it gives false results. The connection string hostname is the reliable signal — localhost means no SSL, everything else does." },
              { decision: "Zod validation on every AI response", reason: "GPT-4o-mini returns freeform JSON. Schema-validating every response means a malformed reply triggers the local fallback instead of surfacing a runtime crash to the user." },
              { decision: "Metric caching at the database layer", reason: "MetricSnapshot rows carry a 1-hour TTL. Aggregation queries run once per hour per dataset — not on every page load — keeping response times fast and API costs predictable." },
            ].map((d, i) => (
              <Reveal key={d.decision} delay={i * 60}>
                <div className="rounded-2xl border border-white/[0.06] bg-[#0A1628] p-5 transition hover:border-white/[0.10]">
                  <h3 className="mb-2 font-bold text-zinc-100">{d.decision}</h3>
                  <p className="text-sm leading-relaxed text-zinc-500">{d.reason}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Connect ──────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-t border-white/[0.04] px-6 py-24 text-center">
        <div className="pointer-events-none absolute inset-0">
          <div style={{ position: "absolute", top: "10%", left: "15%", width: "70%", height: "80%", background: "radial-gradient(ellipse, rgba(59,130,246,0.08) 0%, transparent 65%)", filter: "blur(64px)" }} />
        </div>
        <div className="relative mx-auto max-w-xl">
          <Reveal>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-blue-500">Connect</p>
            <h2 className="text-3xl font-black text-white sm:text-4xl">Let&apos;s build something.</h2>
            <p className="mt-4 leading-relaxed text-zinc-500">
              Open to internships, graduate roles, and interesting problems.<br />
              Currently based in Singapore.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <a
                href="mailto:bholeanish3@gmail.com"
                className="rounded-xl bg-blue-500 px-8 py-3.5 text-sm font-bold text-white shadow-[0_0_25px_rgba(59,130,246,0.35)] transition hover:bg-blue-400 hover:shadow-[0_0_40px_rgba(59,130,246,0.55)]"
              >
                bholeanish3@gmail.com
              </a>
              <a
                href="https://www.linkedin.com/in/anishbhole/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-3.5 text-sm font-semibold text-zinc-200 transition hover:border-blue-500/30 hover:text-blue-400"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
                LinkedIn
              </a>
            </div>
            <p className="mt-6 text-xs text-zinc-700">
              English (full professional) · Hindi (professional working)
            </p>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
