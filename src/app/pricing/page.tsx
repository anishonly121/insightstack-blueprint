"use client";

import Link from "next/link";
import { useState } from "react";
import { LogoMark } from "@/components/LogoMark";
import { api, getToken } from "@/lib/api";

const FREE_FEATURES = [
  "3 datasets",
  "5 AI insights per month",
  "Streaming analysis",
  "Budget tracker",
  "Category charts & trends",
  "CSV export",
  "Chat with your data (10 messages/day)",
];

const PRO_FEATURES = [
  "Unlimited datasets",
  "30 AI insights per day",
  "Streaming analysis",
  "Budget tracker with alerts",
  "Full chart suite",
  "CSV & PDF export",
  "Unlimited chat",
  "Weekly email digest",
  "Month-end spending forecast",
  "Priority support",
];

const FAQS = [
  {
    q: "What happens after the beta?",
    a: "When we launch Pro pricing, we'll give all beta users at least 30 days notice and a locked-in early-adopter rate.",
  },
  {
    q: "What data formats do you support?",
    a: "Any CSV with date, description, category, and amount columns. Most banks let you export this directly.",
  },
  {
    q: "Is my financial data secure?",
    a: "Yes. Data is encrypted in transit and at rest on Neon PostgreSQL. PII is redacted before reaching the AI model. We never sell data.",
  },
  {
    q: "How accurate are the AI insights?",
    a: "Very. Unlike other tools, InsightStack computes all numbers from your actual transactions first — the AI only writes the narrative. No hallucinated figures.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes, instantly. No lock-ins, no cancellation fees. Your data remains exportable.",
  },
  {
    q: "Do you integrate with my bank?",
    a: "Not yet — bank integrations are on the roadmap for Q3 2026. For now, export a CSV from your bank and upload it.",
  },
];

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  );
}

