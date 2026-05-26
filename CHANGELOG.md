# Changelog

All notable changes to InsightStack are documented here.  
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [Unreleased]

### In progress
- Custom domain configuration

---

## [1.3.0] — 2026-05-26

### Added
- **Playwright E2E test suite** (`tests/e2e/`) — 8 tests covering landing page, auth flow, CSV upload, and dataset detail navigation
- **Structured JSON logger** (`src/lib/logger.ts`) — replaces `console.*` in API routes with structured output (JSON in production, human-readable in development); includes `ts`, `level`, `event`, and context fields for log aggregator compatibility
- **SECURITY.md** — vulnerability reporting policy and security design overview
- **Dependabot config** — weekly npm dependency updates and monthly GitHub Actions updates, grouped by ecosystem (Prisma, Next.js/React)
- **Architecture diagram** in README — Mermaid flowchart of the full request/AI pipeline
- **Design Tradeoffs** section in README — honest engineering discussion of rate limiting, test strategy, caching, auth model, and AI boundary design
- **CONTRIBUTING.md** — local setup, test instructions, code style guide, PR process
- **GitHub issue templates** — bug report and feature request
- **Lint step in CI** — `npm run lint` now runs between type-check and Prisma validate

### Changed
- `npm run lint` now enforced in CI pipeline (previously configured but not run in CI)
- All `console.error` / `console.info` calls in API routes and `rateLimit.ts` replaced with `logger.error` / `logger.info`

---

## [1.2.0] — 2026-05-21

### Added
- **Real screenshots** in README (`docs/screenshots/`) — landing, dashboard, dataset-detail, insights, about — captured via Playwright against the live Vercel deployment
- **Automated screenshot script** (`scripts/take-screenshots.mjs`) — Playwright headless script for refreshing screenshots after UI changes
- **Privacy Policy** (`/privacy`) and **Terms of Service** (`/terms`) pages
- **MIT LICENSE** file
- **GitHub PR template** (`.github/PULL_REQUEST_TEMPLATE.md`)
- **Sample CSV download** on Demo page — `public/demo-transactions.csv` served as a static file
- **Back-to-top button** — fixed position, scroll-triggered visibility, smooth scroll
- **Custom delete confirmation modal** — replaces `window.confirm()` with a branded React modal
- **Vercel Analytics** — `@vercel/analytics/next` added to root layout
- **Page metadata** — `export const metadata` added to all public-facing pages
- **LinkedIn profile link** — in landing page footer, About page, and hero footnote
- **Mobile hamburger menu** — full-screen overlay navigation on small viewports
- **`LogoMark` SVG** — consistent across all page navbars

### Changed
- "Production-grade" section replaces the former testimonials section (cards: Zero-config upload, AI that explains its work, Tested and hardened)
- Hero footnote updated to credit builder and link to LinkedIn and GitHub
- Footer updated with Privacy, Terms, Contact, and LinkedIn links
- CTA button standardised to solid blue (removed `animate-border-spin` and `Magnetic` wrapper)
- All interior-page buttons standardised to `text-white` (was `text-zinc-900` on dark backgrounds)
- Login page stats updated: "60 s CSV to insight" and "$2.4k avg error caught"
- `text-zinc-900` → `text-white` on colored buttons across About, Demo, Dashboard, Dataset detail, Admin pages

---

## [1.1.0] — 2026-05-20

### Added
- **ActivityStrip** — live ticker replacing the static `TickerStrip`
- **`LogoMark` component** — SVG logo for use in navbars
- **`TiltCard` component** — mouse-tracking perspective tilt on feature cards
- **`Reveal` component** — intersection-observer fade-in animation
- **Dual-audience About page** — "For businesses" and "For recruiters" identity cards; builder identity card with LinkedIn and GitHub links
- **Admin panel** — user list, dataset list, admin-scoped delete (`/admin`)
- **AI fallback analyser** — local spending analysis runs when OpenAI is unavailable or returns malformed JSON

### Fixed
- Pricing/feature card equal-height layout (`h-full` on `TiltCard`)
- `tickers/route.ts` — removed Finnhub API call in build step that caused CI failures

---

## [1.0.0] — 2026-05-15

### Added
- Initial production release
- Full authentication system: register, login, logout, forgot password, reset password
- Dataset management: create, list, rename, delete
- CSV upload with row-level validation and atomic Prisma transaction inserts
- MetricSnapshot computation and 1-hour server-side cache
- Three analytics charts: category pie, monthly bar, net savings line
- AI insights via OpenAI GPT-4o with PII redaction, prompt hashing, and Zod validation
- DB-backed rate limiting (`RateLimitBucket` table)
- Immutable audit log (`AuditLog` table)
- CSRF enforcement for cookie-authenticated mutations
- HTTP security headers (CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy)
- Dual auth strategy: Bearer JWT + HttpOnly cookie, handled by shared middleware
- 29 real integration tests (no mocks) — auth, datasets, upload, metrics, filtering, insights, rename, delete
- GitHub Actions CI: type-check, Prisma validate, migrate, build, test — against real PostgreSQL
- Vercel deployment with Neon PostgreSQL
