import { config } from "dotenv";
import { and, eq, isNotNull } from "drizzle-orm";
import { db, libsql } from "./client";
import { calls, clients, deals, reps } from "./schema";
import { parseMoney } from "./lib/money";
import { clientList, reps as seedReps, pipelineBoard } from "./seed-data";

config({ path: ".env.local" });
config({ path: ".env" });

import type { SpancoCode } from "../lib/constants/labels";
import { DAY_MS } from "../lib/format/time";
import type { CallDebrief } from "../lib/schemas/call-debrief";

function clientStageFromKanban(code: SpancoCode): typeof clients.$inferInsert.stage {
  switch (code) {
    case "S": return "Lead";
    case "P": return "Qualified";
    case "A": return "Discovery";
    case "N": return "Negotiation";
    case "C": return "Negotiation";
    case "O": return "Closed-won";
  }
}

async function seedReps_() {
  for (const r of seedReps) {
    const existing = await db.select().from(reps).where(eq(reps.initials, r.initials));
    if (existing.length === 0) {
      await db.insert(reps).values({
        name: r.name,
        initials: r.initials,
        gradient: r.gradient,
        isPrimary: r === seedReps[0],
      });
    }
  }
}

async function seedClients_() {
  for (const c of clientList) {
    const [existing] = await db.select().from(clients).where(eq(clients.name, c.name));
    if (!existing) {
      await db.insert(clients).values({
        name: c.name,
        initials: c.initials,
        contactName: c.contact,
        contactRole: c.contactRole ?? null,
        industry: c.industry,
        size: c.size,
        employees: c.employees,
        devCount: c.devCount,
        arrCents: parseMoney(c.arr),
        stage: c.stage,
        health: c.health,
        products: c.products,
        gradient: c.gradient,
        lastActivityAt: Date.now(),
        // Discovery profile (only populated when the seed had it)
        goals: c.goals ?? null,
        painPoints: c.painPoints ?? null,
        currentStack: c.currentStack ?? [],
        decisionMakers: c.decisionMakers ?? [],
        budgetSignal: c.budgetSignal ?? null,
        timelineSignal: c.timelineSignal ?? null,
        source: c.source ?? null,
        notes: c.notes ?? null,
      });
      continue;
    }

    // Backfill discovery fields onto existing rows ONLY when the DB value is
    // null — preserves any edits the founder has already made through the UI.
    const patch: Partial<typeof clients.$inferInsert> = {};
    if (existing.goals == null && c.goals) patch.goals = c.goals;
    if (existing.painPoints == null && c.painPoints) patch.painPoints = c.painPoints;
    if ((!existing.currentStack || (existing.currentStack as string[]).length === 0) && c.currentStack?.length) {
      patch.currentStack = c.currentStack;
    }
    if ((!existing.decisionMakers || (existing.decisionMakers as unknown[]).length === 0) && c.decisionMakers?.length) {
      patch.decisionMakers = c.decisionMakers;
    }
    if (existing.budgetSignal == null && c.budgetSignal) patch.budgetSignal = c.budgetSignal;
    if (existing.timelineSignal == null && c.timelineSignal) patch.timelineSignal = c.timelineSignal;
    if (existing.source == null && c.source) patch.source = c.source;
    if (existing.notes == null && c.notes) patch.notes = c.notes;
    if (Object.keys(patch).length > 0) {
      await db.update(clients).set(patch).where(eq(clients.id, existing.id));
    }
  }
}

async function ensureClient(
  company: string,
  contact: string,
  role: string | undefined,
  initials: string,
  stage: SpancoCode,
): Promise<string> {
  const existing = await db.select().from(clients).where(eq(clients.name, company));
  if (existing.length > 0) return existing[0].id;
  // Fallback path — only hit if a pipeline deal references a company missing
  // from clientList. With the Malaysian SME seed, all 14 deals match.
  const inserted = await db
    .insert(clients)
    .values({
      name: company,
      initials,
      contactName: contact,
      contactRole: role,
      stage: clientStageFromKanban(stage),
      health: 60,
      gradient: "",
      lastActivityAt: Date.now(),
    })
    .returning({ id: clients.id });
  return inserted[0].id;
}