export default function PricingPage() {
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "annual">("monthly");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const proPrice = billingPeriod === "annual" ? "$7" : "$9";
  const proPeriod = billingPeriod === "annual" ? "/mo · billed $84/yr" : "/ month";

  const onUpgrade = async () => {
    setCheckoutLoading(true);
    try {
      if (!getToken()) { window.location.href = "/register"; return; }
      const res = await api.createCheckoutSession();
      window.location.href = res.data.url;
    } catch {
      setCheckoutLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#050B18] px-4 py-16 text-white sm:px-6">
      <div className="mx-auto max-w-5xl">

        {/* Nav */}
        <nav className="mb-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-1.5">
            <LogoMark size={22} />
            <span className="text-sm font-black tracking-tight text-zinc-200">
              Insight<span className="text-blue-400">Stack</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/demo" className="text-sm text-zinc-500 transition hover:text-white">Demo</Link>
            <Link href="/login" className="rounded-xl border border-white/8 bg-zinc-900 px-4 py-2 text-sm font-semibold text-zinc-300 transition hover:border-white/15 hover:text-white">
              Log in
            </Link>
            <Link href="/register" className="rounded-xl bg-blue-500 px-4 py-2 text-sm font-black text-white shadow-[0_0_20px_rgba(59,130,246,0.3)] transition hover:bg-blue-400">
              Get started free
            </Link>
          </div>
        </nav>

        {/* Header */}
        <div className="mb-10 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/8 px-4 py-1.5 text-xs font-bold text-emerald-400">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
            Public beta — all Pro features free while we launch
          </div>
          <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl">
            Simple, honest pricing
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-zinc-500">
            No hidden fees. No credit card required to start.
            Upgrade when InsightStack is genuinely saving you money.
          </p>
        </div>

        {/* Billing toggle */}
        <div className="mb-10 flex items-center justify-center gap-3">
          <span className={`text-sm font-medium transition-colors ${billingPeriod === "monthly" ? "text-white" : "text-zinc-500"}`}>
            Monthly
          </span>
          <button
            type="button"
            onClick={() => setBillingPeriod(p => p === "monthly" ? "annual" : "monthly")}
            aria-label="Toggle billing period"
            className={`relative h-6 w-11 rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050B18] ${billingPeriod === "annual" ? "bg-blue-500" : "bg-zinc-700"}`}
          >
            <span
              className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${billingPeriod === "annual" ? "translate-x-5" : "translate-x-0"}`}
            />
          </button>
          <span className={`text-sm font-medium transition-colors ${billingPeriod === "annual" ? "text-white" : "text-zinc-500"}`}>
            Annual
          </span>
          <div
            className="overflow-hidden transition-all duration-300"
            style={{ maxWidth: billingPeriod === "annual" ? "90px" : "0px", opacity: billingPeriod === "annual" ? 1 : 0 }}
          >
            <span className="whitespace-nowrap rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-bold text-emerald-400 ring-1 ring-emerald-500/20">
              Save 20%
            </span>
          </div>
        </div>

        {/* Plans */}
        <div className="grid gap-6 lg:grid-cols-2">

          {/* Free */}
          <div className="flex flex-col rounded-2xl border border-white/6 bg-zinc-900 p-8">
            <div className="mb-6">
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Free</p>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-5xl font-black text-white">$0</span>
                <span className="text-zinc-600">/ month</span>
              </div>
              <p className="mt-2 text-sm text-zinc-600">Everything you need to get started.</p>
            </div>

            <ul className="mb-8 flex-1 space-y-3">
              {FREE_FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-3 text-sm text-zinc-400">
                  <CheckIcon className="h-4 w-4 shrink-0 text-emerald-400" />
                  {f}
                </li>
              ))}
            </ul>

            <Link
              href="/register"
              className="block rounded-xl border border-white/10 py-3 text-center text-sm font-bold text-zinc-300 transition hover:border-white/20 hover:text-white"
            >
              Start free — no card needed
            </Link>
          </div>

          {/* Pro */}
          <div className="relative flex flex-col overflow-hidden rounded-2xl border border-blue-500/30 bg-zinc-900 p-8">
            {/* Glow */}
            <div className="pointer-events-none absolute inset-0 opacity-10"
              style={{ background: "radial-gradient(ellipse at top, #3B82F6 0%, transparent 70%)" }} />

            <div className="mb-6">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-widest text-blue-400">Pro</p>
                <span className="rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-bold text-blue-400 ring-1 ring-blue-500/20">
                  Most popular
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-5xl font-black text-white transition-all duration-200">{proPrice}</span>
                <span className="text-zinc-600">{proPeriod}</span>
              </div>
              <p className="mt-2 text-sm text-zinc-600">
                For freelancers and small businesses who want the full picture.
              </p>
            </div>

            <ul className="mb-8 flex-1 space-y-3">
              {PRO_FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-3 text-sm text-zinc-300">
                  <CheckIcon className="h-4 w-4 shrink-0 text-blue-400" />
                  {f}
                </li>
              ))}
            </ul>

            <button
              type="button"
              onClick={() => void onUpgrade()}
              disabled={checkoutLoading}
              className="block w-full rounded-xl bg-blue-500 py-3 text-center text-sm font-black text-white shadow-[0_0_25px_rgba(59,130,246,0.35)] transition hover:bg-blue-400 hover:shadow-[0_0_35px_rgba(59,130,246,0.5)] disabled:opacity-60"
            >
              {checkoutLoading ? "Opening checkout…" : "Start 14-day free trial →"}
            </button>
          </div>
        </div>

        {/* FAQ accordion */}
        <div className="mt-20">
          <h2 className="mb-8 text-center text-2xl font-black text-white">Common questions</h2>
          <div className="space-y-2">
            {FAQS.map(({ q, a }, i) => (
              <div
                key={q}
                className="overflow-hidden rounded-xl border border-white/6 bg-zinc-900 transition-colors hover:border-white/10"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                >
                  <span className="font-semibold text-zinc-100">{q}</span>
                  <svg
                    className={`h-4 w-4 shrink-0 text-zinc-500 transition-transform duration-300 ${openFaq === i ? "rotate-180" : ""}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div
                  className="grid transition-all duration-300 ease-in-out"
                  style={{ gridTemplateRows: openFaq === i ? "1fr" : "0fr" }}
                >
                  <div className="overflow-hidden">
                    <p className="px-5 pb-4 text-sm leading-relaxed text-zinc-500">{a}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-16 rounded-2xl border border-blue-500/15 bg-gradient-to-r from-blue-500/8 to-transparent p-10 text-center">
          <h2 className="text-2xl font-black text-white">Start analysing your spending today</h2>
          <p className="mx-auto mt-3 max-w-md text-zinc-500">
            Upload a CSV, generate AI insights, set budgets, and ask questions about your data.
            Free. No card. Takes 2 minutes.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/register"
              className="rounded-xl bg-blue-500 px-6 py-3 text-sm font-black text-white shadow-[0_0_25px_rgba(59,130,246,0.3)] transition hover:bg-blue-400"
            >
              Create free account →
            </Link>
            <Link
              href="/demo"
              className="rounded-xl border border-white/8 px-6 py-3 text-sm font-semibold text-zinc-400 transition hover:border-white/15 hover:text-white"
            >
              See the demo first
            </Link>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-16 flex flex-wrap items-center justify-between gap-4 border-t border-white/5 pt-8 text-xs text-zinc-700">
          <Link href="/" className="flex items-center gap-1.5">
            <LogoMark size={16} />
            <span className="font-bold">InsightStack</span>
          </Link>
          <div className="flex gap-6">
            <Link href="/privacy" className="transition hover:text-zinc-400">Privacy</Link>
            <Link href="/terms" className="transition hover:text-zinc-400">Terms</Link>
            <Link href="/about" className="transition hover:text-zinc-400">About</Link>
          </div>
        </footer>
      </div>
    </main>
  );
}
