import type { Metadata } from "next";
import { AboutClient } from "./AboutClient";

export const metadata: Metadata = {
  title: "About — InsightStack",
  description:
    "InsightStack is a production-grade AI financial analytics platform. 29 integration tests, zero mocks, 12-layer security, custom FinanceAI engine — from CSV to analysis in 60 seconds.",
};

export default function AboutPage() {
  return <AboutClient />;
}
