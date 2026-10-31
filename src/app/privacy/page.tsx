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
            <p className="leading-relaxed">The FinanceAI engine processes transaction descriptions, categories, dates, and amounts inside the application. It does not send these records to an external language-model service. Do not include bank account numbers or other unnecessary identifiers in your CSV: automatic removal of personal information is not guaranteed. If you choose to share an insight, its report and dataset name become accessible to anyone with that link until you revoke it.</p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold text-white">4. Data storage & security</h2>
            <p className="leading-relaxed">Account and transaction data is stored in PostgreSQL. Passwords are hashed with bcrypt. Authentication uses a session cookie and JWTs that expire after seven days. Account routes check ownership, and sensitive operations use request validation and rate limits. Use the HTTPS production site when uploading real data; a local development instance is separate from the hosted service.</p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold text-white">5. Your rights</h2>
            <p className="leading-relaxed">You can export transactions and delete your account and associated application records in account settings. An active subscription must be canceled before account deletion. For help or questions about data requests, contact <a href="mailto:bholeanish3@gmail.com" className="text-blue-400 hover:text-blue-300">bholeanish3@gmail.com</a>.</p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold text-white">6. Cookies</h2>
            <p className="leading-relaxed">We use a session cookie to maintain your authenticated state. The application includes Vercel Web Analytics for usage measurement. Payment and email providers also process information needed to provide their respective services when those features are enabled.</p>
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
