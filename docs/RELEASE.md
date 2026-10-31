# Release verification

Verified on 2026-11-01 (Asia/Singapore). Production application: https://insightstack-peach.vercel.app

## Published release

- Release PR: https://github.com/anishonly121/insightstack-blueprint/pull/13
- Application release commit: `e49b88bd4c840ec5798316cbc8feb8054bf8d9c7`.
- Node.js is pinned to `24.x`, matching CI and the verified local runtime.
- The final verification passed all 74 tests: 14 unit, 33 PostgreSQL API integration, 11 public browser, and 16 account browser tests. Public browser tests ran against production; API and account tests used an isolated local database. Production build, TypeScript, lint, and Prisma validation passed.
- CI evidence: https://github.com/anishonly121/insightstack-blueprint/actions/runs/41177750368

## Production checks

- Vercel production deployment completed successfully.
- Database health, registration, login, dataset creation, CSV import, transaction retrieval, metrics, and persisted insights passed against the public production URL.
- A synthetic dataset returned exactly 1000 income, 100 expenses, and 900 net savings with calculation version 3.
- The temporary verification account and its associated dataset were removed afterward.
- All 11 public browser tests passed against production, including mobile navigation, filtering, CSV downloads, pricing, and recovery-page rendering.
- Brevo password-reset email reached the Gmail inbox. The production link reset a disposable account, login with the new password succeeded, and reuse was rejected. The disposable account was removed. Gmail reported SPF, DKIM, and DMARC passing; Brevo rewrote the Gmail sender to its authenticated sending domain.
- Stripe checkout session creation returned HTTP 200 using the configured **test-mode** credentials. The hosted Sandbox checkout loaded with a 14-day trial and SGD 9.00 per month. The pricing currency label was corrected to match. No payment details were entered and no subscription was started; the full billing lifecycle remains unverified.

## Required before accepting paying customers

1. If scheduled digests are offered, configure and verify `CRON_SECRET` and scheduling, then verify delivery. Password-reset email is configured through `BREVO_API_KEY` and `EMAIL_FROM` and has passed the live delivery and reset checks.
2. Complete Stripe account activation and configure the corresponding live secret key, live price ID, publishable key, and live webhook signing secret. Verify checkout, subscription updates, billing management, and cancellation in the provider's test environment before switching to live mode. The current production configuration creates test-mode checkout sessions.
3. Configure an isolated Preview database, `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, and the correct application URL before relying on pull-request preview deployments. The production variables are currently scoped to Production. Do not point disposable integration tests at the production database.

The local and CI suites use isolated databases. Live password-reset delivery was verified separately. Passing these tests does not establish real payment settlement, full billing lifecycle correctness, customer usage, or the absence of all bugs.
