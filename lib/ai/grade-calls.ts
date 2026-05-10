"use server";
import { generateText, Output } from "ai";
import { and, desc, eq, inArray, isNotNull } from "drizzle-orm";
import { revalidatePath, revalidateTag } from "next/cache";
import { reasoner } from "./deepseek";
import { scrubObject } from "./scrub";
import { db } from "@/db/client";
import {
  callTurns,
  calls,
  coachingOpportunities,
  coachingScores,
  coachingWins,
} from "@/db/schema";
import { graderSchema, type GraderOutput } from "@/lib/schemas/grade-calls";
import { STAGE_NAME, type SpancoCode } from "@/lib/constants/labels";

const SYSTEM = `You are a sales-coaching reviewer. Given the transcripts of
recent CLOSING calls, return:
  - 3-5 scoring dimensions (0-100) you would coach to most. Examples:
    "Discovery depth", "Active listening", "Objection handling",
    "Pricing setup", "Next-step clarity".
  - 0-4 specific improvement opportunities with detail and impact tag.
  - 0-5 short "what's working" wins (each split into prefix / num / suffix
    so the UI can highlight a number). Use null for num/suffix when not
    relevant.

Be specific to the transcripts provided. Do NOT make up facts. If transcripts
are sparse or empty, return generic but realistic baseline coaching.`;


export async function gradeRecentClosingCalls(limit = 20): Promise<{
  ok: true;
  data: { graded: number };
} | { ok: false; error: string }> {
  // Pull recent ENDED calls preferring closing-stage hints.
  const recent = await db
    .select()
    .from(calls)
    .where(and(eq(calls.status, "ended"), isNotNull(calls.summary)))
    .orderBy(desc(calls.startedAt))
    .limit(limit);

  // Fallback to all ended calls if none have summaries
  const targetCalls =
    recent.length > 0
      ? recent
      : await db
          .select()
          .from(calls)
          .where(eq(calls.status, "ended"))
          .orderBy(desc(calls.startedAt))
          .limit(limit);

  // Single batched query for all turns across the target calls — replaces
  // an N+1 (was firing `limit` separate SELECTs in parallel). Group in JS.
  const callIds = targetCalls.map((c) => c.id);
  const allTurns = callIds.length
    ? await db.select().from(callTurns).where(inArray(callTurns.callId, callIds))
    : [];
  const turnsByCall = new Map<string, typeof allTurns>();
  for (const t of allTurns) {
    const arr = turnsByCall.get(t.callId);
    if (arr) arr.push(t);
    else turnsByCall.set(t.callId, [t]);
  }

  const callsWithTurns = targetCalls.map((c) => {
    const turns = turnsByCall.get(c.id) ?? [];
    return scrubObject({
      title: c.title,
      stage: STAGE_NAME[(c.stageHint ?? "C") as SpancoCode] ?? c.stageHint,
      talkPct: c.talkPct,
      questionsAsked: c.questionsAsked,
      sentiment: c.sentiment,
      summary: c.summary,
      turns: turns
        .sort((a, b) => a.idx - b.idx)
        .map((t) => `${t.who}: ${t.text}`),
    });
  });

  let output: GraderOutput;
  try {
    const res = await generateText({
      model: reasoner,
      output: Output.object({ schema: graderSchema }),
      system: SYSTEM,
      prompt:
        callsWithTurns.length === 0
          ? `No recent calls in the system yet. Generate a sensible baseline coaching panel a sales manager would set as the team's initial targets.`
          : `Recent closing calls (${callsWithTurns.length}):\n${JSON.stringify(callsWithTurns)}`,
      maxOutputTokens: 1500,
    });
    output = graderSchema.parse(res.output);
  } catch (e) {
    return { ok: false, error: `LLM call failed: ${(e as Error).message}` };
  }

  // Replace existing coaching panel content
  await db.delete(coachingScores);
  await db.delete(coachingOpportunities);
  await db.delete(coachingWins);

  if (output.scores.length) {
    await db.insert(coachingScores).values(
      output.scores.map((s, idx) => ({
        label: s.label,
        score: s.score,
        sortIdx: idx,
      })),
    );
  }

  if (output.opportunities.length) {
    await db.insert(coachingOpportunities).values(
      output.opportunities.map((o, idx) => ({
        title: o.title,
        detail: o.detail,
        impactText: o.impact,
        impactTone:
          o.impact === "high impact" ? ("bad" as const) :
          o.impact === "medium" ? ("warn" as const) :
          ("good" as const),
        sortIdx: idx,
      })),
    );
  }

  if (output.wins.length) {
    await db.insert(coachingWins).values(
      output.wins.map((w, idx) => ({
        prefix: w.prefix,
        num: w.num ?? null,
        suffix: w.suffix ?? null,
        sortIdx: idx,
      })),
    );
  }

  revalidateTag("dashboard-kpis", "default");
  revalidateTag("coaching-panel", "default");

  return { ok: true, data: { graded: callsWithTurns.length } };
}
