# SalesAI

A full-stack sales CRM purpose-built for a Malaysian solo founder selling 2-day vibe-coding workshops. The intent: run an entire sales cycle — from cold lead through paid invoice — without leaving the app.

Workshop economics: **RM 3,500 / pax + 8% SST**, cohorts capped at ~35.

## What's inside

| Surface | What it does |
|---|---|
| `/today` | Daily task queue: scheduled calls (next 7 days), urgency-bucketed actions (overdue / today / this week / later), per-task snooze, quick-capture for ad-hoc reminders |
| `/clients` | Client list with stage, industry, size, and readiness filters |
| `/clients/[id]` | Client detail: discovery profile (goals, pain points, stack, decision-makers, budget/timeline signals, source), unified timeline of all calls + proposals + audits, deal list with one-click tax invoice |
| `/clients/[id]/health-check` | AI-generated readiness audit across 6 engineering dimensions |
| `/calls/[id]` | Pre-call AI briefing → notes (auto-saved) → post-call AI debrief → one-click "Draft email" follow-up |
| `/pipeline` | SPANCO kanban (Suspect → Prospect → Analysis → Negotiation → Conclusion → Order), drag-to-move |
| `/api/proposal/pdf` | Workshop proposal PDF generator |
| `/api/invoice/pdf` | 8% SST tax invoice PDF generator with auto-incrementing `INV-{YYYY}-{NNNN}` numbering |
| Dashboard "Generate coaching plan" button | On-demand: grades the founder's recent closing calls and rewrites the coaching panel |

## AI features

