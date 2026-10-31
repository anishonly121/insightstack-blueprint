"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { PublicFrame } from "@/components/PublicFrame";
import { ProductIcon } from "@/components/ProductIcon";
import { api, getToken } from "@/lib/api";
import "./pricing.css";

const shared = [
  "CSV imports and transaction search",
  "Cash-flow charts and monthly budgets",
  "Explainable insights and data-grounded chat",
  "CSV exports and printable insight reports",
];
const questions = [
  [
    "Can I try it before creating an account?",
    "Yes. The interactive demo includes fictional sample workspaces and uses the same calculation engine as the account experience. No signup or bank connection is required.",
  ],
  [
    "Which files can I import?",
    "Use a CSV with date, description, category, and amount columns. Dates should use YYYY-MM-DD; expenses are negative and income is positive. Bank exports may need their columns adjusted before import.",
  ],
  [
    "How does the analysis work?",
    "InsightStack calculates metrics from your transactions and applies statistical methods and rules. Chat answers supported financial questions using that data. No external language model is required. Forecasts and findings are estimates to review, not financial advice.",
  ],
  [
    "What happens when I reach a limit?",
    "Your existing datasets remain available. Free accounts support three datasets and five new insight analyses per calendar month. Pro increases those limits. Chat has request-rate limits to keep the service responsive.",
  ],
  [
    "How do billing and cancellation work?",
    "Where payments are enabled, Pro checkout offers a 14-day trial followed by monthly billing. Review the amount, currency, renewal date, and cancellation terms in Stripe before subscribing. Manage an existing subscription in account settings.",
  ],
  [
    "Who can see my information?",
    "Account data is restricted to its owner. An insight becomes publicly accessible only when you choose Share, and you can revoke that link. You can export your transactions and delete your account in settings; cancel an active subscription first.",
  ],
];
export default function PricingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  async function upgrade() {
    setError("");
    if (!getToken()) {
      router.push("/register");
      return;
    }
    setLoading(true);
    try {
      const response = await api.createCheckoutSession();
      window.location.href = response.data.url;
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Checkout is unavailable. Please try again later.",
      );
      setLoading(false);
    }
  }
  return (
    <PublicFrame>
      <section className="pricing-intro">
        <p className="product-eyebrow">ROOM TO START. ROOM TO GROW.</p>
        <h1>
          A clearer picture.
          <br />
          <span>A plan that fits.</span>
        </h1>
        <p>
          Start with your own transactions. Explore the patterns, make a plan,
          and upgrade when you need more room.
        </p>
        <Link href="/demo">
          Try the workspace first <ProductIcon name="arrow" size={16} />
        </Link>
      </section>
      <div className="pricing-plans">
        {[false, true].map((pro) => (
          <section
            key={String(pro)}
            className={`pricing-plan ${pro ? "pricing-pro" : ""}`}
          >
            <p className="product-eyebrow">{pro ? "PRO" : "FREE"}</p>
            <h2>{pro ? "More space to explore." : "Your starting point."}</h2>
            <p>
              {pro
                ? "For frequent analysis and growing collections of data."
                : "For a focused view of your personal finances."}
            </p>
            <div className="pricing-amount">
              {pro ? "$9" : "$0"} <span>{pro ? "SGD / month" : "/ month"}</span>
            </div>
            {pro ? (
              <button
                className="product-button primary"
                disabled={loading}
                onClick={() => void upgrade()}
              >
                {loading ? "Opening checkout…" : "Start 14-day free trial"}
                <ProductIcon name="arrow" size={16} />
              </button>
            ) : (
              <Link className="product-button secondary" href="/register">
                Start free — no card needed{" "}
                <ProductIcon name="arrow" size={16} />
              </Link>
            )}
            <ul>
              {[
                pro ? "Unlimited datasets" : "3 datasets",
                pro
                  ? "30 insight analyses per day"
                  : "5 insight analyses per month",
                ...shared,
              ].map((feature) => (
                <li key={feature}>
                  <ProductIcon name="check" size={17} />
                  {feature}
                </li>
              ))}
            </ul>
            {pro && (
              <p className="pricing-note">
                Trial and paid subscriptions require payments to be enabled.
                Final terms are shown in checkout.
              </p>
            )}
          </section>
        ))}
      </div>
      {error && (
        <p className="pricing-error" role="alert">
          {error}
        </p>
      )}
      <p className="pricing-billing">
        Monthly billing. Review the final terms in checkout.
      </p>
      <section className="pricing-questions">
        <p className="product-eyebrow">BEFORE YOU GET STARTED</p>
        <h2>A few useful answers.</h2>
        {questions.map(([q, a]) => (
          <details key={q}>
            <summary>
              {q}
              <ProductIcon name="plus" size={18} />
            </summary>
            <p>{a}</p>
          </details>
        ))}
      </section>
      <section className="pricing-bottom">
        <ProductIcon name="shield" size={28} />
        <h2>Bring your data. Keep your perspective.</h2>
        <p>
          No bank credentials. No opaque model behind the numbers.
          <br />
          Start with a sample, then make the workspace your own.
        </p>
        <Link className="product-button primary" href="/demo">
          Explore the demo <ProductIcon name="arrow" size={16} />
        </Link>
      </section>
    </PublicFrame>
  );
}