async function seedDeals_() {
  // primary rep id
  const [primaryRep] = await db.select().from(reps).where(eq(reps.isPrimary, true));
  for (const col of pipelineBoard) {
    for (const d of col.deals) {
      const clientId = await ensureClient(
        d.company,
        d.contact,
        d.role,
        d.initials,
        col.code as SpancoCode,
      );

      // Skip if a deal for this client already exists at this stage (simple dedup).
      const dup = await db
        .select()
        .from(deals)
        .where(eq(deals.clientId, clientId));
      if (dup.length > 0) continue;

      await db.insert(deals).values({
        clientId,
        ownerRepId: primaryRep?.id,
        title: undefined,
        stage: col.code as SpancoCode,
        valueCents: parseMoney(d.value),
        probability: probabilityFor(col.code as SpancoCode),
        hot: !!d.hot,
        insight: d.insight,
        tags: [...d.tags],
        nextStep: d.next,
        headcount: d.headcount ?? null,
        lastActivity: d.lastActivity,
        lastActivityAt: Date.now(),
        daysInStageStartsAt: Date.now() - d.daysInStage * DAY_MS,
        closedAt: col.code === "O" ? Date.now() - d.daysInStage * DAY_MS : null,
      });
    }
  }
}

function probabilityFor(stage: SpancoCode): number {
  switch (stage) {
    case "S": return 10;
    case "P": return 25;
    case "A": return 40;
    case "N": return 60;
    case "C": return 80;
    case "O": return 100;
  }
}

// Seeds one analyzed call so the demo tour's "AI debrief" step always has
// real content to anchor on. Picks Bumimax because it already has a stage-O
// deal + rich discovery — every demo step lights up against the same client.
async function seedDemoCall_() {
  const [client] = await db
    .select()
    .from(clients)
    .where(eq(clients.name, "Bumimax Industrial Bhd"));
  if (!client) return;

  // Idempotent: if Bumimax already has any analyzed call, skip.
  const existing = await db
    .select({ id: calls.id })
    .from(calls)
    .where(and(eq(calls.clientId, client.id), isNotNull(calls.analyzedAt)))
    .limit(1);
  if (existing.length > 0) return;

  const [primary] = await db.select().from(reps).where(eq(reps.isPrimary, true));
  const [bumimaxDeal] = await db
    .select({ id: deals.id })
    .from(deals)
    .where(eq(deals.clientId, client.id))
    .limit(1);

  const startedAt = Date.now() - 2 * DAY_MS;
  const endedAt = startedAt + 35 * 60_000;
  const analyzedAt = endedAt + 5 * 60_000;

  const debrief: CallDebrief = {
    outcome: "closed_won",
    summary:
      "Anitha confirmed workshop dates for next month and the cohort split — 18 engineers across two batches of 9. Tan Wei Loon (CTO) joined for ~10 min to clarify pre-work expectations and Copilot license provisioning.",
    objectionsRaised: [
      {
        category: "time",
        verbatim:
          "Anitha pushed back on running both days consecutively — concerned about ERP migration prep eating engineers' headspace.",
      },
    ],
    commitments: [
      {
        who: "rep",
        what: "Send tax invoice + dates + venue confirmation by tomorrow EOD.",
      },
      {
        who: "rep",
        what: "Share pre-work survey + Copilot license kit-list 2 weeks before kickoff.",
      },
      {
        who: "client",
        what: "Confirm room booking at Bumimax HQ by Wednesday.",
      },
    ],
    nextStep:
      "Send tax invoice today; workshop confirmation pack with venue + agenda by tomorrow EOD.",
    suggestedStage: "O",
    coachingNote:
      "Strong recap discipline — verbally summarized the 3 commitments before hanging up, which is why Anitha sent the room booking email an hour later. Keep doing that.",
    // No briefing was attached to this seeded call, so briefingEval is null.
    briefingEval: null,
  };

  await db.insert(calls).values({
    clientId: client.id,
    dealId: bumimaxDeal?.id ?? null,
    repId: primary?.id ?? null,
    title: "Confirm workshop dates · Bumimax",
    status: "completed",
    scheduledAt: startedAt,
    startedAt,
    endedAt,
    talkPct: 38,
    questionsAsked: 6,
    sentiment: 2,
    summary: debrief.summary,
    notes:
      "Anitha confirmed dates 12-13 May. Cohort 18 split into 2 batches of 9. CTO Tan Wei Loon joined for 10 min — wants kit list 2 weeks ahead. Pushed back on consecutive days (ERP migration prep). Agreed on workshop confirmation pack by tomorrow EOD. They'll confirm HQ room booking by Wed.",
    debrief,
    outcome: "closed_won",
    nextStep: debrief.nextStep,
    suggestedStage: "O",
    analyzedAt,
  });
}

async function main() {
  await seedReps_();
  await seedClients_();
  await seedDeals_();
  await seedDemoCall_();

  const counts = {
    reps: (await db.select().from(reps)).length,
    clients: (await db.select().from(clients)).length,
    deals: (await db.select().from(deals)).length,
    calls: (await db.select().from(calls)).length,
  };
  console.log("✓ seed complete", counts);
  libsql.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
