import type { Metadata } from "next";
import Link from "next/link";
import { PublicFrame } from "@/components/PublicFrame";
import { ProductIcon as Icon } from "@/components/ProductIcon";

export const metadata: Metadata = {
  title: "How it works | InsightStack",
  description:
    "Trace a transaction from CSV import to explainable insights. Explore InsightStack's architecture, analysis methods, and tradeoffs.",
};
const steps = [
  {
    number: "01",
    title: "Bring a structured CSV",
    text: "Use date, description, category, and amount columns. Negative amounts represent expenses; positive amounts represent money received. The server validates and parses the upload before storing transactions.",
    file: "src/app/api/datasets/[id]/upload/route.ts",
    detail: "CSV → validation → PostgreSQL",
  },
  {
    number: "02",
    title: "Calculate a consistent picture",
    text: "The metrics module aggregates income, expenses, net savings, and monthly cash flow. Spending categories include only negative transactions and are ranked by expense size. All categories contribute to concentration calculations.",
    file: "src/lib/metrics.ts",
    detail: "Transactions → deterministic metrics",
  },
  {
    number: "03",
    title: "Find patterns with a traceable basis",
    text: "The analysis engine combines expert rules, linear trends, spending concentration, and expense outliers. BM25 retrieves guidance from a curated knowledge base. Template composition turns those findings into readable explanations.",
    file: "src/lib/ai/engine.ts",
    detail: "Metrics → rules + statistics + retrieval",
  },
  {
    number: "04",
    title: "Explore and act",
    text: "Review category spending, inspect the underlying transactions, and ask supported questions. In the public demo, a savings planner shows an illustrative scenario while leaving the original sample transactions intact.",
    file: "src/components/DemoWorkspace.tsx",
    detail: "Evidence → understanding → next steps",
  },
];

export default function HowItWorks() {
  return (
    <PublicFrame>
      <header className="editorial-hero">
        <p className="eyebrow">UNDER THE HOOD</p>
        <h1>
          Every insight.
          <br />
          <span>A traceable foundation.</span>
        </h1>
        <p>
          Follow the data from a transaction row to an explanation you can
          inspect. Built with Next.js, TypeScript, PostgreSQL, and a custom
          analysis engine.
        </p>
        <Link href="/demo" className="product-button primary large">
          See it in action <Icon name="arrow" size={17} />
        </Link>
      </header>
      <div className="pipeline-strip" aria-label="Data pipeline">
        <span>
          <Icon name="stack" /> CSV import
        </span>
        <b>→</b>
        <span>
          <Icon name="shield" /> Validate
        </span>
        <b>→</b>
        <span>
          <Icon name="chart" /> Calculate
        </span>
        <b>→</b>
        <span>
          <Icon name="spark" /> Explain
        </span>
      </div>
      <section className="engineering-steps">
        {steps.map((step) => (
          <article key={step.number}>
            <span className="engineering-step-number">{step.number}</span>
            <div>
              <h2>{step.title}</h2>
              <p>{step.text}</p>
              <code>{step.detail}</code>
              <a
                href={`https://github.com/anishonly121/insightstack-blueprint/blob/main/${step.file}`}
                target="_blank"
                rel="noreferrer"
              >
                Inspect the implementation <Icon name="external" size={13} />
              </a>
            </div>
          </article>
        ))}
      </section>
      <section className="editorial-split">
        <p className="eyebrow">THE BOUNDARIES</p>
        <div className="decision-list">
          <article>
            <h3>Public demo</h3>
            <p>
              Fictional transactions and the shared calculation engine run in
              the browser. No database, account, bank connection, or external AI
              service is needed. Exported demo files contain only the selected
              sample rows.
            </p>
          </article>
          <article>
            <h3>Authenticated application</h3>
            <p>
              Uploaded data is stored in PostgreSQL. API routes check ownership,
              cookie-authenticated writes use CSRF checks, and analysis results
              can be stored and shared. Payment and email flows depend on
              configured providers.
            </p>
          </article>
          <article>
            <h3>Known limits</h3>
            <p>
              The importer expects the documented CSV columns. The chat
              recognises supported financial intents rather than arbitrary
              questions. Trend forecasts are estimates from historical data; a
              flagged transaction is a prompt for review, not proof of a
              problem.
            </p>
          </article>
        </div>
      </section>
      <section className="csv-example">
        <div>
          <p className="eyebrow">A SMALL FILE. A USEFUL START.</p>
          <h2>Try the import format.</h2>
          <p>
            Use ISO dates and signed decimal amounts for predictable imports.
          </p>
          <a
            href="/demo-transactions.csv"
            download
            className="product-button secondary"
          >
            Download sample CSV <Icon name="down" size={16} />
          </a>
        </div>
        <pre>{`date,description,category,amount\n2026-01-02,Salary,Income,5200.00\n2026-01-05,Groceries,Food,-64.20\n2026-01-08,Train pass,Transport,-110.00`}</pre>
      </section>
    </PublicFrame>
  );
}
