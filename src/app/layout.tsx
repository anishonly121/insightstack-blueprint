import type { Metadata } from "next";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { ToastProvider } from "@/components/Toaster";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://insightstack-peach.vercel.app"),
  title: "InsightStack | A clearer perspective on your finances",
  description:
    "Explore your cash flow, understand spending patterns, and plan your next step. Try an interactive finance workspace without an account.",
  keywords: ["finance", "analytics", "AI", "spending", "budget", "CSV", "FinanceAI"],
  openGraph: {
    title: "InsightStack | Your money. A clearer perspective.",
    description:
      "Turn transaction rows into a clearer financial picture. Explore the interactive demo, built by Anish Bhole.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "InsightStack | Your money. A clearer perspective.",
    description: "A finance workspace with explainable analysis and an interactive demo. Built by Anish Bhole.",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "InsightStack",
  "applicationCategory": "FinanceApplication",
  "operatingSystem": "Web",
  "description": "Finance analytics with structured CSV imports, cash-flow metrics, explainable spending insights, and an interactive sample workspace.",
  "url": process.env.NEXT_PUBLIC_APP_URL ?? "https://insightstack-peach.vercel.app",
  "author": {
    "@type": "Person",
    "name": "Anish Bhole",
    "url": "https://www.linkedin.com/in/anishbhole/"
  },
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD",
    "description": "Free plan available. Pro plan at $9/month."
  },
  "featureList": [
    "CSV bank statement import",
    "FinanceAI spending analysis",
    "Anomaly detection",
    "Budget tracking and alerts",
    "Category breakdown charts",
    "Monthly trend analysis",
    "Shareable insight reports"
  ]
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className="antialiased"
        style={
          {
            "--font-geist-sans":
              "system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
            "--font-geist-mono":
              "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace",
          } as React.CSSProperties
        }
      >
        <ToastProvider>
          {children}
        </ToastProvider>
        <Analytics />
      </body>
    </html>
  );
}
