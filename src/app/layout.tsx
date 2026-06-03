import type { Metadata } from "next";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { ToastProvider } from "@/components/Toaster";

export const metadata: Metadata = {
  title: "InsightStack — AI-Powered Finance Analytics",
  description:
    "Upload your transaction CSV, visualise spending patterns, and generate AI-powered insights. Built with Next.js, PostgreSQL, Prisma, and a custom FinanceAI engine.",
  keywords: ["finance", "analytics", "AI", "spending", "budget", "CSV", "FinanceAI"],
  openGraph: {
    title: "InsightStack — AI-Powered Finance Analytics",
    description:
      "Upload your transactions, visualise spending, and get AI-generated recommendations.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "InsightStack — AI-Powered Finance Analytics",
    description: "Upload your transactions, visualise spending, and get AI-generated recommendations.",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "InsightStack",
  "applicationCategory": "FinanceApplication",
  "operatingSystem": "Web",
  "description": "AI-powered personal finance analytics. Upload any bank CSV and get FinanceAI spending insights, anomaly detection, and budget recommendations in under 60 seconds.",
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
