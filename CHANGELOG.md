# Changelog

All notable changes to InsightStack are documented here.  
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [Unreleased]

---

## [2.0.0] — 2026-06-03

### Added

**UX & Polish**
- **Toast notification system** (`src/components/Toaster.tsx`) — `ToastProvider` + `useToast()` hook wired to the root layout; four types (success, error, warning, info); slide-in animation, auto-dismiss after 4 s, manual close, stacking support; used across all dashboard actions
- **FAQ accordion** — CSS `grid-template-rows: 0fr → 1fr` transition on both landing page and `/pricing`; single item open at a time; no max-height snapping
- **Annual / monthly billing toggle** — present on landing page `#pricing` section and standalone `/pricing` page; Pro plan switches between `$9/mo` (monthly) and `$7/mo billed $84/yr` (annual); animated "Save 20%" badge slides in on toggle
- **Drag-and-drop CSV upload** — full drag event handling (`dragover`, `dragenter`, `dragleave`, `drop`) on every dataset card; visual feedback (border + background transitions) when a file is dragged over; non-CSV files silently rejected; click-to-browse preserved
- **Demo dataset loader** — "Try with demo data — one click" button in the empty dashboard state; creates a `Demo: Q1 2026 Operating Expenses` dataset and uploads a 47-row sample CSV with a built-in `$1,247` anomaly spike via the real API; shows loading spinner + success toast on completion
- **Keyboard shortcuts panel** — `?` key (or `?` button in dashboard header) opens a modal listing all shortcuts; `N` focuses the new-dataset input, `←/→` paginate datasets, `Esc` closes; shortcuts disabled while typing in any `<input>` or `<textarea>`
- **Sample CSV download** — "Download sample CSV to try it" link under the hero CTAs; generates a 47-row realistic financial dataset client-side and downloads it; same data as the demo dataset loader
- **`src/app/robots.ts`** — Next.js Metadata API robot rules; disallows `/dashboard`, `/admin`, `/api/` from all crawlers; includes sitemap URL
- **`src/app/sitemap.ts`** — auto-generated sitemap for all 8 public routes with correct priorities and change frequencies

### Fixed
- **HSTS header** — `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` added to `next.config.ts`; the `about` page security list was already claiming HSTS, now the header is actually present
- **TiltCard `relative` positioning** — production-grade feature cards on the landing page had `absolute inset-0` hover-gradient overlays without a `position: relative` ancestor; overlays now correctly constrained to each card
- **`/pricing` page "Coming soon" badge** — replaced with "Most popular" to match the landing page CTA ("Start 14-day free trial")

---

## [1.5.0] — 2026-05-27

### Added
- **`GET /api/auth/me/quota`** — returns `{ insightsToday, quota, remaining }` for today's insight usage; shares the same UTC day window logic as the insights POST route
- **`GET /api/activity` pagination** — `page` and `pageSize` query params (Zod-validated); parallel `prisma.$transaction([findMany, count])` for efficient paging; response includes `meta.totalPages`
- **`/dashboard/activity` page** — full activity log UI: per-action icons and colors (10 action types mapped), relative timestamps stable to page load, "Load more" append-pagination showing remaining count
- **Quota progress bar** on dataset detail page — inline `X/30 today` counter with color transitions (cyan → amber at >20 → red at 30); Generate Insights button disabled when limit reached
- **Activity link** in dashboard header alongside existing Settings link

### Fixed
- React Compiler purity violation in `RelativeTime` — `Date.now()` moved to module-level constant; `nowMs` prop removed from component signature

---

## [1.4.0] — 2026-05-27

### Added
- **`src/app/error.tsx`** — global Next.js error boundary: branded 500 page with "Try again" (calls `reset()`) and "Go to dashboard", shows `error.digest` for log correlation
- **`src/app/dashboard/error.tsx`** — dashboard-scoped error boundary with compact inline card design
- **`/dashboard/settings` page** — account settings: profile display, change password (requires current password + confirmation), delete account (requires password + typed phrase "delete my account")
- **`PATCH /api/auth/me`** — change password endpoint; validates current password before updating; writes `PASSWORD_CHANGED` audit log entry
- **`DELETE /api/auth/me`** — delete account endpoint; requires password confirmation; cascades via Prisma relations; clears auth cookie on success
- **Settings link** in dashboard header and dataset detail header — consistent access from all authenticated views
- **Insight quota tooltip** on "AI Insights" button — surfaces the 30/day limit so users aren't surprised by a 429 error

### Fixed
- 2 ESLint errors in `page.tsx`: `<a href="/#pricing">` replaced with `<Link>` (would have failed the CI lint step)
- Stale `eslint-disable-next-line` directive removed from `admin/page.tsx`
- Unused `writeFileSync` import removed from `take-screenshots.mjs`

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
