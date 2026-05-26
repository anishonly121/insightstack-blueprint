"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useCallback } from "react";
import { LogoMark } from "@/components/LogoMark";

// ── Custom cursor ──────────────────────────────────────────────────────────────
function CustomCursor() {
  const dot  = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mx = -100, my = -100, rx = -100, ry = -100;
    let hover = false;
    let raf: number;

    const onMove = (e: MouseEvent) => { mx = e.clientX; my = e.clientY; };

    const onOver = (e: MouseEvent) => {
      hover = !!(e.target as Element).closest("a,button,[role=button]");
    };

    const tick = () => {
      rx += (mx - rx) * 0.11;
      ry += (my - ry) * 0.11;
      if (dot.current) {
        dot.current.style.transform = `translate(${mx - 4}px,${my - 4}px)`;
        dot.current.style.opacity   = hover ? "0" : "1";
      }
      if (ring.current) {
        ring.current.style.transform = `translate(${rx - 16}px,${ry - 16}px)`;
        ring.current.style.width  = hover ? "40px" : "32px";
        ring.current.style.height = hover ? "40px" : "32px";
        ring.current.style.borderColor = hover ? "rgba(96,165,250,0.7)" : "rgba(96,165,250,0.35)";
      }
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener("mousemove", onMove);
    document.addEventListener("mouseover", onOver);
    raf = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseover", onOver);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <>
      <div ref={dot}  className="pointer-events-none fixed left-0 top-0 z-[999] h-2 w-2 rounded-full bg-blue-400 transition-opacity duration-150" />
      <div ref={ring} className="pointer-events-none fixed left-0 top-0 z-[998] rounded-full border transition-[width,height,border-color] duration-200" style={{ width: 32, height: 32 }} />
    </>
  );
}

// ── Cursor spotlight ───────────────────────────────────────────────────────────
function CursorSpotlight() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const move = (e: MouseEvent) => {
      if (ref.current)
        ref.current.style.background = `radial-gradient(600px circle at ${e.clientX}px ${e.clientY}px, rgba(59,130,246,0.05), transparent 50%)`;
    };
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, []);
  return <div ref={ref} className="pointer-events-none fixed inset-0 z-30 transition-none" />;
}

// ── Magnetic wrapper ───────────────────────────────────────────────────────────
function Magnetic({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const onMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const b = el.getBoundingClientRect();
    const x = (e.clientX - b.left - b.width  / 2) * 0.3;
    const y = (e.clientY - b.top  - b.height / 2) * 0.3;
    el.style.transform  = `translate(${x}px,${y}px)`;
    el.style.transition = "transform 0.1s ease";
  }, []);
  const onLeave = useCallback(() => {
    if (ref.current) {
      ref.current.style.transition = "transform 0.6s cubic-bezier(0.16,1,0.3,1)";
      ref.current.style.transform  = "translate(0,0)";
    }
  }, []);
  return <div ref={ref} onMouseMove={onMove} onMouseLeave={onLeave} className="inline-block">{children}</div>;
}

