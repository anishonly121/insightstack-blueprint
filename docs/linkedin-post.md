# LinkedIn Post — InsightStack Launch

---

## Option A — Technical angle (best for engineering roles)

I spent the last few weeks building a production-grade full-stack app instead of applying to more jobs.

Here's what went into it:

**InsightStack** — upload a bank CSV, get AI-powered spending insights in under a minute.

The user flow is simple. The engineering behind it isn't.

🔐 **Auth**: JWT + bcrypt + HttpOnly cookies + CSRF protection. Dual strategy means API clients use Bearer tokens while browser navigations use cookies — same middleware handles both.

📊 **Metrics engine**: server-side aggregation of income, expenses, savings rate, and category breakdowns — cached as PostgreSQL MetricSnapshots with a 1-hour TTL. No redundant computation on every dashboard load.

🤖 **AI pipeline**: PII-redacted transactions → GPT-4o-mini → Zod schema validation. If OpenAI fails or returns malformed JSON, a local fallback algorithm runs automatically. The user always gets a response.

🛡️ **Rate limiting without Redis**: a single `RateLimitBucket` table in PostgreSQL handles per-user and per-IP limits with opportunistic row cleanup. Zero external dependencies.

📋 **Immutable audit log**: every upload, rename, delete, and insight generation appends a row. Daily quota enforcement is a COUNT query — no mutable counters that can drift under concurrent requests.

✅ **29 integration tests** against a real PostgreSQL database. No mocks. Tests spawn the actual Next.js production server and make real HTTP calls.

**Stack**: Next.js 16 · React 19 · TypeScript · Prisma 7 · PostgreSQL (Neon) · OpenAI · Tailwind CSS v4 · Vercel

Try it live 👉 https://insightstack-peach.vercel.app
Source code 👉 github.com/anishonly121/insightstack-blueprint

---

## Option B — Story angle (higher engagement, broader audience)

Most portfolio projects are TODO apps or weather widgets.

I built InsightStack instead.

It's a full-stack finance analytics app: upload a CSV of your bank transactions, visualise your spending, and get AI-generated recommendations from GPT-4o-mini.

What I'm proud of isn't the feature list — it's the engineering decisions that don't show up in a screenshot:

→ LLM output is always Zod-validated. If GPT-4o-mini returns malformed JSON (it happens), a local fallback analyser runs automatically.

→ Rate limiting runs on PostgreSQL with zero external dependencies. No Redis, no external queue — just a table with opportunistic cleanup.

→ 29 integration tests. They spawn the real Next.js server, hit a real PostgreSQL database, and make real HTTP requests. No mocks that can silently diverge from production.

→ MetricSnapshot caching means expensive aggregation queries run once per hour, not on every page load.

Six weeks of evenings and weekends. One production-grade codebase I'm genuinely proud of.

Live demo: https://insightstack-peach.vercel.app
Source: github.com/anishonly121/insightstack-blueprint

---

## Hashtags (add to either post)

#FullStack #NextJS #React #TypeScript #OpenAI #PostgreSQL #WebDevelopment #SoftwareEngineering #JavaScript #BuildInPublic #Portfolio #TechCareers

---

## Tips for posting

- Post in the morning (8–10am your timezone) on a Tuesday/Wednesday for best reach
- Add 1–2 screenshots: the landing page hero and the dataset detail charts view
- If you have a video walkthrough (even a Loom), link it — video posts get 5× the reach
- Reply to every comment in the first hour — early engagement boosts distribution
- Tag the tech companies if you want: @Vercel @OpenAI etc. (optional, use sparingly)
