import Link from "next/link";
import { LogoMark } from "@/components/LogoMark";

export const metadata = { title: "Privacy Policy — InsightStack" };

export default function PrivacyPage() {
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
        <h1 className="mb-2 text-4xl font-black text-white">Privacy Policy</h1>
        <p className="mb-12 text-sm text-zinc-500">Last updated: May 2026</p>

        <div className="space-y-10 text-zinc-400">
          <section>
            <h2 className="mb-3 text-lg font-bold text-white">1. What we collect</h2>
            <p className="leading-relaxed">We collect information you provide directly: your name, email address, and password when you register. When you upload a CSV file, the transaction data within that file is stored securely in our database and associated with your account.</p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold text-white">2. How we use your data</h2>
            <ul className="space-y-2 leading-relaxed">
              <li className="flex gap-2"><span className="text-blue-400 flex-shrink-0">·</span> To provide the InsightStack analytics service, including AI-generated spending insights.</li>
              <li className="flex gap-2"><span className="text-blue-400 flex-shrink-0">·</span> To send transactional emails (password resets, account notifications) via SendGrid.</li>
              <li className="flex gap-2"><span className="text-blue-400 flex-shrink-0">·</span> To improve the platform through aggregated, anonymised usage metrics.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold text-white">3. AI processing & PII</h2>
            <p className="leading-relaxed">Before any transaction data is sent to OpenAI for analysis, personally identifiable information (names, account numbers, reference codes) is redacted server-side. We do not share identifiable financial data with third parties for advertising or profiling purposes.</p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold text-white">4. Data storage & security</h2>
            <p className="leading-relaxed">Data is stored in a PostgreSQL database hosted on Neon (Vercel Postgres). Passwords are hashed with bcrypt. All data is transmitted over HTTPS/TLS. Access tokens are short-lived JWTs. We apply rate limiting and CSRF protection across all mutating endpoints.</p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold text-white">5. Your rights</h2>
            <p className="leading-relaxed">You can delete your account and all associated data at any time by contacting us at <a href="mailto:bholeanish3@gmail.com" className="text-blue-400 hover:text-blue-300">bholeanish3@gmail.com</a>. We will action deletion requests within 30 days.</p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold text-white">6. Cookies</h2>
            <p className="leading-relaxed">We use a single session cookie to maintain your authenticated state. We do not use advertising cookies or third-party tracking scripts.</p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold text-white">7. Contact</h2>
            <p className="leading-relaxed">Questions about this policy? Email <a href="mailto:bholeanish3@gmail.com" className="text-blue-400 hover:text-blue-300">bholeanish3@gmail.com</a>.</p>
          </section>
        </div>

        <div className="mt-14 flex gap-4 border-t border-white/[0.05] pt-8">
          <Link href="/terms" className="text-sm text-zinc-500 transition hover:text-zinc-300">Terms of Service →</Link>
          <Link href="/" className="text-sm text-zinc-500 transition hover:text-zinc-300">← Back to home</Link>
        </div>
      </main>
    </div>
  );
}
