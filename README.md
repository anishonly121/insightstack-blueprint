# InsightStack — AI-Powered Personal Finance Analytics

> Upload your transactions. Understand your spending. Get AI-driven recommendations.

InsightStack is a full-stack web application that transforms raw CSV transaction data into a visual financial dashboard with OpenAI-generated spending insights. Built to production standards — authenticated, audited, rate-limited, and fully tested.

**[Live Demo](#)** · **[GitHub](https://github.com/anishonly121/insightstack-blueprint)** · **[API Docs](#api-reference)**

---

## Screenshots

> _Add screenshots of the landing page, dashboard, and insight cards here before publishing._

| Landing | Dashboard | Insights |
|---------|-----------|---------|
| ![Landing](docs/landing.png) | ![Dashboard](docs/dashboard.png) | ![Insights](docs/insights.png) |

---

## What It Does

| Step | What Happens |
|------|-------------|
| 1. Register / Login | JWT-authenticated account with HttpOnly cookie support |
| 2. Create a Dataset | Named container for a CSV upload |
| 3. Upload CSV | Parse, validate, and store transaction rows in PostgreSQL |
| 4. View Dashboard | Income vs. expenses, savings rate, monthly bar chart, category pie chart |
| 5. Search Transactions | Filter by category or search description with server-side pagination |
| 6. Generate AI Insights | OpenAI analyses spending — returns summary, anomalies, top categories, 3 recommendations |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, TypeScript) |
| Database | PostgreSQL via [Neon](https://neon.tech) |
| ORM | Prisma 7 |
| Auth | JWT + bcryptjs + HttpOnly cookies |
| Validation | Zod (request bodies + AI response schema) |
| CSV Parsing | Papa Parse |
| Charts | Recharts (Pie, Bar, Line) |
| Styling | Tailwind CSS v4 |
| AI | OpenAI GPT-4o-mini |
| Email | SendGrid (password reset) |
| Testing | Node.js built-in test runner (integration tests) |

---

## Features

### Authentication
- Register, login, logout, forgot password, reset password
- JWT signed tokens + HttpOnly cookie auth (both supported simultaneously)
- bcrypt password hashing (10 rounds)
- Enumeration-safe forgot-password response
- Role-based access control: `USER` / `ADMIN`

### Dataset Management
- Create, list (paginated), view, rename, delete datasets
- CSV upload with row-level validation — bad rows skipped, good rows inserted atomically
- Dataset status: `UPLOADED` → `PARSED` / `FAILED`
- Preview JSON stored for first-load display

### Analytics & Metrics
- Server-computed `MetricSnapshot` per dataset: total income, total expenses, net savings, savings rate, avg transaction, top categories, monthly breakdown
- Results cached for 1 hour and served from PostgreSQL — no redundant computation
- Three charts: category pie, monthly income/expense bar, net savings trend line

### Transaction Explorer
- Search by description (case-insensitive, server-side)
- Filter by category — dropdown populated from actual data
- Paginated results (25 per page) with sort support
- One-click CSV export of the current view

### AI Insights
- PII redaction before sending to OpenAI (email, phone, NRIC, long digit strings)
- Payload capped at 100 transactions / 50k characters
- Response schema-validated with Zod — fallback local analysis if OpenAI fails or returns malformed JSON
- Results cached by prompt hash — identical data skips the API call
- Daily quota of 30 insights per user (enforced via AuditLog counting)
- Per-user, per-IP rate limit: 20 requests/min on the insights endpoint
- Structured output: summary, top categories with reasons, anomalies, 3 recommendations

### Security
- Content-Security-Policy, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy headers on all routes
- CSRF enforcement for cookie-authenticated mutations
- JSON body hardening: `415` on wrong Content-Type, `400` on malformed JSON
- Request correlation IDs (`x-request-id`) on all requests and error responses
- Immutable AuditLog for all sensitive actions (upload, insight generate, rename, delete)
- DB-backed rate limiting (`RateLimitBucket` table with opportunistic cleanup)

### Admin Panel
- Tabbed interface: view all users and all datasets
- Dataset delete (admin-scoped)
- Accessible only to users with `ADMIN` role

---

## Database Schema

```
User ──< Dataset ──< Transaction
              └──< MetricSnapshot
              └──< Insight
User ──< AuditLog
User ──< PasswordResetToken
RateLimitBucket (keyed by action + user + IP)
```

---

## API Reference

### Auth
| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/auth/register` | Create account → returns JWT |
| `POST` | `/api/auth/login` | Login → returns JWT + sets HttpOnly cookie |
| `GET` | `/api/auth/me` | Get current user (Bearer or cookie) |
| `POST` | `/api/auth/logout` | Clear auth cookie |
| `POST` | `/api/auth/forgot-password` | Send password reset email |
| `POST` | `/api/auth/reset-password` | Consume reset token, set new password |

### Datasets
| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/datasets` | Create dataset |
| `GET` | `/api/datasets` | List datasets (paginated, sorted) |
| `GET` | `/api/datasets/:id` | Get dataset + transaction stats |
| `PATCH` | `/api/datasets/:id` | Rename dataset |
| `DELETE` | `/api/datasets/:id` | Delete dataset (cascades) |
| `POST` | `/api/datasets/:id/upload` | Upload + parse CSV |
| `GET` | `/api/datasets/:id/metrics` | Get computed MetricSnapshot (1hr cache) |
| `GET` | `/api/datasets/:id/transactions` | List transactions (search, filter, paginate) |
| `POST` | `/api/datasets/:id/insights` | Generate AI insight |
| `GET` | `/api/datasets/:id/insights` | List insights (paginated) |

### Admin
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/admin/users` | List all users |
| `GET` | `/api/admin/datasets` | List all datasets |
| `DELETE` | `/api/admin/datasets/:id` | Delete any dataset |

### Other
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/health` | Health check with request ID |
| `GET` | `/api/activity` | Recent audit log for current user |

---

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database — free tier on [Neon](https://neon.tech) or [Supabase](https://supabase.com) works fine

### 1. Clone & install

```bash
git clone https://github.com/anishonly121/insightstack-blueprint.git
cd insightstack-blueprint/app
npm install
```

### 2. Configure environment

Create `app/.env`:

```env
DATABASE_URL="postgresql://<user>:<pass>@<host>-pooler.neon.tech/<db>?sslmode=require"
DIRECT_URL="postgresql://<user>:<pass>@<host>.neon.tech/<db>?sslmode=require"
JWT_SECRET="replace-with-a-32-char-minimum-random-string"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_APP_NAME="InsightStack"
OPENAI_API_KEY="sk-..."
SENDGRID_API_KEY=""
SENDGRID_FROM_EMAIL="your-verified-sender@example.com"
SENDGRID_TEMPLATE_RESET_PASSWORD="d-..."
NODE_ENV="development"
```

### 3. Run migrations & seed

```bash
npx prisma migrate dev --name init
npx prisma generate
npx prisma db seed   # creates admin@insightstack.local / Admin12345!
```

### 4. Start dev server

```bash
npm run dev
```

Visit `http://localhost:3000`

### 5. Test with sample data

A sample CSV is at `docs/demo-transactions.csv`. Create a dataset, upload it, then hit **Generate Insights**.

### CSV format

```csv
date,description,category,amount
2026-01-02,McDonalds,Food,-9.50
2026-01-22,Salary,Income,1200.00
2026-01-25,Phone bill,Utilities,-25.00
```

---

## Running Tests

Tests spin up `next start` against a real database and run 29 integration tests across auth, datasets, upload, metrics, transaction filtering, insights, rename, and delete.

```bash
npm run build   # required before tests
npm test
```

---

## Deployment (Vercel + Neon)

1. Push this repo to GitHub
2. Import into [Vercel](https://vercel.com) — set root directory to `app/`
3. Add all environment variables from `.env` in the Vercel dashboard
4. Run migrations against your production database:
   ```bash
   npx prisma migrate deploy
   ```
5. Deploy — Vercel will run `npm run build` automatically

---

## Project Structure

```
app/
├── src/
│   ├── app/
│   │   ├── page.tsx                    # Landing page
│   │   ├── login/                      # Login + register
│   │   ├── dashboard/                  # Main dashboard + dataset detail
│   │   ├── about/                      # About page
│   │   ├── demo/                       # Demo walkthrough
│   │   ├── admin/                      # Admin panel
│   │   └── api/                        # All API route handlers
│   └── lib/
│       ├── api.ts                      # Client-side API wrapper + types
│       ├── auth.ts                     # JWT sign/verify + middleware
│       ├── prisma.ts                   # Prisma client singleton
│       ├── rateLimit.ts                # DB-backed rate limiter
│       ├── audit.ts                    # Audit log writer
│       ├── csrf.ts                     # CSRF enforcement
│       ├── mail.ts                     # SendGrid wrapper
│       └── env.ts                      # Validated env vars
├── prisma/
│   ├── schema.prisma                   # Full data model
│   ├── seed.ts                         # Admin user seed
│   └── migrations/                     # Migration history
└── tests/
    ├── auth.integration.test.mjs       # Auth endpoint tests
    ├── datasets.integration.test.mjs   # Dataset CRUD + upload tests
    ├── admin.integration.test.mjs      # Admin access control tests
    └── metrics.integration.test.mjs    # Metrics, filters, insights, rename, delete
```

---

## License

MIT — free to use, fork, and build on.
