import type { Metadata } from "next";
import { AboutClient } from "./AboutClient";

export const metadata: Metadata = {
  title: "About — Anish Bhole",
  description:
    "Anish Bhole — full-stack software engineer and IT student at Singapore Polytechnic. Currently interning at CapitaLand. Builds production-grade apps, AI pipelines, and IoT systems. Based in Singapore.",
};

export default function AboutPage() {
  return <AboutClient />;
}
