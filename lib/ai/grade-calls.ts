"use server";
import { friendlyError } from "./errors";
import { generateText, Output } from "ai";
import { and, desc, eq, isNotNull } from "drizzle-orm";
import { revalidateTag } from "next/cache";
import { createId } from "@paralleldrive/cuid2";
import { reasoner } from "./deepseek";
import { scrubObject } from "./scrub";
import { db } from "@/db/client";
import {
  calls,
  coachingOpportunities,
  coachingScores,
  coachingWins,
} from "@/db/schema";
import { graderSchema, type GraderOutput } from "@/lib/schemas/grade-calls";
import { stageLabel } from "@/lib/constants/labels";

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
  // Recent calls that have been reviewed (notes + AI review).
  const targetCalls = await db
    .select()
    .from(calls)
    .where(and(eq(calls.status, "completed"), isNotNull(calls.debrief)))
    .orderBy(desc(calls.analyzedAt))
    .limit(limit);

  const callsWithTurns = targetCalls.map((c) =>
    scrubObject({
      title: c.title,
      stage: stageLabel(c.debrief?.suggestedStage ?? c.stageHint),
      summary: c.debrief?.summary ?? c.summary,
      outcome: c.debrief?.outcome,
      objections: c.debrief?.objectionsRaised?.map((o) => o.verbatim) ?? [],
      commitments: c.debrief?.commitments?.map((k) => `${k.who}: ${k.what}`) ?? [],
      coachingNote: c.debrief?.coachingNote,
      notes: c.notes,
    }),
  );

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
    return { ok: false, error: friendlyError(e, "refresh the coaching") };
  }

  // Append a new run instead of replacing. The dashboard panel reads only
  // rows belonging to the latest runId; the Training Trends view reads
  // historical runs to chart progress over time.
  const runId = createId();

  if (output.scores.length) {
    await db.insert(coachingScores).values(
      output.scores.map((s, idx) => ({
        runId,
        label: s.label,
        score: s.score,
        sortIdx: idx,
      })),
    );
  }

  if (output.opportunities.length) {
    await db.insert(coachingOpportunities).values(
      output.opportunities.map((o, idx) => ({
        runId,
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
        runId,
        prefix: w.prefix,
        num: w.num ?? null,
        suffix: w.suffix ?? null,
        sortIdx: idx,
      })),
    );
  }

  revalidateTag("dashboard-kpis", "default");
  revalidateTag("coaching-panel", "default");
  revalidateTag("training-trends", "default");

  return { ok: true, data: { graded: callsWithTurns.length } };
}
