# SalesAI

An AI-powered sales CRM that runs an entire deal cycle — from cold lead to paid invoice — without leaving the app.

SalesAI is a full-stack CRM purpose-built for a solo founder selling 2-day vibe-coding workshops to Malaysian SMEs. It pairs a SPANCO sales pipeline with DeepSeek AI that drafts call briefings, debriefs, proposals, follow-up emails, readiness audits, and self-coaching plans — every output grounded in each client's own discovery profile.

## Features

- **Daily task queue** (`/today`) — scheduled calls for the next 7 days, urgency-bucketed actions (overdue / today / this week / later), per-task snooze, and quick-capture for ad-hoc reminders.
- **Client management** (`/clients`) — list with stage, industry, size, and readiness filters; detail pages with a discovery profile (goals, pain points, stack, decision-makers, budget/timeline signals) and a unified timeline of calls, proposals, and audits.
- **SPANCO pipeline** (`/pipeline`) — drag-and-drop kanban across the Suspect → Prospect → Analysis → Negotiation → Conclusion → Order stages.
- **AI call workflow** (`/calls/[id]`) — pre-call briefing, auto-saved notes, post-call debrief, and one-click follow-up email drafting.
- **AI readiness audit** (`/health-check`) — scores each client across 6 engineering dimensions (Tooling, Practices, Culture, Velocity, Adoption, Outcomes) with risks and recommended actions.
- **AI sales training** (`/training`) — extract reusable plays into a playbook, practice drills against AI-generated scenarios, grade your responses, and track trends over time.
- **On-demand coaching** — a dashboard button grades the founder's recent closing calls and rewrites the coaching panel.
- **PDF generation** — workshop proposal PDFs and 8% SST tax invoices with auto-incrementing `INV-{YYYY}-{NNNN}` numbering.
- **Light/dark theme** — OKLCH design tokens with a flash-free (FOUC-free) dark mode.

## Tech Stack

- **Framework:** Next.js 16 (App Router) on the Node.js runtime
- **Language:** TypeScript, React 19
- **Database:** libSQL / Turso (edge-distributed SQLite) via Drizzle ORM
- **AI:** DeepSeek through the Vercel AI SDK (`ai`, `@ai-sdk/deepseek`, `@ai-sdk/react`)
- **Validation:** Zod schemas for structured AI output
- **PDF:** `@react-pdf/renderer`
- **UI:** Tailwind CSS v4, `@dnd-kit` for kanban drag-and-drop, Chart.js + `react-chartjs-2` for charts
- **IDs:** cuid2

## Getting Started

### Prerequisites

- Node.js 20+
- A [Turso](https://turso.tech) database (`turso db create salesai-dev`)
- A [DeepSeek API key](https://platform.deepseek.com)

### Installation

```bash
npm install
```

### Environment Variables

Copy `.env.example` to `.env.local` and fill in:

| Variable | Description |
|----------|-------------|
| `TURSO_DATABASE_URL` | Connection URL for your Turso (libSQL) database, e.g. `libsql://<your-db>.turso.io`. |
| `TURSO_AUTH_TOKEN` | Auth token for the Turso database (`turso db tokens create <db>`). |
| `DEEPSEEK_API_KEY` | API key for DeepSeek, used by all AI features. |
| `CRON_SECRET` | Optional. Reserved for future scheduled jobs; the closing-call grader currently runs on-demand, so this can be left blank. |

### Running Locally

```bash
npm run db:push    # sync the schema to your Turso database
npm run db:seed    # seed demo data (Malaysian SME clients + pipeline deals)
npm run dev        # start the dev server
```

Then open http://localhost:3000 in your browser.

## Project Structure

- `app/(dashboard)/` — dashboard routes: `today`, `clients`, `pipeline`, `calls`, `health-check`, `training`
- `app/api/` — server routes for proposal and invoice PDF generation, plus AI proposal generation
- `components/` — React components (mostly server components with client islands)
- `lib/ai/` — server actions and helpers for each AI feature (briefing, debrief, proposal, email, health-check, grading, plays)
- `lib/queries/` — cached database query functions
- `lib/schemas/` — Zod schemas validating AI output
- `lib/pdf/` — `@react-pdf/renderer` document components
- `lib/` (other) — exporters, formatters, constants, and invoice numbering helpers
- `db/` — Drizzle schema, libSQL client, seed/reset scripts, and generated migrations
- `public/` — static assets, including the synchronous theme-init script for flash-free dark mode

## Notes

- This project was built as a demo for the Vibe Coding Workshop.
- **Domain conventions:** money is stored as integer *sen* (1 RM = 100 sen) to avoid float drift; timestamps are integer unix-ms; pipeline stages use SPANCO letter codes (`S`, `P`, `A`, `N`, `C`, `O`) with display labels in `lib/constants/`.
- **Migrations:** `npm run db:push` is for development. For production, generate and apply migrations with `npm run db:generate` and `npm run db:migrate`. libSQL has limited `ALTER COLUMN` support, so prefer additive migrations.
- **Deployment:** the included `vercel.json` pins the region to Singapore (`sin1`) for proximity to Malaysian users. All API routes run on the Node.js runtime (PDF and libSQL packages are not edge-compatible).
