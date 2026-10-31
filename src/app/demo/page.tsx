import type { Metadata } from "next";
import Link from "next/link";
import { DemoWorkspace } from "@/components/DemoWorkspace";
import { ProductIcon } from "@/components/ProductIcon";
import "../product.css";

export const metadata: Metadata = {
  title: "Interactive demo | InsightStack",
  description:
    "Explore InsightStack without an account. Inspect sample transactions, spending insights, and a savings planner powered by the app's real analysis engine.",
};

export default function DemoPage() {
  return (
    <div className="demo-page insight-public">
      <a className="product-skip" href="#main-content">
        Skip to content
      </a>
      <div className="demo-banner">
        <span>
          <ProductIcon name="spark" size={15} />
          <strong>Your guided look inside InsightStack.</strong> Explore freely
          with fictional sample data.
        </span>
        <Link href="/register">
          Create your workspace <ProductIcon name="arrow" size={14} />
        </Link>
      </div>
      <DemoWorkspace />
    </div>
  );
}
