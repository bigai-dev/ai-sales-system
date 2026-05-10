import { config } from "dotenv";
import { eq } from "drizzle-orm";
import { db, libsql } from "./client";
import { clients, deals, reps } from "./schema";
import { parseMoney } from "./lib/money";
import {
  clientList,
  reps as seedReps,
  pipelineBoard,
} from "../lib/data";

config({ path: ".env.local" });
config({ path: ".env" });

type SpancoCode = "S" | "P" | "A" | "N" | "C" | "O";

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
    const existing = await db.select().from(clients).where(eq(clients.name, c.name));
    if (existing.length === 0) {
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
        daysInStageStartsAt: Date.now() - d.daysInStage * 86_400_000,
        closedAt: col.code === "O" ? Date.now() - d.daysInStage * 86_400_000 : null,
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

async function main() {
  await seedReps_();
  await seedClients_();
  await seedDeals_();

  const counts = {
    reps: (await db.select().from(reps)).length,
    clients: (await db.select().from(clients)).length,
    deals: (await db.select().from(deals)).length,
  };
  console.log("✓ seed complete", counts);
  libsql.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
