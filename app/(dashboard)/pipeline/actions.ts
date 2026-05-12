"use server";
import { and, eq } from "drizzle-orm";
import { revalidatePath, revalidateTag } from "next/cache";
import { db } from "@/db/client";
import { deals } from "@/db/schema";
import { parseMoney } from "@/db/lib/money";
import type { Result } from "@/lib/types";
import type { SpancoCode } from "@/lib/constants/labels";
import { getCurrentRepId } from "@/lib/queries/reps";

// NOTE: do not re-export `SpancoCode` from this file. Next.js's server-actions
// loader treats every export in a `"use server"` file as a runtime action and
// will generate `export { SpancoCode }` which crashes at load time because
// types don't exist at runtime. Importers should pull the type directly from
// `@/lib/constants/labels`.

function revalidateDealRoutes(): void {
  // Tag-based covers cached queries (pipeline board, dashboard KPIs).
  // Path-based covers client-router cache for the routes that read deal
  // data directly (today queue, clients list, pipeline page).
  revalidateTag("pipeline", "default");
  revalidateTag("dashboard-kpis", "default");
  revalidatePath("/pipeline");
  revalidatePath("/today");
  revalidatePath("/clients", "layout");
}

const STAGE_PROBABILITY: Record<SpancoCode, number> = {
  S: 10, P: 25, A: 40, N: 60, C: 80, O: 100,
};

export async function moveDealStage(
  dealId: string,
  fromStage: SpancoCode,
  toStage: SpancoCode,
): Promise<Result> {
  if (fromStage === toStage) return { ok: true };

  const now = Date.now();
  const patch: Partial<typeof deals.$inferInsert> = {
    stage: toStage,
    daysInStageStartsAt: now,
    lastActivityAt: now,
  };
  if (toStage === "O") patch.closedAt = now;
  if (fromStage === "O" && toStage !== "O") patch.closedAt = null;

  const updated = await db
    .update(deals)
    .set(patch)
    .where(and(eq(deals.id, dealId), eq(deals.stage, fromStage)))
    .returning({ id: deals.id });

  if (updated.length === 0) {
    return { ok: false, error: "stale" };
  }

  revalidateDealRoutes();
  return { ok: true };
}

export type NewDealInput = {
  clientId: string;
  valueCents?: number;
  value?: string; // alt: "RM 70K" — workshop value (excl. SST)
  stage?: SpancoCode;
  hot?: boolean;
  insight?: string;
  tags?: string[];
  nextStep?: string;
  lastActivity?: string;
  headcount?: number;
  deliveryDate?: number; // unix-ms
};

export async function createDeal(input: NewDealInput): Promise<Result<{ id: string }>> {
  if (!input.clientId) return { ok: false, error: "Client is required" };
  const stage = input.stage ?? "S";
  const valueCents = input.valueCents ?? (input.value ? parseMoney(input.value) : 0);
  const repId = await getCurrentRepId();
  const now = Date.now();

  const [row] = await db
    .insert(deals)
    .values({
      clientId: input.clientId,
      ownerRepId: repId,
      stage,
      valueCents,
      probability: STAGE_PROBABILITY[stage],
      hot: !!input.hot,
      insight: input.insight ?? null,
      tags: input.tags ?? [],
      nextStep: input.nextStep ?? null,
      headcount: input.headcount ?? null,
      deliveryDate: input.deliveryDate ?? null,
      lastActivity: input.lastActivity ?? "Just added",
      lastActivityAt: now,
      daysInStageStartsAt: now,
      closedAt: stage === "O" ? now : null,
    })
    .returning({ id: deals.id });

  revalidateDealRoutes();
  return { ok: true, data: { id: row.id } };
}

export type DealPatch = Partial<NewDealInput>;

export async function updateDeal(id: string, patch: DealPatch): Promise<Result> {
  const set: Partial<typeof deals.$inferInsert> = { lastActivityAt: Date.now() };
  if (patch.stage !== undefined) {
    set.stage = patch.stage;
    set.probability = STAGE_PROBABILITY[patch.stage];
    set.daysInStageStartsAt = Date.now();
    if (patch.stage === "O") set.closedAt = Date.now();
  }
  if (patch.valueCents !== undefined) set.valueCents = patch.valueCents;
  else if (patch.value !== undefined) set.valueCents = parseMoney(patch.value);
  if (patch.hot !== undefined) set.hot = patch.hot;
  if (patch.insight !== undefined) set.insight = patch.insight;
  if (patch.tags !== undefined) set.tags = patch.tags;
  if (patch.nextStep !== undefined) set.nextStep = patch.nextStep;
  if (patch.lastActivity !== undefined) set.lastActivity = patch.lastActivity;

  await db.update(deals).set(set).where(eq(deals.id, id));
  revalidateDealRoutes();
  return { ok: true };
}

export async function deleteDeal(id: string): Promise<Result> {
  await db.delete(deals).where(eq(deals.id, id));
  revalidateDealRoutes();
  return { ok: true };
}
