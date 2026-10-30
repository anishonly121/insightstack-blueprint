import Link from "next/link";
import { DemoWorkspace } from "@/components/DemoWorkspace";
import { ProductIcon as Icon } from "@/components/ProductIcon";
import "./product.css";

export default function HomePage() {
  return (
    <div className="insight-public">
      <a className="product-skip" href="#main-content">
        Skip to content
      </a>
      <header className="marketing-header">
        <Link href="/" className="product-brand">
          <span className="brand-glyph">
            <Icon name="chart" size={22} />
          </span>{" "}
          insightstack<span className="brand-dot">.</span>
        </Link>
        <nav aria-label="Main navigation">
          <a href="#product">The product</a>
          <Link href="/how-it-works">How it works</Link>
          <Link href="/about">
            Meet the builder <Icon name="external" size={12} />
          </Link>
        </nav>
        <div className="header-actions">
          <Link href="/login" className="login-link">
            Log in
          </Link>
          <Link href="/demo" className="product-button primary">
            Explore demo <Icon name="arrow" size={15} />
          </Link>
        </div>
      </header>
      <main id="main-content">
        <section className="marketing-hero">
          <div className="hero-copy">
            <div className="hero-kicker">
              <span className="status-dot" /> FINANCIAL CLARITY, WITHOUT THE
              GUESSWORK
            </div>
            <h1>
              Your money.
              <br />A clearer <span>perspective.</span>
            </h1>
            <p>
              Turn a spreadsheet of transactions into a story you can act on.
              See your spending, understand the patterns, and make room for what
              matters.
            </p>
            <div className="hero-actions">
              <Link href="/demo" className="product-button primary large">
                Explore the live demo <Icon name="arrow" size={18} />
              </Link>
              <Link href="/register" className="product-button text large">
                Use your own data <Icon name="plus" size={16} />
              </Link>
            </div>
            <div className="hero-reassurance">
              <span>
                <Icon name="check" size={14} /> No account needed to explore
              </span>
              <span>
                <Icon name="shield" size={14} /> No bank connection
              </span>
            </div>
          </div>
          <aside className="hero-side-note">
            <div className="hero-orbit" aria-hidden="true">
              <div className="orbit-ring ring-one" />
              <div className="orbit-ring ring-two" />
              <div className="orbit-ring ring-three" />
              <span className="orbit-center">
                <Icon name="spark" size={30} />
              </span>
              <span className="orbit-dot dot-one" />
              <span className="orbit-dot dot-two" />
            </div>
            <div className="hero-note-content">
              <span className="eyebrow">LESS NOISE. MORE UNDERSTANDING.</span>
              <p>
                Not just where your money went.
                <br />
                <strong>What you can do next.</strong>
              </p>
            </div>
          </aside>
        </section>
        <section
          className="product-showcase"
          id="product"
          aria-label="Interactive product preview"
        >
          <div className="preview-caption">
            <span>
              <i /> A REAL WORKSPACE. READY TO EXPLORE.
            </span>
            <Link href="/demo">
              Open full demo <Icon name="external" size={14} />
            </Link>
          </div>
          <DemoWorkspace embedded />
        </section>
        <section className="trust-strip" aria-label="Product principles">
          <span>
            <Icon name="shield" /> Your data stays in your control
          </span>
          <span>
            <Icon name="spark" /> Explainable, rule-based analysis
          </span>
          <span>
            <Icon name="code" /> Open source. Built to be inspected.
          </span>
        </section>
        <section className="story-section">
          <div className="story-heading">
            <p className="eyebrow">FROM SPREADSHEET TO PERSPECTIVE</p>
            <h2>
              Numbers are only useful
              <br />
              when they mean something.
            </h2>
            <p>
              A focused workflow that takes you from raw transactions to your
              next decision.
            </p>
          </div>
          <div className="story-steps">
            <article>
              <span className="step-number">01</span>
              <Icon name="stack" size={26} />
              <h3>Bring the data you already have.</h3>
              <p>
                Upload a CSV with dates, descriptions, categories, and amounts.
                Keep your bank credentials to yourself.
              </p>
              <a href="/demo-transactions.csv" download>
                Download a sample CSV <Icon name="down" size={14} />
              </a>
            </article>
            <article>
              <span className="step-number">02</span>
              <Icon name="chart" size={26} />
              <h3>See the whole picture.</h3>
              <p>
                Understand cash flow, category spending, and savings in one
                place. Every number traces back to your transactions.
              </p>
              <Link href="/demo">
                Explore the dashboard <Icon name="arrow" size={14} />
              </Link>
            </article>
            <article>
              <span className="step-number">03</span>
              <Icon name="target" size={26} />
              <h3>Turn a pattern into a plan.</h3>
              <p>
                Review unusual spending, read explainable findings, and explore
                what small changes could mean for your savings.
              </p>
              <Link href="/demo">
                Try the interactive demo <Icon name="arrow" size={14} />
              </Link>
            </article>
          </div>
        </section>
        <section className="engineering-section">
          <div>
            <p className="eyebrow">
              THOUGHTFUL ON THE SURFACE. RIGOROUS UNDERNEATH.
            </p>
            <h2>
              A product you can explore.
              <br />
              Engineering you can inspect.
            </h2>
            <p>
              Designed and built by Anish Bhole. A full-stack finance
              application with authenticated workspaces, a custom analysis
              engine, and an accessible demo powered by shared calculation
              logic.
            </p>
            <div className="engineering-actions">
              <Link href="/how-it-works" className="product-button light">
                See how it works <Icon name="arrow" size={16} />
              </Link>
              <a
                href="https://github.com/anishonly121/insightstack-blueprint"
                target="_blank"
                rel="noreferrer"
                className="source-link"
              >
                View source <Icon name="external" size={15} />
              </a>
            </div>
          </div>
          <div className="engineering-proof">
            <div>
              <span>01 / APPLICATION</span>
              <strong>Next.js + TypeScript</strong>
              <p>
                Typed APIs, account authentication, and user-owned datasets.
              </p>
            </div>
            <div>
              <span>02 / ANALYSIS</span>
              <strong>Explainable by design</strong>
              <p>
                Statistical trends, expert rules, and BM25 retrieval. No
                external language model.
              </p>
            </div>
            <div>
              <span>03 / DATA</span>
              <strong>PostgreSQL + Prisma</strong>
              <p>
                Validated imports, cached metrics, and an auditable data
                pipeline.
              </p>
            </div>
          </div>
        </section>
        <section className="closing-section">
          <p className="eyebrow">YOUR NEXT STEP IS A CLEARER ONE</p>
          <h2>Make sense of your money.</h2>
          <p>
            Start with a sample workspace. Make it your own when you’re ready.
          </p>
          <Link href="/demo" className="product-button primary large">
            Take a look inside <Icon name="arrow" size={18} />
          </Link>
        </section>
      </main>
      <footer className="marketing-footer">
        <Link href="/" className="product-brand">
          insightstack<span className="brand-dot">.</span>
        </Link>
        <span>Built with intention by Anish Bhole.</span>
        <nav aria-label="Footer">
          <Link href="/about">About</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          <a
            href="https://github.com/anishonly121/insightstack-blueprint"
            target="_blank"
            rel="noreferrer"
          >
            GitHub <Icon name="external" size={12} />
          </a>
        </nav>
      </footer>
    </div>
  );
}