All AI features use [DeepSeek](https://platform.deepseek.com) via the [Vercel AI SDK](https://sdk.vercel.ai/) with structured Zod-validated outputs. The client's discovery profile (goals, pain points, decision-maker stances, stack) is fed into every prompt so AI output references the founder's actual knowledge, not generic boilerplate.

| Feature | What it produces |
|---|---|
| Pre-call briefing | Tailored discovery questions, predicted objections, target stage move, watchouts |
| Call debrief | Outcome classification, commitments extracted, suggested next stage, coaching note. Cross-references the briefing's plan to flag missed objectives. |
| Draft follow-up email | Subject + body grounded in debrief + proposal + decision-maker stances; copy-paste into Gmail |
| Workshop proposal | Cohort sizing, day-1/day-2 module split, venue recommendation, dates, follow-ups, next steps. Differentiates from prior proposals on regeneration. |
| Readiness audit | 6-dimension scoring (Tooling, Practices, Culture, Velocity, Adoption, Outcomes) with risks + recommended actions |
| Closing-call grader | Manually triggered from the dashboard; grades recently-closed call transcripts |
| Deal insight | One-line strategic context for kanban cards |

## Tech stack

- **Next.js 16** (App Router) on **Node.js runtime**
- **Drizzle ORM** + **libSQL/Turso** (edge-distributed SQLite)
- **DeepSeek** via `@ai-sdk/deepseek` + `ai` SDK v6
- **@react-pdf/renderer** for proposal & invoice PDFs
- **Tailwind v4** with OKLCH design tokens, light/dark theme
- **Zod** for AI output schema validation
- **dnd-kit** for kanban drag-and-drop

## Local setup

### Prerequisites

- Node.js 20+
- A [Turso](https://turso.tech) database (`turso db create salesai-dev`)
- A [DeepSeek API key](https://platform.deepseek.com)

### First-run

```bash
cp .env.example .env.local
# Fill in TURSO_DATABASE_URL, TURSO_AUTH_TOKEN, DEEPSEEK_API_KEY, CRON_SECRET

npm install
npm run db:push    # sync schema to Turso
npm run db:seed    # 14 Malaysian SME clients + matching pipeline deals
npm run dev
```

### Common scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server with Webpack (Next 16 default for now) |
| `npm run build` | Production build |
| `npm run db:push` | Sync schema to DB (no migration history; for dev) |
| `npm run db:generate` | Produce a new migration file from schema changes |
| `npm run db:migrate` | Apply migrations sequentially (use this in CI/prod) |
| `npm run db:seed` | Seed demo data (14 Malaysian SMEs, half with discovery filled in) |
| `npm run db:reset` | Wipe all rows + push schema + reseed (development reset) |
| `npm run db:studio` | Open Drizzle Studio |

## Environment variables

| Var | Required | Notes |
|---|---|---|
| `TURSO_DATABASE_URL` | yes | `libsql://<your-db>.turso.io` |
| `TURSO_AUTH_TOKEN` | yes | `turso db tokens create <db>` |
| `DEEPSEEK_API_KEY` | yes | DeepSeek dashboard → API Keys |
| `CRON_SECRET` | optional | Reserved for future scheduled jobs. No cron is currently configured (the closing-call grader runs on-demand via the dashboard button). Safe to leave blank. |

## Deploying to Vercel

### One-time setup

1. Push this repo to GitHub.
2. Import into Vercel.
3. Add the 4 env vars above (Production scope).
4. The first deploy will run `npm run build`. Migrations are NOT auto-applied — you'll need to run `npm run db:migrate` against the production Turso URL once before traffic hits the new schema (see "Migrations in production" below).

### vercel.json

The repo pins to **Singapore (sin1)** for proximity to Malaysian users. The Turso primary lives in Tokyo (`aws-ap-northeast-1`); `sin1` is the best balance for end-to-end latency. If most users are in Japan/Korea, switch to `hnd1`.

No scheduled jobs are configured. The closing-call grader runs on-demand from the dashboard.

### Function runtimes

All API routes run on Node.js (not Edge). PDF generation uses native packages (`@react-pdf/renderer`), DB driver is libSQL — neither edge-compatible. `serverExternalPackages: ["@react-pdf/renderer"]` in `next.config.ts` keeps the PDF lib out of the bundle.

`maxDuration` is set explicitly:
- PDF routes: 30s
- AI generation routes: 60s (proposal can take ~20s)

## Migrations in production

Drizzle Kit migrations live in `db/migrations/`. To apply them against the production Turso database:

```bash
TURSO_DATABASE_URL=<prod-url> TURSO_AUTH_TOKEN=<prod-token> npm run db:migrate
```

A typical workflow when adding a column:

```bash
# 1. Edit db/schema.ts
# 2. Generate migration
npm run db:generate
# 3. Review the SQL in db/migrations/<NNNN>_<slug>.sql
# 4. Apply locally (or use db:push in dev)
npm run db:migrate
# 5. Commit the migration
# 6. After deploy, apply against prod
TURSO_DATABASE_URL=<prod> TURSO_AUTH_TOKEN=<prod> npm run db:migrate
```

> ⚠️ libSQL has limited `ALTER COLUMN` support. Stick to additive migrations (new columns, new tables, new indexes). For destructive migrations, prefer creating a new column, backfilling, then dropping the old.

## Project layout

```
app/
  (dashboard)/        # Authenticated dashboard routes
    today/            # Task queue
    clients/          # Client list + detail
    pipeline/         # SPANCO kanban
    calls/            # Briefing/notes/debrief flow
    health-check/     # Readiness audit list + detail
  api/
    proposal/pdf/     # Proposal PDF generation
    invoice/pdf/      # Tax invoice PDF generation
    proposal/         # AI proposal generation (cancellable)

components/           # ~30 React components, mostly server with client islands
lib/
  ai/                 # Server actions + helpers per AI feature
  queries/            # Cached DB query functions (unstable_cache + tags)
  schemas/            # Zod schemas for AI output validation
  pdf/                # @react-pdf/renderer document components
  exporters/          # Markdown exporters
  format/             # Time + money formatters
  constants/          # Shared display labels (STAGE_NAME, SOURCE_LABEL)
  invoice/            # Company info + invoice numbering

db/
  schema.ts           # Drizzle schema (single source of truth)
  client.ts           # libSQL connection
  seed.ts             # Reseed from lib/data.ts
  reset.ts            # Wipe all rows
  migrations/         # Drizzle Kit-generated migrations

public/theme-init.js  # Synchronous classic script for FOUC-free dark mode
```

## Domain conventions

- All money is stored as integer **sen** (1 RM = 100 sen) to avoid float drift.
- All timestamps are integer **unix-ms**.
- IDs are [cuid2](https://github.com/paralleldrive/cuid2).
- Stage codes use SPANCO letters (`S`, `P`, `A`, `N`, `C`, `O`); display strings live in `lib/constants/labels.ts`.
- Workshop value (excl. SST) is denormalized on `deals.valueCents` for fast pipeline rendering. SST is calculated on-the-fly via `db/lib/money.ts`.
- The `health` field on `clients` (0–100) tracks AI-readiness; updated by readiness audits.
