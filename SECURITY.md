# Security Policy

## Supported versions

| Version | Supported |
|---------|-----------|
| Latest (`main`) | ✅ |

## Reporting a vulnerability

**Please do not open a public GitHub issue for security vulnerabilities.**

Email **bholeanish3@gmail.com** with:

1. A clear description of the vulnerability
2. Steps to reproduce
3. Potential impact
4. Any suggested fix (optional but appreciated)

I'll acknowledge within 48 hours and aim to ship a fix within 7 days for confirmed critical issues.

## Security design

InsightStack is built with security as a first-class concern:

- **Authentication** — JWT + HttpOnly cookies; Bearer and cookie auth handled by a single shared middleware
- **CSRF** — Cookie-authenticated mutations require a matching CSRF header
- **Rate limiting** — Per-user and per-IP limits enforced via a DB-backed `RateLimitBucket` table
- **Data stays on the server** — Analysis runs in-process, so transaction data is never sent to a third-party AI service
- **Audit log** — Immutable `AuditLog` rows for every sensitive action (upload, insight generate, rename, delete)
- **Input validation** — All request bodies validated with Zod before processing; AI responses schema-validated before use
- **HTTP hardening** — CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, and Permissions-Policy headers on all responses
- **JSON hardening** — `415` returned on wrong Content-Type; `400` on malformed JSON bodies
- **Password hashing** — bcrypt with 10 rounds; enumeration-safe forgot-password flow

## Known limitations

- The dependency review on 2026-10-30 resolved the reported critical, high, and moderate advisories. Four low-severity audit entries remain in the optional SendGrid SDK dependency chain (`deepmerge`, `@sendgrid/helpers`, `@sendgrid/client`, `@sendgrid/mail`), all stemming from [GHSA-gcqx-w48m-w2h4](https://github.com/advisories/GHSA-gcqx-w48m-w2h4). npm currently proposes a breaking downgrade of SendGrid rather than a compatible fix. Review this upstream dependency before enabling production email delivery; do not use `npm audit fix --force` without testing the email integration.

- JWTs cannot be revoked before expiry; logout clears the HttpOnly cookie but a stolen Bearer token remains valid until expiry
- Rate limiting uses PostgreSQL rather than Redis; very high concurrency could cause write contention on `RateLimitBucket`
