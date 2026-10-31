# Release verification

Verified on 2026-10-31. Production application: https://insightstack-peach.vercel.app

## Published release

- Release PR: https://github.com/anishonly121/insightstack-blueprint/pull/13
- Application release commit: `e49b88bd4c840ec5798316cbc8feb8054bf8d9c7`.
- Node.js is pinned to `24.x`, matching CI and the verified local runtime.
- CI passed all 71 tests: 11 unit, 33 PostgreSQL API integration, 11 public browser, and 16 account browser tests.
- CI evidence: https://github.com/anishonly121/insightstack-blueprint/actions/runs/41177750368

## Production checks

- Vercel production deployment completed successfully.
- Database health, registration, login, dataset creation, CSV import, transaction retrieval, metrics, and persisted insights passed against the public production URL.
- A synthetic dataset returned exactly 1000 income, 100 expenses, and 900 net savings with calculation version 3.
- The temporary verification account and its associated dataset were removed afterward.
- All 11 public browser tests passed against production, including mobile navigation, filtering, CSV downloads, pricing, and recovery-page rendering.
- Stripe checkout session creation returned HTTP 200 using the configured **test-mode** credentials. The hosted checkout browser check timed out. No payment details were entered and no subscription was started.

## Required before accepting paying customers

1. Configure `SENDGRID_API_KEY` in Vercel Production, verify the sender matching `SENDGRID_FROM_EMAIL`, and confirm the configured reset-password template is active. Redeploy, then verify receipt and consumption of an actual reset email. Scheduled digests also require `CRON_SECRET` and the alert template. Inbox delivery has not been verified.
2. Complete Stripe account activation and configure the corresponding live secret key, live price ID, publishable key, and live webhook signing secret. Verify checkout, subscription updates, billing management, and cancellation in the provider's test environment before switching to live mode. The current production configuration creates test-mode checkout sessions.
3. Configure an isolated Preview database, `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, and the correct application URL before relying on pull-request preview deployments. The production variables are currently scoped to Production. Do not point disposable integration tests at the production database.

The local and CI suites use isolated databases. Passing those tests does not establish email delivery, real payment settlement, or customer usage.
