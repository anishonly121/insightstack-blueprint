import type { Metadata } from "next";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { ToastProvider } from "@/components/Toaster";

export const metadata: Metadata = {
  title: "InsightStack — AI-Powered Finance Analytics",
  description:
    "Upload your transaction CSV, visualise spending patterns, and generate AI-powered insights with OpenAI. Built with Next.js, PostgreSQL, and Prisma.",
  keywords: ["finance", "analytics", "AI", "spending", "budget", "CSV", "OpenAI"],
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
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