// ── Scroll reveal with blur ────────────────────────────────────────────────────
function Reveal({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setTimeout(() => setOn(true), delay); obs.disconnect(); }
    }, { threshold: 0.08, rootMargin: "0px 0px -40px 0px" });
    obs.observe(el);
    return () => obs.disconnect();
  }, [delay]);
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: on ? 1 : 0,
        filter:  on ? "blur(0px)" : "blur(8px)",
        transform: on ? "translateY(0)" : "translateY(22px)",
        transition: `opacity 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}ms, filter 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

// ── Count-up hook ──────────────────────────────────────────────────────────────
function useCountUp(target: number, duration = 2000) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      obs.disconnect();
      const start = performance.now();
      const tick  = (now: number) => {
        const t = Math.min((now - start) / duration, 1);
        setCount(Math.round((1 - Math.pow(1 - t, 3)) * target));
        if (t < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, { threshold: 0.4 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [target, duration]);
  return { count, ref };
}

// ── Terminal typing demo ───────────────────────────────────────────────────────
const SCRIPT = [
  { text: "> Analysing 287 transactions...", color: "#8892A4", pauseAfter: 500 },
  { text: "> Categories mapped", color: "#60A5FA", pauseAfter: 200 },
  { text: "  Subscriptions    34%", color: "#e2e8f0", pauseAfter: 80 },
  { text: "  Software tools   22%", color: "#e2e8f0", pauseAfter: 80 },
  { text: "  Cloud hosting    18%", color: "#e2e8f0", pauseAfter: 300 },
  { text: "⚠  AWS cost: +340% — anomaly", color: "#FCD34D", pauseAfter: 700 },
  { text: "   Unexpected charge: $1,247", color: "#FCD34D", pauseAfter: 400 },
  { text: "💡 Est. savings: $480 / month", color: "#34D399", pauseAfter: 0 },
];

function TerminalTyper({ active }: { active: boolean }) {
  const [done,    setDone]    = useState<typeof SCRIPT>([]);
  const [lineIdx, setLineIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);

  useEffect(() => {
    if (!active || lineIdx >= SCRIPT.length) return;
    const line = SCRIPT[lineIdx];
    if (charIdx < line.text.length) {
      const t = setTimeout(() => setCharIdx(c => c + 1), 22);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => {
      setDone(d => [...d, line]);
      setLineIdx(l => l + 1);
      setCharIdx(0);
    }, line.pauseAfter);
    return () => clearTimeout(t);
  }, [active, lineIdx, charIdx]);

  return (
    <div className="h-full overflow-hidden font-mono text-[11px] leading-[1.7]">
      {done.map((l, i) => (
        <div key={i} style={{ color: l.color }}>{l.text || " "}</div>
      ))}
      {lineIdx < SCRIPT.length && (
        <div style={{ color: SCRIPT[lineIdx].color }}>
          {SCRIPT[lineIdx].text.slice(0, charIdx)}
          <span className="animate-pulse">▌</span>
        </div>
      )}
    </div>
  );
}

// ── CSV ingest demo ────────────────────────────────────────────────────────────
const CSV_ROWS = [
  { date: "Jan 15", desc: "Netflix",      amt: "$15.99",  flag: false },
  { date: "Jan 16", desc: "AWS Services", amt: "$892.00", flag: true  },
  { date: "Jan 17", desc: "Slack",        amt: "$87.50",  flag: false },
  { date: "Jan 18", desc: "Figma",        amt: "$45.00",  flag: false },
];

function IngestDemo({ active }: { active: boolean }) {
  const [visible, setVisible] = useState(0);
  useEffect(() => {
    if (!active || visible >= CSV_ROWS.length) return;
    const t = setTimeout(() => setVisible(v => v + 1), 420);
    return () => clearTimeout(t);
  }, [active, visible]);
  return (
    <div className="space-y-1.5">
      <div className="mb-2 flex gap-3 text-[9px] font-semibold uppercase tracking-widest text-[#8892A4]/60">
        <span className="w-10">Date</span><span className="flex-1">Description</span><span className="w-14 text-right">Amount</span><span className="w-4" />
      </div>
      {CSV_ROWS.map((row, i) => (
        <div
          key={i}
          className={`animate-row-in flex gap-3 rounded-lg px-2.5 py-1.5 text-[11px] ${row.flag ? "bg-amber-500/10 text-amber-300" : "bg-white/[0.03] text-zinc-300"}`}
          style={{ animationDelay: `${i * 420}ms`, opacity: visible > i ? 1 : 0, pointerEvents: "none" }}
        >
          <span className="w-10 text-[#8892A4]">{row.date}</span>
          <span className="flex-1 font-medium">{row.desc}</span>
          <span className="w-14 text-right tabular-nums">{row.amt}</span>
          {row.flag ? <span className="text-amber-400">⚠</span> : <span className="text-emerald-400">✓</span>}
        </div>
      ))}
      {visible >= CSV_ROWS.length && (
        <p className="animate-badge-in pt-1 text-[10px] font-semibold text-emerald-400">
          ✓ 4 rows validated · 1 anomaly flagged
        </p>
      )}
    </div>
  );
}

// ── Security badge demo ────────────────────────────────────────────────────────
const SEC_BADGES = [
  { label: "bcrypt password hashing",     color: "text-blue-400"    },
  { label: "JWT authentication",          color: "text-blue-400"    },
  { label: "Zod schema validation",       color: "text-violet-400"  },
  { label: "CSRF protection",             color: "text-emerald-400" },
  { label: "Per-endpoint rate limiting",  color: "text-emerald-400" },
  { label: "PII auto-redacted",           color: "text-cyan-400"    },
];

function SecurityDemo({ active }: { active: boolean }) {
  const [visible, setVisible] = useState(0);
  useEffect(() => {
    if (!active || visible >= SEC_BADGES.length) return;
    const t = setTimeout(() => setVisible(v => v + 1), 350);
    return () => clearTimeout(t);
  }, [active, visible]);
  return (
    <div className="space-y-2.5">
      {SEC_BADGES.map((b, i) => (
        <div
          key={i}
          className={`animate-badge-in flex items-center gap-2.5 ${b.color}`}
          style={{ animationDelay: `${i * 350}ms`, opacity: visible > i ? 1 : 0 }}
        >
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5} className="h-3.5 w-3.5 flex-shrink-0">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
          <span className="text-[11px] text-zinc-300">{b.label}</span>
        </div>
      ))}
    </div>
  );
}

// ── Analytics bar demo ─────────────────────────────────────────────────────────
const BARS = [38, 55, 44, 72, 60, 84, 52, 68, 80, 91, 65, 78];
const MONTHS = ["J","F","M","A","M","J","J","A","S","O","N","D"];

function AnalyticsDemo({ active }: { active: boolean }) {
  return (
    <div>
      <div className="flex items-end gap-1" style={{ height: 64 }}>
        {BARS.map((h, i) => (
          <div
            key={i}
            className="flex-1 rounded-t-sm"
            style={{
              height: active ? `${h}%` : "4%",
              backgroundColor: i === 11 ? "#3B82F6" : i >= 9 ? "rgba(59,130,246,0.35)" : "rgba(59,130,246,0.15)",
              transition: `height 0.7s cubic-bezier(0.16,1,0.3,1) ${i * 45}ms`,
            }}
          />
        ))}
      </div>
      <div className="mt-1.5 flex justify-between">
        {MONTHS.map((m, i) => <span key={i} className="text-[8px] text-[#8892A4]">{m}</span>)}
      </div>
      <div
        className="mt-3 flex items-center justify-between rounded-lg border border-emerald-500/20 bg-emerald-500/8 px-3 py-2"
        style={{ opacity: active ? 1 : 0, transition: "opacity 0.5s ease 0.9s" }}
      >
        <span className="text-[11px] text-emerald-400">Trend: spend ↓18% year-on-year</span>
        <span className="text-[11px] font-bold text-emerald-400">$2,400 saved</span>
      </div>
    </div>
  );
}

// ── Live dashboard preview ─────────────────────────────────────────────────────
function DashboardPreview() {
  const [saved, setSaved] = useState(2400);
  const [insights, setInsights] = useState(47);
  useEffect(() => {
    const t = setInterval(() => {
      setSaved(s => s + Math.floor(Math.random() * 80 + 20));
      setInsights(i => i + 1);
    }, 4000);
    return () => clearInterval(t);
  }, []);

  const bars = [38, 62, 48, 80, 67, 92, 58, 75];
  return (
    <div className="pointer-events-none select-none overflow-hidden rounded-2xl shadow-[0_60px_140px_-20px_rgba(0,0,0,0.9),0_0_0_1px_rgba(255,255,255,0.06)]">
      <div className="flex items-center gap-3 border-b border-white/5 bg-[#0A1628] px-4 py-3">
        <div className="flex gap-1.5">
          <div className="h-3 w-3 rounded-full bg-red-500/70" />
          <div className="h-3 w-3 rounded-full bg-yellow-500/70" />
          <div className="h-3 w-3 rounded-full bg-emerald-500/70" />
        </div>
        <div className="ml-1 flex-1 rounded-md bg-white/5 px-3 py-1 text-[11px] text-[#8892A4]">
          app.insightstack.io/dashboard
        </div>
        <span className="flex items-center gap-1.5 text-[9px] font-semibold text-emerald-400">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />LIVE
        </span>
      </div>
      <div className="bg-[#050B18] p-4">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-[9px] font-extrabold uppercase tracking-[0.18em] text-blue-400">InsightStack</p>
            <p className="text-sm font-bold text-white">Welcome back, Sarah</p>
            <p className="text-[10px] text-[#8892A4]">sarah@acmecorp.com · Pro plan</p>
          </div>
        </div>
        <div className="mb-4 grid grid-cols-4 gap-2">
          {[
            { label: "Datasets",   value: "12",                         color: "text-white"       },
            { label: "AI Insights",value: `${insights}`,                color: "text-violet-400"  },
            { label: "Cost Saved", value: `$${saved.toLocaleString()}`, color: "text-emerald-400" },
            { label: "Anomalies",  value: "3",                          color: "text-amber-400"   },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-white/5 bg-[#0A1628] p-2.5">
              <p className="mb-0.5 text-[8px] font-semibold uppercase tracking-wide text-[#8892A4]">{s.label}</p>
              <p className={`text-base font-black tabular-nums ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-5 gap-2">
          <div className="col-span-3 overflow-hidden rounded-xl border border-white/5 bg-[#0A1628]">
            <div className="flex items-center justify-between border-b border-white/5 px-3 py-2">
              <p className="text-[11px] font-semibold text-white">Recent Datasets</p>
              <span className="text-[8px] font-semibold text-blue-400">View all →</span>
            </div>
            <div className="divide-y divide-white/[0.04] px-2 py-1">
              {[
                { name: "Q1 2026 Operating Expenses", rows: 287, saved: "$840" },
                { name: "Marketing & Ad Spend",       rows: 94,  saved: "$312" },
                { name: "Payroll Analysis",           rows: 156, saved: "$1.2k" },
              ].map((d) => (
                <div key={d.name} className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-[11px] font-semibold text-zinc-100">{d.name}</p>
                    <p className="text-[9px] text-[#8892A4]">{d.rows} rows · <span className="text-emerald-400">{d.saved}</span></p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[8px] font-bold text-emerald-400 ring-1 ring-emerald-500/20">PARSED</span>
                    <div className="rounded-md bg-blue-500 px-1.5 py-0.5 text-[8px] font-black text-white">Open →</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="col-span-2 rounded-xl border border-white/5 bg-[#0A1628] p-3">
            <p className="mb-2.5 text-[9px] font-semibold uppercase tracking-wide text-[#8892A4]">Monthly Spend</p>
            <div className="flex h-16 items-end gap-1">
              {bars.map((h, i) => (
                <div key={i} className="animate-bar flex-1 rounded-t-sm" style={{ height: `${h}%`, backgroundColor: i === bars.length - 1 ? "#3B82F6" : "rgba(59,130,246,0.15)", animationDelay: `${i * 80}ms` }} />
              ))}
            </div>
            <div className="mt-2 flex justify-between">
              <span className="text-[8px] text-[#8892A4]">Jan</span>
              <span className="text-[8px] font-bold text-emerald-400">↓18% Aug</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Stat item ─────────────────────────────────────────────────────────────────
function StatItem({ target, prefix = "", suffix = "", label, color }: { target: number; prefix?: string; suffix?: string; label: string; color: string }) {
  const { count, ref } = useCountUp(target);
  return (
    <div ref={ref} className="group flex flex-col items-center text-center">
      <p className={`text-4xl font-black tabular-nums sm:text-5xl ${color} transition-all duration-500 group-hover:drop-shadow-[0_0_24px_currentColor]`}>
        {prefix}{count.toLocaleString()}{suffix}
      </p>
      <p className="mt-2 text-sm text-[#8892A4]">{label}</p>
    </div>
  );
}

// ── 3D Tilt card ───────────────────────────────────────────────────────────────
function TiltCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const r = useRef<HTMLDivElement>(null);
  const onMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = r.current; if (!el) return;
    const b = el.getBoundingClientRect();
    el.style.setProperty("--rx", `${((-(e.clientY - b.top  - b.height / 2) / b.height) * 10).toFixed(2)}deg`);
    el.style.setProperty("--ry", `${(((e.clientX - b.left - b.width  / 2) / b.width)  * 10).toFixed(2)}deg`);
  }, []);
  const onLeave = useCallback(() => { r.current?.style.setProperty("--rx","0deg"); r.current?.style.setProperty("--ry","0deg"); }, []);
  return <div ref={r} onMouseMove={onMove} onMouseLeave={onLeave} className={`tilt-card ${className}`}>{children}</div>;
}

