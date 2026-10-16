# SALES.AI

A one-person sales system for selling 2-day vibe-coding workshops to Malaysian SMEs. It runs the whole deal cycle, from new lead to paid SST invoice, without leaving the app.

Every AI feature is grounded in the client's own discovery profile: the AI writes call plans, call reviews, proposals, follow-up emails, readiness checks and coaching from what you actually captured about that client.

## What's in the app

- **Today** (`/`) — what needs you now: planned calls for the week, overdue follow-ups, deals that stopped moving, proposals to chase, and your own notes. Snooze what can wait.
- **Dashboard** (`/dashboard`) — open deal value, workshops booked, calls per week, deals by stage, and AI coaching from your reviewed calls.
- **Clients** (`/clients`) — every client with stage, industry, size and readiness score. Each client page has a discovery profile (goals, pain points, tools, decision makers, budget, timing), deals, timeline, calls and proposals.
- **Readiness check** (`/clients/readiness`, `/clients/[id]/readiness`) — the AI scores a client's engineering team across six areas (Tooling, Practices, Culture, Velocity, Adoption, Outcomes) with risks and next steps. Proposals are written from this.
- **Deals** (`/deals`) — drag-and-drop board: New lead → Qualified → Discovery → Proposal → Negotiation → Won.
- **Calls** (`/calls`, `/calls/[id]`) — call plan (AI), notes that save as you type, call review (AI), follow-up email draft, and a role play for that specific call.
- **Training** (`/training`) — trends from your reviewed calls, role play by topic (Content, Budget, Venue, Timing), and a playbook of lines that worked.
- **PDFs** — workshop proposals and 8% SST tax invoices with `INV-{YYYY}-{NNNN}` numbering.
- **Demo menu** — a guided tour and a full-screen presentation for webinars.

## Tech

Next.js 16 (App Router, Node runtime) · TypeScript · React 19 · Turso/libSQL via Drizzle · DeepSeek through the Vercel AI SDK · Zod · Tailwind CSS v4 · dnd-kit · Chart.js · lucide-react · @react-pdf/renderer.

## Getting started

You need Node.js 20+, a [Turso](https://turso.tech) database and a [DeepSeek API key](https://platform.deepseek.com).

```bash
npm install
```

Copy `.env.example` to `.env.local` and fill in:

| Variable | Description |
|----------|-------------|
| `TURSO_DATABASE_URL` | Connection URL for your Turso database, e.g. `libsql://<your-db>.turso.io`. |
| `TURSO_AUTH_TOKEN` | Auth token for the Turso database (`turso db tokens create <db>`). |
| `DEEPSEEK_API_KEY` | API key for DeepSeek, used by all AI features. |

```bash
npm run db:push    # sync the schema to your database
npm run db:seed    # demo data (Malaysian SME clients + deals)
npm run dev        # start the app at http://localhost:3000
```

## Where things live

- `app/(dashboard)/` — the pages: `page.tsx` (Today), `dashboard`, `clients` (+ `readiness`), `deals`, `calls`, `training`
- `app/api/` — proposal and invoice PDF generation, AI proposal generation
- `components/ui/` — the shared building blocks (PageHeader, Button, Panel, Field/Input, StatusChip, EmptyState…)
- `components/` — everything else on screen
- `lib/constants/` — **the words**: `labels.ts` (stage names, statuses, tones), `copy.ts` (navigation, page titles, button text, errors), `routes.ts` (every page address)
- `lib/ai/` — one file per AI feature (call plan, call review, proposal, email, readiness check, coaching, role play)
- `lib/queries/` — database reads
- `lib/schemas/` — Zod schemas that check AI output
- `lib/pdf/`, `lib/exporters/` — PDF documents and copy-as-text builders
- `db/` — Drizzle schema, client, seed and migrations

## Conventions

- Money is stored as whole sen (1 RM = 100 sen); times as unix milliseconds.
- Deal stages are stored as single-letter codes (`S P A N C O`) for history's sake; the words people see come from `lib/constants/labels.ts` and the codes never appear on screen. A client's stage is derived from its deals.
- Old page addresses (`/today`, `/pipeline`, `/health-check`, `/training/trends`, `/training/drills`) forward to the new ones (see `next.config.ts`).
- `npm run db:push` is for development. For production, generate and apply migrations with `npm run db:generate` and `npm run db:migrate`.
- `vercel.json` pins the region to Singapore (`sin1`). API routes run on the Node runtime (PDF and libSQL packages need it).
