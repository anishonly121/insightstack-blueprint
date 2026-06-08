# LinkedIn Post — InsightStack

**Post this exactly as written below. Change [YOUR LIVE URL] to your domain.**

---

## THE POST

I built a finance SaaS because I was tired of apps that ask for my bank password.

Here's what I shipped instead — and the engineering decision that makes it different from every other "AI finance app" out there.

---

InsightStack analyses your spending without ever connecting to your bank.

Export a CSV (every bank supports this). Upload it. A custom AI engine analyses your transactions and surfaces anomalies, category breakdowns, and a financial health score — in under 10 seconds. Your banking credentials stay where they belong.

The feature list is what you'd expect. What isn't obvious is the AI underneath.

**I built the entire AI from scratch. No OpenAI. No external APIs. Zero cost at runtime.**

The engine has five layers:
→ BM25 probabilistic retrieval over a 38-document financial knowledge base (the same algorithm that powers Elasticsearch)
→ Ordinary least squares regression detects whether your spending is increasing, decreasing, or stable
→ Herfindahl-Hirschman Index (a DOJ antitrust metric) measures spending concentration across categories
→ An expert rule engine with 10 typed financial rules and confidence scores
→ A natural language generation layer composes the final narrative

It also forecasts next month's spending with a 95% confidence interval derived from OLS residuals — and assigns a Financial Health Score (0–100) that's fully explainable: tap "AI Reasoning" on any insight and see exactly which rules fired and why.

**Three other things I'm proud of:**

→ Rate limiting with zero external dependencies. A PostgreSQL RateLimitBucket table handles per-IP and per-user limits. I know exactly why I'd swap this for Redis at scale — but at this stage, the extra infrastructure isn't worth it.

→ 29 integration tests, zero mocks. Every test spawns a real Next.js server and hits a real PostgreSQL database. A mock that silently passes while a Prisma query shape has changed is worse than no test.

→ The quota system is enforced by counting immutable AuditLog rows — not a mutable counter. No race condition possible. No drift under concurrent requests.

Stack: Next.js 16 · TypeScript strict · PostgreSQL · Prisma 7 · FinanceAI (custom) · Stripe · Vercel

Live demo → [YOUR LIVE URL]
Source → github.com/anishonly121/insightstack-blueprint

Open to full-stack, backend, or AI/ML engineering roles. Happy to walk through any of the architecture decisions above.

#buildinpublic #nextjs #typescript #machinelearning #softwareengineering #fullstack #postgresql

---

## WHY THIS POST WORKS

- **First two lines** are the hook — visible before "see more". They create curiosity by naming a real problem.
- **"No OpenAI. No external APIs. Zero cost."** is the memorable line — every engineer will stop and re-read.
- **Named algorithms** (BM25, OLS, HHI) signal you understand what you built, not just that you built it.
- **Three specific engineering decisions** with honest reasoning — shows judgment, not just features.
- **Ends with a clear ask** and mentions AI/ML roles specifically.
- **No defensive language** — doesn't mention "instead of applying for jobs."

---

## POSTING CHECKLIST

- [ ] Replace [YOUR LIVE URL] with your actual domain
- [ ] Post on a Tuesday, Wednesday, or Thursday
- [ ] Between 8–10am your local time
- [ ] Add `docs/screenshots/insights.png` as the image (shows health score ring + FinanceAI output)
- [ ] Reply to every comment within the first 60 minutes (algorithm rewards this)
- [ ] After posting, share it in any developer Discord/Slack communities you're in
