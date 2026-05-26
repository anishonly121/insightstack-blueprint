import Link from "next/link";
import { LogoMark } from "@/components/LogoMark";

export const metadata = { title: "Terms of Service — InsightStack" };

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#050B18] text-white">
      <nav className="sticky top-0 z-50 border-b border-white/[0.05] bg-[#050B18]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2 text-[15px] font-bold tracking-tight text-white">
            <LogoMark size={24} />
            <span>Insight<span className="text-blue-400">Stack</span></span>
          </Link>
          <Link href="/login" className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-400">Open App</Link>
        </div>
      </nav>

      <main className="mx-auto max-w-4xl px-6 py-20">
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-blue-400">Legal</p>
        <h1 className="mb-2 text-4xl font-black text-white">Terms of Service</h1>
        <p className="mb-12 text-sm text-zinc-500">Last updated: May 2026</p>

        <div className="space-y-10 text-zinc-400">
          <section>
            <h2 className="mb-3 text-lg font-bold text-white">1. Acceptance</h2>
            <p className="leading-relaxed">By creating an account or using InsightStack, you agree to these Terms of Service. If you do not agree, do not use the service.</p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold text-white">2. Service description</h2>
            <p className="leading-relaxed">InsightStack is a financial analytics platform that processes CSV transaction data and generates AI-powered spending insights. The service is provided as-is. Insights are informational and do not constitute financial advice.</p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold text-white">3. Your account</h2>
            <ul className="space-y-2 leading-relaxed">
              <li className="flex gap-2"><span className="text-blue-400 flex-shrink-0">·</span> You are responsible for maintaining the confidentiality of your password.</li>
              <li className="flex gap-2"><span className="text-blue-400 flex-shrink-0">·</span> You must be 18 or older to use the service.</li>
              <li className="flex gap-2"><span className="text-blue-400 flex-shrink-0">·</span> You may not share your account credentials with others.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold text-white">4. Acceptable use</h2>
            <p className="leading-relaxed">You agree not to upload data you do not own or have permission to process, attempt to reverse-engineer the platform, use the service to process data for illegal purposes, or attempt to circumvent rate limits or access controls.</p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold text-white">5. Data ownership</h2>
            <p className="leading-relaxed">You retain full ownership of the data you upload. InsightStack does not claim any rights to your financial data. We process it solely to provide the service you requested.</p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold text-white">6. Limitation of liability</h2>
            <p className="leading-relaxed">InsightStack is provided without warranty. We are not liable for decisions made based on AI-generated insights. The service is a tool to assist analysis, not a substitute for professional financial advice.</p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold text-white">7. Changes to the service</h2>
            <p className="leading-relaxed">We reserve the right to modify or discontinue any part of the service at any time. We will make reasonable efforts to notify users of significant changes.</p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold text-white">8. Contact</h2>
            <p className="leading-relaxed">Questions? Email <a href="mailto:bholeanish3@gmail.com" className="text-blue-400 hover:text-blue-300">bholeanish3@gmail.com</a>.</p>
          </section>
        </div>

        <div className="mt-14 flex gap-4 border-t border-white/[0.05] pt-8">
          <Link href="/privacy" className="text-sm text-zinc-500 transition hover:text-zinc-300">Privacy Policy →</Link>
          <Link href="/" className="text-sm text-zinc-500 transition hover:text-zinc-300">← Back to home</Link>
        </div>
      </main>
    </div>
  );
}