// ── Activity strip ────────────────────────────────────────────────────────────
const ACTIVITY_ITEMS = [
  { icon: "⚡", text: "287 rows parsed in 1.2 s — zero malformed cells", color: "text-blue-400" },
  { icon: "🔍", text: "$1,247 anomaly detected — unexpected AWS charge spike", color: "text-amber-400" },
  { icon: "✓",  text: "94.3% auto-categorisation accuracy across 12 datasets", color: "text-emerald-400" },
  { icon: "💡", text: "GPT-4o: 3 unused SaaS subscriptions — cancel to save $340/mo", color: "text-violet-400" },
  { icon: "🛡", text: "PII redacted before AI processing — GDPR compliant by default", color: "text-cyan-400" },
  { icon: "⚠",  text: "Duplicate charge flagged: $89.99 on Jan 15 & Jan 16", color: "text-amber-400" },
  { icon: "📊", text: "$480 / month in savings identified · PDF export ready", color: "text-blue-400" },
  { icon: "✓",  text: "Payroll CSV · 156 rows · 0 errors · categorised in 0.8 s", color: "text-emerald-400" },
];

function ActivityStrip() {
  const doubled = [...ACTIVITY_ITEMS, ...ACTIVITY_ITEMS];
  return (
    <div className="relative overflow-hidden border-b border-white/[0.04] bg-[#030810] py-2.5">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-[#030810] to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-[#030810] to-transparent" />
      <div className="absolute left-4 top-1/2 z-20 -translate-y-1/2 flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[9px] font-bold text-emerald-400 ring-1 ring-emerald-500/20">
        <span className="h-1 w-1 animate-pulse rounded-full bg-emerald-400" />LIVE
      </div>
      <div className="animate-ticker flex items-center gap-10 whitespace-nowrap pl-24">
        {doubled.map((item, i) => (
          <span key={i} className="flex items-center gap-2 text-xs text-[#8892A4]">
            <span className={item.color}>{item.icon}</span>
            {item.text}
            <span className="text-white/[0.06]">·</span>
          </span>
        ))}
      </div>
    </div>
  );
}

const pricingPlans = [
  {
    name: "Starter", price: "Free", period: "", tagline: "For individuals and side projects.",
    features: ["3 datasets", "CSV upload & parsing", "Core analytics dashboard", "5 AI insight reports / month", "Email support"],
    cta: "Get started free", href: "/register", hot: false,
  },
  {
    name: "Pro", price: "$49", period: "/month", tagline: "For professionals who need full power.",
    features: ["Unlimited datasets", "Unlimited AI insights", "Advanced anomaly detection", "Priority CSV processing", "PDF & Excel export", "Priority support", "API access (beta)"],
    cta: "Start 14-day free trial", href: "/register", hot: true,
  },
  {
    name: "Enterprise", price: "Custom", period: "", tagline: "For teams with compliance requirements.",
    features: ["Everything in Pro", "Team collaboration", "SSO / SAML auth", "Dedicated infrastructure", "Custom data retention", "SLA guarantee", "White-label option"],
    cta: "Talk to sales →", href: "/about", hot: false,
  },
];

const stack = [
  "Next.js 16","React 19","TypeScript 5","PostgreSQL","Prisma 7",
  "OpenAI GPT-4o","Zod","Recharts","Tailwind CSS v4","SendGrid",
  "JWT Auth","bcrypt","PapaParse","Vercel","Rate Limiting","CSRF Protection",
];

// ── Main page ─────────────────────────────────────────────────────────────────
export default function Home() {
  const [bentoActive, setBentoActive] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const bentoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = bentoRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setBentoActive(true); obs.disconnect(); }
    }, { threshold: 0.05 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div className="relative min-h-screen cursor-none bg-[#050B18] text-white">
      <CustomCursor />
      <CursorSpotlight />

      {/* ── Activity strip ─────────────────────────────────────────────────── */}
      <ActivityStrip />

      {/* ── Nav ────────────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-40 border-b border-white/[0.05] bg-[#050B18]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <LogoMark size={28} />
            <span className="text-[15px] font-bold tracking-tight">Insight<span className="text-blue-400">Stack</span></span>
          </div>
          <div className="hidden items-center gap-1 sm:flex">
            <Link href="/demo" className="rounded-lg px-3 py-2 text-sm text-[#8892A4] transition hover:bg-white/5 hover:text-white">Demo</Link>
            <Link href="/about" className="rounded-lg px-3 py-2 text-sm text-[#8892A4] transition hover:bg-white/5 hover:text-white">About</Link>
            <a href="/#pricing" className="rounded-lg px-3 py-2 text-sm text-[#8892A4] transition hover:bg-white/5 hover:text-white">Pricing</a>
            <div className="mx-2 h-4 w-px bg-white/10" />
            <Link href="/login" className="rounded-lg px-4 py-2 text-sm text-zinc-300 transition hover:bg-white/5 hover:text-white">Log in</Link>
            <Link href="/register" className="group relative overflow-hidden rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white shadow-[0_0_20px_rgba(59,130,246,0.3)] transition hover:bg-blue-400 hover:shadow-[0_0_30px_rgba(59,130,246,0.5)]">
              <span className="relative z-10">Get started free →</span>
              <div className="absolute inset-0 translate-x-[-100%] bg-gradient-to-r from-white/0 via-white/12 to-white/0 transition-transform duration-500 group-hover:translate-x-[100%]" />
            </Link>
          </div>
          {/* Hamburger — mobile only */}
          <button
            type="button"
            onClick={() => setMenuOpen(o => !o)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-[#8892A4] transition hover:bg-white/5 hover:text-white sm:hidden"
            aria-label="Toggle menu"
          >
            {menuOpen ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>
            )}
          </button>
        </div>
      </nav>

      {/* ── Mobile menu overlay ─────────────────────────────────────────────── */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-[#050B18]/98 px-6 py-6 backdrop-blur-xl sm:hidden"
          onClick={(e) => { if (e.target === e.currentTarget) setMenuOpen(false); }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <LogoMark size={24} />
              <span className="text-[15px] font-bold tracking-tight text-white">Insight<span className="text-blue-400">Stack</span></span>
            </div>
            <button onClick={() => setMenuOpen(false)} className="flex h-9 w-9 items-center justify-center rounded-lg text-[#8892A4] hover:text-white">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <nav className="mt-10 flex flex-col gap-1">
            {[{ href: "/demo", label: "Demo" }, { href: "/about", label: "About" }, { href: "/#pricing", label: "Pricing" }].map(({ href, label }) => (
              <Link key={label} href={href} onClick={() => setMenuOpen(false)} className="rounded-xl px-4 py-3.5 text-base font-semibold text-zinc-200 transition hover:bg-white/5 hover:text-white">{label}</Link>
            ))}
          </nav>
          <div className="mt-auto flex flex-col gap-3 pb-4">
            <Link href="/login" onClick={() => setMenuOpen(false)} className="w-full rounded-xl border border-white/[0.08] py-3.5 text-center text-sm font-semibold text-zinc-300 transition hover:bg-white/5">Log in</Link>
            <Link href="/register" onClick={() => setMenuOpen(false)} className="w-full rounded-xl bg-blue-500 py-3.5 text-center text-sm font-semibold text-white shadow-[0_0_25px_rgba(59,130,246,0.35)] transition hover:bg-blue-400">Get started free →</Link>
          </div>
        </div>
      )}

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden px-6 pb-0 pt-20 sm:pt-32">
        {/* Gradient mesh */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div style={{ position:"absolute", top:"-30%", left:"-15%", width:"90%", height:"90%", background:"radial-gradient(ellipse, rgba(59,130,246,0.13) 0%, transparent 65%)", filter:"blur(52px)" }} />
          <div style={{ position:"absolute", top:"5%", right:"-15%", width:"70%", height:"80%", background:"radial-gradient(ellipse, rgba(99,102,241,0.09) 0%, transparent 65%)", filter:"blur(52px)" }} />
          <div style={{ position:"absolute", bottom:"-10%", left:"25%", width:"55%", height:"55%", background:"radial-gradient(ellipse, rgba(139,92,246,0.06) 0%, transparent 65%)", filter:"blur(64px)" }} />
        </div>
        {/* Dot grid */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.018]" style={{ backgroundImage:"radial-gradient(rgba(255,255,255,1) 1px, transparent 1px)", backgroundSize:"32px 32px" }} />

        <div className="relative mx-auto max-w-4xl text-center">
          <Reveal>
            <div className="inline-flex items-center gap-2.5 rounded-full border border-blue-500/15 bg-blue-500/5 px-4 py-1.5 text-xs font-medium text-blue-300 backdrop-blur-sm">
              <span className="animate-ring h-1.5 w-1.5 rounded-full bg-blue-400" />
              AI-Powered · Finance Analytics · Production-Grade
            </div>
          </Reveal>

          <Reveal delay={100}>
            <h1 className="mt-7 text-5xl font-black leading-[1.08] tracking-[-0.025em] text-white sm:text-6xl lg:text-[5.5rem]">
              Know exactly where<br />
              <span className="text-gradient-premium">every dollar goes.</span>
            </h1>
          </Reveal>

          <Reveal delay={220}>
            <p className="mx-auto mt-7 max-w-xl text-lg leading-relaxed text-[#8892A4]">
              Upload any bank CSV. InsightStack maps your spend, detects anomalies,
              and surfaces GPT-4o recommendations — in under 60 seconds.
            </p>
          </Reveal>

          <Reveal delay={340}>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Magnetic>
                <Link
                  href="/register"
                  className="group relative overflow-hidden rounded-xl bg-blue-500 px-8 py-3.5 text-sm font-semibold text-white shadow-[0_0_40px_rgba(59,130,246,0.4),inset_0_1px_0_rgba(255,255,255,0.15)] transition-all duration-300 hover:shadow-[0_0_60px_rgba(59,130,246,0.6)]"
                >
                  <span className="relative z-10">Start free — no card required →</span>
                  <div className="absolute inset-0 translate-x-[-100%] bg-gradient-to-r from-white/0 via-white/12 to-white/0 transition-transform duration-700 group-hover:translate-x-[100%]" />
                </Link>
              </Magnetic>
              <Link href="/demo" className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-8 py-3.5 text-sm font-medium text-zinc-300 backdrop-blur-sm transition-all duration-300 hover:border-blue-500/25 hover:bg-white/[0.06] hover:text-white">
                View live demo
              </Link>
            </div>
          </Reveal>

          <Reveal delay={460}>
            <div className="mt-8 flex items-center justify-center gap-4">
              <div className="flex -space-x-2">
                {["JT","SC","MR","PK","AL"].map((ini,i) => (
                  <div key={i} className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#050B18] bg-gradient-to-br from-blue-500 to-violet-600 text-[8px] font-black text-white">{ini}</div>
                ))}
              </div>
              <p className="text-xs text-[#8892A4]">Trusted by finance teams worldwide</p>
            </div>
          </Reveal>
        </div>

        {/* Dashboard screenshot */}
        <Reveal delay={200} className="relative mx-auto mt-20 max-w-5xl">
          <div style={{ perspective:"1200px" }}>
            <div style={{ transform:"rotateX(4deg)" }} className="relative rounded-2xl ring-1 ring-white/[0.06]">
              <DashboardPreview />
            </div>
          </div>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-52 bg-gradient-to-t from-[#050B18] to-transparent" />
          <div className="pointer-events-none absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-blue-500/25 to-transparent" />
        </Reveal>
      </section>

      {/* ── Trust strip ──────────────────────────────────────────────────────── */}
      <Reveal>
        <section className="border-y border-white/[0.04] bg-[#030810]/50 px-6 py-5">
          <div className="mx-auto max-w-5xl">
            <p className="mb-4 text-center text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8892A4]/50">Enterprise-ready by design</p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              {[
                { icon:"🔒", text:"GDPR Compliant"          },
                { icon:"🛡", text:"PII Auto-Redaction"       },
                { icon:"⚡", text:"Per-Endpoint Rate Limiting"},
                { icon:"🔐", text:"bcrypt Password Hashing"  },
                { icon:"✅", text:"Zod Schema Validation"    },
                { icon:"🌐", text:"Deployed on Vercel"       },
              ].map(b => (
                <div key={b.text} className="flex items-center gap-2 rounded-full border border-white/[0.05] bg-white/[0.02] px-4 py-1.5 text-xs text-[#8892A4]">
                  <span className="text-sm">{b.icon}</span>{b.text}
                </div>
              ))}
            </div>
          </div>
        </section>
      </Reveal>

      {/* ── Outcomes ─────────────────────────────────────────────────────────── */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-4xl">
          <Reveal><p className="mb-14 text-center text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8892A4]/50">Platform results</p></Reveal>
          <div className="grid grid-cols-2 gap-10 sm:grid-cols-4">
            {[
              { target:87,   suffix:"%",  label:"reduction in finance review time",  color:"text-blue-400",    prefix:"" },
              { target:2400, suffix:"",   label:"average billing error caught ($/qtr)",color:"text-emerald-400",prefix:"$"},
              { target:60,   suffix:"s",  label:"from CSV upload to AI insight",      color:"text-violet-400",  prefix:"" },
              { target:100,  suffix:"%",  label:"TypeScript — zero runtime surprises",color:"text-cyan-400",    prefix:"" },
            ].map((o,i) => (
              <Reveal key={o.label} delay={i * 80}>
                <StatItem target={o.target} prefix={o.prefix} suffix={o.suffix} label={o.label} color={o.color} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Bento features ───────────────────────────────────────────────────── */}
      <section className="border-y border-white/[0.04] bg-[#030810]/30 px-6 py-28">
        <div className="mx-auto max-w-6xl">
          <Reveal className="mb-16">
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-blue-400">Platform capabilities</p>
            <h2 className="text-3xl font-black leading-tight tracking-tight sm:text-4xl">
              Built for teams that take<br />
              <span className="text-gradient-blue">financial data seriously.</span>
            </h2>
          </Reveal>

          <div ref={bentoRef} className="grid grid-cols-12 gap-4">

            {/* AI Analysis — large, left */}
            <Reveal className="col-span-12 lg:col-span-7">
              <div className="group relative flex h-full min-h-[340px] flex-col overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-b from-violet-500/10 to-[#0A1628] p-6 transition-all duration-500 hover:border-violet-500/20 hover:shadow-[0_20px_60px_rgba(139,92,246,0.12)]">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(139,92,246,0.08),transparent_60%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                <div className="relative mb-3 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-violet-500/20 bg-violet-500/10 text-violet-400">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5} className="h-5 w-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" /></svg>
                  </div>
                  <div>
                    <p className="font-bold text-zinc-100">GPT-4o AI Analysis</p>
                    <p className="text-xs text-[#8892A4]">PII-redacted · structured JSON output</p>
                  </div>
                </div>
                <div className="relative flex-1 overflow-hidden rounded-xl border border-white/[0.05] bg-[#020810] p-4">
                  <TerminalTyper active={bentoActive} />
                </div>
              </div>
            </Reveal>

            {/* Right column: Ingestion + Security stacked */}
            <div className="col-span-12 grid grid-rows-2 gap-4 lg:col-span-5">

              {/* Ingestion */}
              <Reveal delay={100}>
                <div className="group relative flex h-full min-h-[160px] flex-col overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-b from-blue-500/10 to-[#0A1628] p-5 transition-all duration-500 hover:border-blue-500/20 hover:shadow-[0_20px_60px_rgba(59,130,246,0.12)]">
                  <div className="mb-3 flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/10 text-blue-400">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5} className="h-4 w-4"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-zinc-100">Instant CSV Ingestion</p>
                      <p className="text-[11px] text-[#8892A4]">Any bank or card export</p>
                    </div>
                  </div>
                  <IngestDemo active={bentoActive} />
                </div>
              </Reveal>

              {/* Security */}
              <Reveal delay={200}>
                <div className="group relative flex h-full min-h-[160px] flex-col overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-b from-emerald-500/10 to-[#0A1628] p-5 transition-all duration-500 hover:border-emerald-500/20 hover:shadow-[0_20px_60px_rgba(16,185,129,0.10)]">
                  <div className="mb-3 flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5} className="h-4 w-4"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-zinc-100">Enterprise Security</p>
                      <p className="text-[11px] text-[#8892A4]">Security-first, by default</p>
                    </div>
                  </div>
                  <SecurityDemo active={bentoActive} />
                </div>
              </Reveal>
            </div>

            {/* Analytics — full width bottom */}
            <Reveal delay={150} className="col-span-12">
              <div className="group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-r from-blue-500/8 via-[#0A1628] to-violet-500/8 p-6 transition-all duration-500 hover:border-blue-500/15 hover:shadow-[0_20px_60px_rgba(59,130,246,0.08)]">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
                  <div className="lg:w-80">
                    <div className="mb-3 flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/10 text-blue-400">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5} className="h-4 w-4"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>
                      </div>
                      <p className="text-sm font-bold text-zinc-100">Visual Analytics</p>
                    </div>
                    <p className="text-sm leading-relaxed text-[#8892A4]">
                      Pie charts, monthly trends, and net savings lines — computed server-side, cached as MetricSnapshots, powered by Recharts with dark-native theming.
                    </p>
                  </div>
                  <div className="flex-1">
                    <AnalyticsDemo active={bentoActive} />
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────────────── */}
      <section className="px-6 py-28">
        <div className="mx-auto max-w-4xl">
          <Reveal className="mb-16 text-center">
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-blue-400">How it works</p>
            <h2 className="text-3xl font-black tracking-tight sm:text-4xl">From CSV to insight in 60 seconds.</h2>
            <p className="mt-4 text-[#8892A4]">No data team. No complex setup. Just upload and go.</p>
          </Reveal>
          <div className="grid gap-12 md:grid-cols-3">
            {[
              { n:"01", title:"Create your account",   body:"30-second registration. bcrypt-hashed passwords — plaintext credentials never touch our servers.", color:"bg-blue-500 shadow-[0_0_24px_rgba(59,130,246,0.4)]" },
              { n:"02", title:"Upload any financial CSV",body:"Export from your bank, accounting software, or card provider. Our parser validates every row on ingest.", color:"bg-violet-500 shadow-[0_0_24px_rgba(139,92,246,0.4)]" },
              { n:"03", title:"Get AI-powered decisions",body:"One click. GPT-4o flags anomalies, maps categories, and surfaces the three highest-ROI actions you can take today.", color:"bg-emerald-500 shadow-[0_0_24px_rgba(16,185,129,0.4)]" },
            ].map((s,i) => (
              <Reveal key={s.n} delay={i * 100}>
                <div className="relative">
                  {i < 2 && <div className="absolute left-[calc(50%+32px)] top-6 hidden h-px w-[calc(100%-64px)] bg-gradient-to-r from-white/10 to-transparent md:block" />}
                  <div className={`relative mb-5 inline-flex h-12 w-12 items-center justify-center rounded-full text-sm font-black text-white ${s.color}`}>
                    <div className="animate-ring absolute inset-0 rounded-full border-2 border-current opacity-60" />
                    {s.n}
                  </div>
                  <h3 className="mb-2 text-lg font-bold">{s.title}</h3>
                  <p className="text-sm leading-relaxed text-[#8892A4]">{s.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Production-grade ─────────────────────────────────────────────────── */}
      <section className="border-y border-white/[0.04] bg-[#030810]/30 px-6 py-28">
        <div className="mx-auto max-w-6xl">
          <Reveal className="mb-14 text-center">
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-blue-400">Built to ship, not to demo</p>
            <h2 className="text-3xl font-black tracking-tight sm:text-4xl">Production-grade from day one.</h2>
            <p className="mt-4 text-[#8892A4]">Every layer of the stack is real — no mocks, no cut corners.</p>
          </Reveal>
          <div className="grid gap-5 sm:grid-cols-3">
            {[
              {
                icon: (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-6 w-6 text-blue-400"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>
                ),
                accent: "blue",
                title: "Zero-config upload",
                body: "Drop any CSV — payroll, expenses, revenue. Auto-column mapping detects headers in milliseconds. 287-row files parsed in under 1.2 s with zero malformed cells.",
                pills: ["PapaParse streaming", "Auto type-inference", "Duplicate detection"],
              },
              {
                icon: (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-6 w-6 text-violet-400"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg>
                ),
                accent: "violet",
                title: "AI that explains its work",
                body: "GPT-4o doesn't just flag anomalies — it cites exact rows, compares prior periods, and gives plain-English rationale. PII is redacted server-side before any data leaves your environment.",
                pills: ["GPT-4o function calling", "PII redaction", "Anomaly scoring"],
              },
              {
                icon: (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-6 w-6 text-emerald-400"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.955 11.955 0 003 12c0 6.627 5.373 12 12 12s12-5.373 12-12c0-2.185-.584-4.234-1.598-6" /></svg>
                ),
                accent: "emerald",
                title: "Tested and hardened",
                body: "29 integration tests cover auth flows, CSV edge cases, and AI pipeline contracts — not just unit stubs. Rate limiting, bcrypt hashing, and CSRF protection ship on every environment.",
                pills: ["29 integration tests", "Rate limiting", "bcrypt + CSRF"],
              },
            ].map((card, i) => (
              <Reveal key={card.title} delay={i * 80}>
                <TiltCard className="group flex flex-col overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0A1628] p-6 hover:border-white/[0.10] hover:shadow-[0_16px_50px_rgba(0,0,0,0.5)]">
                  <div className={`absolute inset-0 bg-gradient-to-br ${card.accent === "blue" ? "from-blue-500/3" : card.accent === "violet" ? "from-violet-500/3" : "from-emerald-500/3"} to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100`} />
                  <div className="relative mb-4">{card.icon}</div>
                  <h3 className="relative mb-2 text-base font-bold text-white">{card.title}</h3>
                  <p className="relative mb-5 flex-1 text-sm leading-relaxed text-[#8892A4]">{card.body}</p>
                  <div className="relative flex flex-wrap gap-2">
                    {card.pills.map(p => (
                      <span key={p} className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${card.accent === "blue" ? "border-blue-500/20 bg-blue-500/10 text-blue-300" : card.accent === "violet" ? "border-violet-500/20 bg-violet-500/10 text-violet-300" : "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"}`}>{p}</span>
                    ))}
                  </div>
                </TiltCard>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ──────────────────────────────────────────────────────────── */}
      <section id="pricing" className="px-6 py-28">
        <div className="mx-auto max-w-5xl">
          <Reveal className="mb-14 text-center">
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-blue-400">Pricing</p>
            <h2 className="text-3xl font-black tracking-tight sm:text-4xl">Transparent pricing. No surprises.</h2>
            <p className="mt-4 text-[#8892A4]">Start free. Upgrade when you need more power. Cancel anytime.</p>
          </Reveal>
          <div className="grid gap-4 sm:grid-cols-3">
            {pricingPlans.map((plan,i) => (
              <Reveal key={plan.name} delay={i * 80}>
                <TiltCard className={`relative flex flex-col h-full overflow-hidden rounded-2xl p-6 ${plan.hot ? "border-0 bg-[#0A1628] shadow-[0_0_0_1px_rgba(59,130,246,0.45),0_24px_80px_rgba(59,130,246,0.12)]" : "border border-white/[0.06] bg-[#0A1628]/60"}`}>
                  {plan.hot && (
                    <>
                      <div className="absolute inset-0 bg-gradient-to-b from-blue-500/6 to-transparent" />
                      <div className="absolute -top-px left-1/2 -translate-x-1/2 whitespace-nowrap rounded-b-full bg-blue-500 px-5 py-1 text-[10px] font-black uppercase tracking-widest text-white shadow-[0_4px_20px_rgba(59,130,246,0.5)]">Most Popular</div>
                    </>
                  )}
                  <div className="relative flex flex-1 flex-col pt-2">
                    <p className="text-xs font-semibold uppercase tracking-widest text-[#8892A4]">{plan.name}</p>
                    <div className="mt-3 flex items-end gap-1">
                      <span className="text-4xl font-black text-white">{plan.price}</span>
                      {plan.period && <span className="mb-1.5 text-sm text-[#8892A4]">{plan.period}</span>}
                    </div>
                    <p className="mt-1 text-sm text-[#8892A4]">{plan.tagline}</p>
                    <ul className="mt-6 space-y-3">
                      {plan.features.map(f => (
                        <li key={f} className="flex items-start gap-2.5 text-sm text-zinc-300">
                          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5} className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-400"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                          {f}
                        </li>
                      ))}
                    </ul>
                    <div className="mt-auto pt-8">
                      <Link href={plan.href} className={`block w-full rounded-xl py-3 text-center text-sm font-semibold transition-all duration-200 hover:-translate-y-px ${plan.hot ? "bg-blue-500 text-white shadow-[0_0_24px_rgba(59,130,246,0.35)] hover:bg-blue-400 hover:shadow-[0_0_40px_rgba(59,130,246,0.55)]" : "border border-white/[0.08] bg-white/[0.03] text-zinc-300 hover:border-white/[0.14] hover:text-white"}`}>
                        {plan.cta}
                      </Link>
                    </div>
                  </div>
                </TiltCard>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Tech stack marquee ───────────────────────────────────────────────── */}
      <section className="border-y border-white/[0.04] bg-[#030810]/40 py-14">
        <Reveal><p className="mb-8 text-center text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8892A4]/50">Powered by world-class open source</p></Reveal>
        <div className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-28 bg-gradient-to-r from-[#030810] to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-28 bg-gradient-to-l from-[#030810] to-transparent" />
          <div className="animate-marquee flex items-center gap-3">
            {[...stack,...stack].map((t,i) => (
              <span key={i} className="whitespace-nowrap rounded-full border border-white/[0.06] bg-white/[0.02] px-5 py-2 text-sm text-[#8892A4] transition hover:border-blue-500/20 hover:text-blue-400">{t}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden px-6 py-32 text-center">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div style={{ position:"absolute", top:"20%", left:"10%", width:"80%", height:"80%", background:"radial-gradient(ellipse, rgba(59,130,246,0.08) 0%, transparent 65%)", filter:"blur(64px)" }} />
          <div style={{ position:"absolute", top:"30%", right:"5%", width:"50%", height:"60%", background:"radial-gradient(ellipse, rgba(99,102,241,0.06) 0%, transparent 65%)", filter:"blur(64px)" }} />
        </div>
        <div className="relative mx-auto max-w-2xl">
          <Reveal>
            <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-blue-400">Ready to start?</p>
            <h2 className="text-4xl font-black leading-tight tracking-tight sm:text-5xl">
              Stop reporting the past.<br />
              <span className="text-gradient-premium">Start shaping the future.</span>
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-[#8892A4]">
              Join finance teams using InsightStack to turn raw spending data<br className="hidden sm:block" />
              into decisions that move the bottom line.
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <Magnetic>
                <Link href="/register" className="animate-border-spin rounded-xl px-10 py-4 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-px">
                  Create your account — it&apos;s free →
                </Link>
              </Magnetic>
              <Link href="/about" className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-10 py-4 text-sm font-medium text-zinc-300 backdrop-blur-sm transition hover:border-white/[0.14] hover:text-white">
                About the project
              </Link>
            </div>
            <p className="mt-6 text-xs text-[#8892A4]/50">Built end-to-end by a full-stack engineer · Open source · Deployed on Vercel</p>
          </Reveal>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/[0.05] px-6 py-12">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 flex flex-col items-start justify-between gap-8 sm:flex-row">
            <div className="max-w-xs">
              <div className="mb-3 flex items-center gap-2">
                <LogoMark size={28} />
                <span className="font-bold">Insight<span className="text-blue-400">Stack</span></span>
              </div>
              <p className="text-sm text-[#8892A4]">The AI-powered financial intelligence platform for modern teams. Built to production standards.</p>
            </div>
            <div className="flex flex-wrap gap-x-12 gap-y-6 text-sm">
              <div>
                <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-[#8892A4]/50">Product</p>
                <div className="flex flex-col gap-2 text-[#8892A4]">
                  <Link href="/demo" className="transition hover:text-white">Demo</Link>
                  <a href="/#pricing" className="transition hover:text-white">Pricing</a>
                  <Link href="/about" className="transition hover:text-white">About</Link>
                </div>
              </div>
              <div>
                <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-[#8892A4]/50">Account</p>
                <div className="flex flex-col gap-2 text-[#8892A4]">
                  <Link href="/login" className="transition hover:text-white">Log in</Link>
                  <Link href="/register" className="transition hover:text-white">Sign up free</Link>
                </div>
              </div>
              <div>
                <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-[#8892A4]/50">Open source</p>
                <div className="flex flex-col gap-2 text-[#8892A4]">
                  <a href="https://github.com/anishonly121/insightstack-blueprint" target="_blank" rel="noopener noreferrer" className="transition hover:text-white">GitHub ↗</a>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-center justify-between gap-4 border-t border-white/[0.05] pt-8 sm:flex-row">
            <p className="text-xs text-[#8892A4]/40">© 2026 InsightStack. Built with Next.js, PostgreSQL, OpenAI & Vercel.</p>
            <p className="text-xs text-[#8892A4]/40">Full-stack portfolio project</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
