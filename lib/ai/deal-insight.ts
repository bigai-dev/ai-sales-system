"use server";
import { generateText } from "ai";
import { eq } from "drizzle-orm";
import crypto from "node:crypto";
import { revalidatePath, revalidateTag } from "next/cache";
import { chat } from "./deepseek";
import { scrubObject } from "./scrub";
import { db } from "@/db/client";
import { clients, dealInsightCache, deals } from "@/db/schema";
import { formatMoney } from "@/db/lib/money";
import { DAY_MS } from "@/lib/format/time";
import type { Result } from "@/lib/types";

function hash(s: string) {
  return crypto.createHash("sha256").update(s).digest("hex");
}

const SYSTEM = `You are a senior sales coach for a 2-day vibe-coding workshop
sold at RM 3,500/pax + 8% SST. Workshops run as cohorts up to ~35 participants;
bigger teams phase into multiple cohorts. Discovery on every deal must capture
three things: headcount, AI-coding knowledge level, budget. Common objections
fall into four buckets: content (what's actually taught), budget (per-pax cost
or quarterly L&D), venue (on-site / remote / city), time (2-day commitment).

Given the deal record below, write ONE specific, observable coaching note in
1-2 sentences (max 35 words). Tell the founder the next action — which
discovery question to land, which objection to pre-empt, which cohort size to
propose. No pleasantries. No fluff.`;

export async function generateDealInsight(dealId: string): Promise<Result<{ text: string }>> {
  const [deal] = await db.select().from(deals).where(eq(deals.id, dealId));
  if (!deal) return { ok: false, error: "Deal not found" };
  const [client] = await db.select().from(clients).where(eq(clients.id, deal.clientId));
  if (!client) return { ok: false, error: "Client not found" };

  const days = Math.floor((Date.now() - deal.daysInStageStartsAt) / DAY_MS);
  const ctx = scrubObject({
    company: client.name,
    industry: client.industry,
    contact: `${client.contactName}${client.contactRole ? `, ${client.contactRole}` : ""}`,
    stage: deal.stage,
    value: formatMoney(deal.valueCents),
    daysInStage: days,
    hot: deal.hot,
    lastActivity: deal.lastActivity,
    nextStep: deal.nextStep,
    tags: deal.tags,
  });

  const inputHash = hash(JSON.stringify(ctx));
  const [cached] = await db
    .select()
    .from(dealInsightCache)
    .where(eq(dealInsightCache.dealId, dealId));
  if (cached?.inputHash === inputHash) {
    return { ok: true, data: { text: cached.text } };
  }

  let text: string;
  try {
    const res = await generateText({
      model: chat,
      system: SYSTEM,
      prompt: `Deal: ${JSON.stringify(ctx)}\n\nWrite the observation now.`,
      maxOutputTokens: 120,
    });
    text = res.text.trim();
  } catch (e) {
    return { ok: false, error: `LLM call failed: ${(e as Error).message}` };
  }

  await db
    .insert(dealInsightCache)
    .values({ dealId, inputHash, text, generatedAt: Date.now() })
    .onConflictDoUpdate({
      target: dealInsightCache.dealId,
      set: { inputHash, text, generatedAt: Date.now() },
    });

  await db.update(deals).set({ insight: text }).where(eq(deals.id, dealId));
  revalidateTag("pipeline", "default");
  revalidatePath("/pipeline");
  return { ok: true, data: { text } };
}
