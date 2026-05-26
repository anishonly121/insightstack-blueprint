# Contributing to InsightStack

Thanks for your interest. Here's everything you need to go from zero to a working local environment and a passing test suite.

## Local setup

**Prerequisites:** Node.js 18+, a PostgreSQL 16 database (free tier on [Neon](https://neon.tech) works fine).

```bash
git clone https://github.com/anishonly121/insightstack-blueprint.git
cd insightstack-blueprint/app
npm install
```

Copy `.env.example` to `.env` and fill in your values. The only required keys for local development are `DATABASE_URL`, `DIRECT_URL`, and `JWT_SECRET`. SendGrid and OpenAI keys are optional — features that need them degrade gracefully.

```bash
npx prisma migrate dev --name init
npx prisma generate
npx prisma db seed          # creates admin@insightstack.local / Admin12345!
npm run dev                 # http://localhost:3000
```

## Running tests

Tests require a production build and hit a real PostgreSQL database. A separate test database is strongly recommended.

```bash
npm run build
npm test
```

The suite spawns `next start`, polls `/api/health` until ready, then runs 29 integration tests covering auth, dataset CRUD, CSV upload, metrics, transaction filtering, AI insights, rename, and delete. No mocks.

## Before opening a PR

```bash
npx tsc --noEmit   # TypeScript
npm run lint        # ESLint
npm run build       # Production build
npm test            # All integration tests
```

All four must pass. The CI pipeline enforces them automatically — a failing check blocks merge.

## Pull request process

1. Open a PR against `main` with the template filled in
2. Describe *why* the change is needed, not just what it does
3. Keep PRs focused — one logical change per PR
4. If you add an environment variable, document it in `.env.example`

## Code style

- TypeScript strict mode is on — no `any` unless there's a comment explaining why
- No mocking in tests — if you add a test, it hits the real database
- New API routes get a corresponding integration test
- Comments only for non-obvious *why*, not *what*
