# Training Section — Design Spec

- **Date:** 2026-05-10
- **Status:** Approved for implementation planning
- **Scope:** v1 of a new top-level `Training` section in SalesAI

## Problem

The current system performs strong post-call analysis (briefing → debrief → coaching panel) but lacks three capabilities a real sales-training system needs:

1. **Longitudinal signal.** `gradeRecentClosingCalls` deletes the entire coaching panel on every regenerate ([lib/ai/grade-calls.ts:101-103](../../../lib/ai/grade-calls.ts#L101-L103)), so trends across weeks are not visible.
2. **Rehearsal surface.** No place for the rep to *practice* objection handling before a live call.
3. **Reusable canon.** No durable record of "what worked" — winning lines, real handled objections — that can be retrieved and reused.

## Goals (v1)

- Add a `/training` section that closes all three gaps with the lowest possible engineering effort and the highest user-visible value for an SME founder.
- Reuse existing structured data from `briefing` and `debrief` rather than introducing new LLM-graded dimensions.
- Preserve historical state so progress is observable across weeks.
- Create a closed feedback loop: drills → real calls → playbook → drills.

## Non-goals (v1)

- Voice / audio role-play with TTS+STT.
- Per-call LLM-graded soft skills (tone, rapport, listening) — these need real transcripts.
- Manual playbook authoring / WYSIWYG editor.
- Multi-user / per-rep separation.
- Push reminders or streak-based notifications.
- Goal-setting UI.

## Information architecture

A new top-level nav item **Training** is inserted between `Today` and `Dashboard`.

```
/training              Landing: streak, weakest-metric callout, "Drill now" CTA
/training/trends       5 derived metric sparklines + recent debrief highlights
/training/drills       Drill library: 4 objection buckets
/training/drills/[id]  Active drill: scenario + textarea + grade
/training/playbook     Auto-extracted plays, searchable
/training/playbook/[id] One play (objection + your real reply + outcome)
```

One out-of-section injection: a **Dry Run** button on each call's briefing page (`/calls/[id]`).

## Pillar 1 — Tracking (`/training/trends`)

### Five derived metrics

All metrics are computed from data the existing briefing/debrief flow already produces. No new LLM calls per call.

| Metric | Formula | Source |
|---|---|---|
| Stage progression rate | `count(calls where debrief.suggestedStage > client.stage at call time) / count(analyzed calls)` over rolling 30 days | `calls.suggestedStage`, `clients.stage` |
| Briefing adherence | `count(calls where outcome matches briefing.nextStageMove.outcome) / count(calls where briefing existed)` | `calls.briefing.nextStageMove`, `calls.outcome` |
| Discovery coverage | mean(% of `briefing.discoveryQuestions` that the debrief flagged as answered) | `calls.briefing.discoveryQuestions`, `calls.debrief` |
| Objection preparedness | `count(briefing.expectedObjections ∩ debrief.objectionsRaised that got handled) / count(briefing.expectedObjections)` | `calls.briefing.expectedObjections`, `calls.debrief.objectionsRaised` |
| Talk balance | rolling avg of `call.talkPct` (target band: 30–40%) | `calls.talkPct` (already stored) |

### Schema changes

**New table `callMetrics`** (populated at debrief time so reads are O(1)):

```ts
callMetrics: {
  callId: text PRIMARY KEY references calls(id),
  computedAt: int (unix ms),
  stageProgression: int (0 or 1),
  briefingAdherence: int (0 or 1),
  discoveryCoverage: real (0..1),
  objectionPreparedness: real (0..1),
  talkPct: real (0..1),
}
```

**Critical fix to existing code** (`lib/ai/grade-calls.ts`):
- Stop deleting prior `coachingScores` / `coachingOpportunities` / `coachingWins` rows on each run.
- Add a `runId` column (cuid2) to all three coaching tables.
- The dashboard `CoachingPanel` reads only the latest `runId`; the Trends view can chart historical runs.

**Hook point:** `generateCallDebrief` ([lib/ai/call-debrief.ts:125-168](../../../lib/ai/call-debrief.ts#L125-L168)) is extended to write a `callMetrics` row in the same transaction as the `calls` update. Briefing and debrief are already loaded in this function, so all inputs are in scope.

### UI

Five sparklines in a 2-column grid. Each card shows:
- Current value (last 7 days)
- 30-day delta (e.g. `+18%`)
- One-line "what this means" hover

The weakest metric gets a callout box at the top of the page:

> Your discovery coverage is **54%**. On 4 of your last 10 calls, you skipped budget-related discovery. → Drill 'budget' bucket

Below the sparklines, a "Recent insights" panel reads from the *latest* coaching panel `runId` (existing dynamic insights; unchanged content but now persisted).

## Pillar 2 — Rehearsal

Two surfaces, one shared backend (`scenarioGenerator` + `responseGrader` server actions).

### Drill library (`/training/drills`)

- **Buckets:** content, budget, venue, time (mirrors existing objection categories in [lib/ai/call-debrief.ts:36-40](../../../lib/ai/call-debrief.ts#L36-L40)).
- **Scenario generation:** LLM-generated on demand (cached ~30 min via `unstable_cache`), seeded with workshop economics, recent discovery profile patterns, and the rep's prior best-graded responses for that bucket.
- **Drill UI:** scenario card → textarea → submit → grade card.
- **Grade card** shows: score 0–100, one-line feedback, "Best response so far in this bucket: [excerpt]" (or "This is your best so far!" when score ≥ existing best).
- **Streak counter:** ≥1 qualifying drill submission on a given calendar day in Asia/Kuala_Lumpur ticks the streak. A submission qualifies only if `repResponse.length ≥ 40` and `grade ≥ 30` (mitigates trivial submissions). Lives in the `/training` header.

### Pre-call Dry Run

- A **"Dry Run"** button on each `/calls/[id]` briefing card.
- Generates 3 "hardest moments" specific to this prospect, drawing from `briefing.expectedObjections`, audit's top risks, and decision-maker stances.
- Same textarea + grader pattern as drills.
- Result is saved on the call as a JSON column `calls.dryRun: { momentId, prompt, repResponse, grade, takeaway }[]`.
- The debrief prompt ([lib/ai/call-debrief.ts](../../../lib/ai/call-debrief.ts)) gets a new instruction: *"If `dryRun` is present, evaluate whether the rep delivered the lines they practiced. Surface this in `coachingNote`."* This is the closed-loop tie-back.

### Schema

```ts
drills: {
  id: text PRIMARY KEY,            // cuid2
  bucket: text,                    // 'content' | 'budget' | 'venue' | 'time'
  scenarioPrompt: text,            // the prospect statement shown to the rep
  repResponse: text,
  grade: int,                      // 0..100
  feedback: text,                  // 1-line LLM critique
  createdAt: int,
}

drillBestResponses: {
  bucket: text PRIMARY KEY,        // one row per bucket
  repResponse: text,
  grade: int,
  drillId: text references drills(id),
  callId: text references calls(id) NULL,  // set when delivered live
  updatedAt: int,
}
```

```ts
// Added to existing calls table
calls.dryRun: text (JSON) NULL
```

### Prompts

- **`scenarioGenerator`** (shared by drills + dry run): inputs are `bucket | callContext`, output is a single scenario string + 3 LLM-suggested "what good looks like" bullets the grader uses as rubric.
- **`responseGrader`** (shared): inputs are `scenario, rubric, repResponse, bucket`, outputs `grade (0-100), oneLineFeedback, didExceedBest: bool`.

## Pillar 3 — Playbook (`/training/playbook`)

Plays are auto-extracted from real calls. **No manual authoring.**

### Extraction triggers (run inside the existing debrief pipeline)

A play is created when ANY of these is true on a debriefed call:

1. An objection was raised AND the debrief's `coachingNote` calls the response a strength.
2. A drill best-response was *delivered live* (detected by heuristic text similarity between `call.notes` and `drillBestResponses[bucket].repResponse` — implementation chooses the algorithm and threshold; goal is to catch obvious reuses without flagging coincidental phrasing).
3. The call outcome is `closed_won` — every objection raised + response gets extracted.

The detection happens at the end of `generateCallDebrief`. Each extracted play is one DB row.

### Schema

```ts
plays: {
  id: text PRIMARY KEY,            // cuid2
  callId: text references calls(id),
  bucket: text,                    // 'content' | 'budget' | 'venue' | 'time'
  scenario: text,                  // the objection / moment as raised
  repResponseExcerpt: text,        // the rep's actual reply (from debrief or notes)
  outcome: text,                   // call.outcome at time of extraction
  source: text,                    // 'coaching_strength' | 'drill_delivered' | 'closed_won'
  pinned: int (0 or 1) DEFAULT 0,
  hidden: int (0 or 1) DEFAULT 0,
  createdAt: int,
}
```

### UX

- Searchable list grouped by bucket.
- Each play card: scenario → your actual response → outcome → "from call with [client name], [date]."
- Two row actions: **Pin** (promote in search and exemplar selection) and **Hide** (downrank, never delete).
- No edit. Plays are anchored to real moments; editing them would break that anchor.

### Plays as inputs back into the system

Plays are *consumed* by:
- **Drill scenario generator:** pulls 1–2 pinned plays from the bucket as exemplars.
- **Pre-call Dry Run:** pulls plays matching the briefing's `expectedObjections` to inform "what good looks like."
- **Debrief prompt:** told *"if the rep used a known play (see `relevantPlays`), recognize it explicitly in `coachingNote`."*

This is what makes the Playbook a live system rather than dead docs: every reuse of a winning move is observable.

## `/training` landing page

Three stacked cards, all server-rendered (no client JS unless a button is clicked):

1. **Streak + weakest metric.** Format: "🔥 Day 4 streak. Weakest right now: Discovery coverage (54%). Drill the 'budget' bucket once today to lift it."
2. **Recent improvement.** One line per dimension that moved ≥ 5 points in 30 days. Positive deltas only by default; negative shown on click-through to `/training/trends`.
3. **Pinned plays carousel.** Up to 6 plays sorted by `pinned DESC, createdAt DESC` (in v1; usage-frequency tracking is deferred). Click-through to full play.

Primary CTA at top right: **Drill now** → `/training/drills` (auto-picks weakest bucket).

## Files to add or modify

### New routes

- `app/(dashboard)/training/page.tsx` — landing
- `app/(dashboard)/training/trends/page.tsx`
- `app/(dashboard)/training/drills/page.tsx`
- `app/(dashboard)/training/drills/[id]/page.tsx`
- `app/(dashboard)/training/playbook/page.tsx`
- `app/(dashboard)/training/playbook/[id]/page.tsx`

### New components

- `components/training/StreakBadge.tsx`
- `components/training/MetricSparklines.tsx`
- `components/training/WeakestMetricCallout.tsx`
- `components/training/DrillCard.tsx`
- `components/training/PlayCard.tsx`
- `components/DryRunButton.tsx` (used on `/calls/[id]` briefing card)

### New AI/server modules

- `lib/ai/scenario-generator.ts` — shared by drills + dry run
- `lib/ai/response-grader.ts` — shared
- `lib/ai/extract-plays.ts` — called from `generateCallDebrief`
- `lib/queries/training-metrics.ts` — derived metric reads with `unstable_cache`
- `lib/queries/plays.ts`
- `lib/queries/drills.ts`

### New schema files

- New tables in `db/schema.ts`: `callMetrics`, `drills`, `drillBestResponses`, `plays`
- New columns: `calls.dryRun` (JSON), `coachingScores.runId` (text), `coachingOpportunities.runId`, `coachingWins.runId`

### Modified files

- `db/schema.ts` — additions above
- `components/Sidebar.tsx` — add Training nav item between Today and Dashboard
- `lib/ai/call-debrief.ts` — extended to: write `callMetrics`, evaluate `dryRun` performance, trigger play extraction
- `lib/ai/grade-calls.ts` — stop deleting prior coaching rows; add `runId` to inserts
- `lib/schemas/grade-calls.ts` — add `runId` field
- `app/(dashboard)/calls/[id]/page.tsx` — render the Dry Run button on the briefing card

### Migrations

A single Drizzle migration adds all new tables, new columns, and the `runId` columns on existing coaching tables. All additive; libSQL `ALTER COLUMN` limitations are not exercised.

## Risks and open questions

1. **Backfill of `callMetrics`.** Existing analyzed calls won't have a `callMetrics` row. The migration script should backfill from existing `briefing` and `debrief` JSON. If backfill fails on legacy rows with malformed JSON, skip them silently — partial trends are still useful.

2. **`runId` migration on coaching tables.** Existing rows have no `runId`. Set them all to a synthetic `legacy-2026-05-10` `runId` so the dashboard panel still finds them.

3. **Drill response grading drift.** The grader's "best so far" comparison can drift if grading criteria change. Acceptable for v1; if it becomes a problem, regrade `drillBestResponses` on prompt change.

4. **Cohort cadence vs. play extraction rate.** The founder closes infrequently, so trigger 3 (`closed_won`) seeds slowly. Triggers 1 and 2 (coaching-strength + drill-delivered) compensate by extracting from non-closed calls. Monitor: if after 4 weeks fewer than ~10 plays exist, loosen the coaching-strength heuristic.

5. **Streak gaming.** Mitigation already specified in the streak-counter rules (Pillar 2): require `repResponse.length ≥ 40` and `grade ≥ 30`. Enforced only in the streak query, not at the UI; the rep can still submit anything for grading, but only meaningful submissions tick the streak.

## Build sequence

In implementation, execute in this order so each phase ships value independently:

1. **Phase A — Tracking foundation:** schema (`callMetrics`, `runId` columns), `lib/ai/grade-calls.ts` fix (no-delete + `runId`), `callMetrics` write in `generateCallDebrief`, backfill script. **Ships:** persisted history, no new UI yet.
2. **Phase B — Trends UI:** `/training` landing + `/training/trends` page, sidebar nav item, sparklines, weakest-metric callout. **Ships:** the visible "I'm getting better" surface.
3. **Phase C — Rehearsal:** drills schema + grader/scenario prompts, `/training/drills` pages, Dry Run button on `/calls/[id]`, debrief integration of `dryRun`. **Ships:** practice surface.
4. **Phase D — Playbook:** plays schema, extraction in debrief pipeline, `/training/playbook` pages, integration of plays back into scenario-generator and dry-run prompts. **Ships:** auto-canon.

Each phase is independently shippable and reversible.
