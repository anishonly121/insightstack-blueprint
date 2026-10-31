import Link from "next/link";
import type { ReactNode } from "react";
import { ProductIcon as Icon } from "./ProductIcon";
import "@/app/product.css";

export function PublicFrame({ children }: { children: ReactNode }) {
  return (
    <div className="insight-public">
      <a className="product-skip" href="#main-content">
        Skip to content
      </a>
      <header className="marketing-header">
        <Link href="/" className="product-brand">
          <span className="brand-glyph">
            <Icon name="chart" />
          </span>
          insightstack<span className="brand-dot">.</span>
        </Link>
        <nav aria-label="Main navigation">
          <Link href="/demo">The demo</Link>
          <Link href="/how-it-works">How it works</Link>
          <Link href="/pricing">Pricing</Link>
          <Link href="/about">Meet the builder</Link>
        </nav>
        <Link href="/demo" className="product-button primary">
          Explore demo <Icon name="arrow" size={16} />
        </Link>
      </header>
      <main id="main-content" className="editorial-main">
        {children}
      </main>
      <footer className="marketing-footer">
        <Link href="/" className="product-brand">
          insightstack<span className="brand-dot">.</span>
        </Link>
        <span>Built with intention by Anish Bhole.</span>
        <nav aria-label="Footer">
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          <a
            href="https://github.com/anishonly121/insightstack-blueprint"
            target="_blank"
            rel="noreferrer"
          >
            Source code <Icon name="external" size={12} />
          </a>
        </nav>
      </footer>
    </div>
  );
}
