# LinkedIn Post — InsightStack

**Post this exactly as written below. Change [YOUR LIVE URL] to your domain.**

---

## THE POST

I built a finance SaaS because I was tired of apps that ask for my bank password.

Here's what I shipped instead — and the one engineering decision that makes it different.

---

InsightStack analyses your spending without ever connecting to your bank.

Export a CSV (every bank supports this). Upload it. GPT-4o analyses your transactions and surfaces anomalies, category breakdowns, and recommendations — in 60 seconds. Your banking credentials stay where they belong.

The feature list is what you'd expect. What isn't obvious is the pipeline underneath.

**I designed the AI to never fail.**

Before any transaction data reaches OpenAI:
→ Emails, phone numbers, and long digit strings are stripped server-side
→ The payload is capped at 100 rows / 50k characters
→ A SHA-256 hash checks for a cached result first

When GPT-4o responds, every field is Zod-validated against a strict schema. If the model returns malformed JSON, times out, or the API is down — a local algorithm runs the same analysis automatically.

The user always gets an insight. They never know which path ran.

**Three other things I'm proud of:**

→ Rate limiting with zero external dependencies. A PostgreSQL RateLimitBucket table handles per-IP and per-user limits. I know exactly why I'd swap this for Redis at scale — but at this stage, the extra infrastructure isn't worth it.

→ 29 integration tests, zero mocks. Every test spawns a real Next.js server and hits a real PostgreSQL database. A mock that silently passes while a Prisma query shape has changed is worse than no test.

→ The quota system is enforced by counting immutable AuditLog rows — not a mutable counter. No race condition possible. No drift under concurrent requests.

Stack: Next.js 16 · TypeScript strict · PostgreSQL · Prisma 7 · OpenAI GPT-4o · Stripe · Vercel

Live demo → [YOUR LIVE URL]
Source → github.com/anishonly121/insightstack-blueprint

Open to full-stack or backend roles. Happy to walk through any of the architecture decisions above.

#buildinpublic #nextjs #typescript #openai #softwareengineering #fullstack #postgresql

---

## WHY THIS POST WORKS

- **First two lines** are the hook — visible before "see more". They create curiosity by naming a real problem.
- **"I designed the AI to never fail"** is the memorable line. Everyone remembers the one interesting thing.
- **Three specific engineering decisions** with honest reasoning — shows judgment, not just features.
- **Ends with a clear ask** — "open to roles" — so recruiters know what to do.
- **No defensive language** — doesn't mention "instead of applying for jobs."

---

## POSTING CHECKLIST

- [ ] Replace [YOUR LIVE URL] with your actual domain
- [ ] Post on a Tuesday, Wednesday, or Thursday
- [ ] Between 8–10am your local time
- [ ] Add `docs/screenshots/linkedin.png` as the image
- [ ] Reply to every comment within the first 60 minutes (algorithm rewards this)
- [ ] After posting, share it in any developer Discord/Slack communities you're in
