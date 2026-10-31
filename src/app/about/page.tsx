import type { Metadata } from "next";
import Link from "next/link";
import { PublicFrame } from "@/components/PublicFrame";
import { ProductIcon as Icon } from "@/components/ProductIcon";

export const metadata: Metadata = {
  title: "The builder | InsightStack",
  description:
    "The product decisions, engineering tradeoffs, and implementation behind Anish Bhole's InsightStack project.",
};

export default function AboutPage() {
  return (
    <PublicFrame>
      <header className="editorial-hero">
        <p className="eyebrow">A NOTE FROM THE BUILDER</p>
        <h1>
          Built to make complex
          <br />
          <span>feel understandable.</span>
        </h1>
        <p>
          InsightStack is a full-stack finance analytics project by{" "}
          <strong>Anish Bhole</strong>. It brings together product design, data
          processing, and explainable analysis in one working application.
        </p>
        <div className="hero-actions">
          <a
            href="https://github.com/anishonly121/insightstack-blueprint"
            target="_blank"
            rel="noreferrer"
            className="product-button primary"
          >
            Explore the source <Icon name="code" size={17} />
          </a>
          <Link href="/demo" className="product-button text">
            Try the product <Icon name="arrow" size={16} />
          </Link>
        </div>
      </header>
      <section className="editorial-split">
        <p className="eyebrow">THE PROBLEM</p>
        <div>
          <h2>
            A bank statement gives you rows.
            <br />
            It rarely gives you perspective.
          </h2>
          <p>
            The project starts with a simple question: can a CSV become a useful
            financial picture without handing over bank credentials or sending
            transactions to an external language model?
          </p>
          <p>
            InsightStack uses a structured import, transparent calculations, and
            a custom analysis engine to make that workflow tangible. The public
            demo removes the sign-up barrier so the core experience can be
            evaluated immediately.
          </p>
        </div>
      </section>
      <section className="editorial-split">
        <p className="eyebrow">DECISIONS THAT MATTER</p>
        <div className="decision-list">
          <article>
            <h3>Shared logic, separate data boundaries</h3>
            <p>
              The browser demo and authenticated server routes share the metrics
              and insight engine. Sample data lives in the browser; uploaded
              account data is stored in PostgreSQL and accessed through
              authorised API routes.
            </p>
          </article>
          <article>
            <h3>Explainable analysis over generated certainty</h3>
            <p>
              Rules, linear trends, and statistical outliers give findings a
              traceable basis. BM25 retrieves contextual guidance. The tradeoff
              is narrower language understanding than a general-purpose language
              model.
            </p>
          </article>
          <article>
            <h3>A complete vertical slice</h3>
            <p>
              Account creation, CSV upload, dataset management, cash-flow
              metrics, insights, and exports form a coherent workflow. Stripe
              and email integrations are optional services that require their
              own configuration.
            </p>
          </article>
        </div>
      </section>
      <section className="reviewer-card">
        <Icon name="clock" size={24} />
        <div>
          <p className="eyebrow">SHORT ON TIME?</p>
          <h2>A two-minute product tour.</h2>
          <p>
            Open the demo. Switch workspaces. Click a spending category. Ask a
            question in Intelligence. Move the savings slider. Then inspect the
            code behind those interactions.
          </p>
        </div>
        <Link href="/demo" className="product-button primary">
          Start exploring <Icon name="arrow" size={16} />
        </Link>
      </section>
    </PublicFrame>
  );
}
