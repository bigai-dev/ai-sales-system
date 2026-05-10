# Archived one-shot scripts

These scripts solved specific migration drift before Drizzle migrations 0004
(`db/migrations/0004_material_warlock.sql`) and 0005 captured the same schema
changes properly. Kept for historical reference; **do not run them against any
DB** — they will conflict with the current migrations.

| File | What it did |
|---|---|
| `apply-calls-cols.ts` | Added `briefing`, `notes`, `debrief`, `outcome`, `nextStep`, `suggestedStage`, `analyzedAt`, `scheduledAt` columns to `calls` |
| `apply-discovery-cols.ts` | Added 8 client discovery columns + `task_dismissals` and `scratch_notes` tables |
| `apply-invoice-cols.ts` | Added `invoiceNumber`, `invoiceIssuedAt` to `deals` |
| `check-cols.ts` | One-off `PRAGMA table_info` to verify column presence |
| `check-deals.ts` | Read deals back during a debugging session |

For new migrations, use `npm run db:generate` to produce SQL files in
`db/migrations/`, then `npm run db:migrate` to apply.
