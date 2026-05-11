"use server";

import { generateText, Output } from "ai";
import { desc, eq } from "drizzle-orm";
import { chat } from "./deepseek";
import { db } from "@/db/client";
import { drillBestResponses, drills } from "@/db/schema";
import {
  DRILL_BUCKET_HELP,
  DRILL_BUCKET_LABEL,
  dryRunPackSchema,
  scenarioOutputSchema,
  type DrillBucket,
  type DryRunPack,
  type ScenarioOutput,
} from "@/lib/schemas/drill";
import type { CallBriefing } from "@/lib/schemas/call-briefing";
import type { Result } from "@/lib/types";
import { getPlayExemplars, type PlayBucket } from "@/lib/queries/plays";

const BUCKETS_PRIMER = `Workshop economics: RM 3,500/pax + 8% SST. Cohorts capped at ~35.
Sold to Malaysian SME founders / dev managers.

Objection bucket primer:
- content: pushback on what's taught — depth, vendor lock-in, post-workshop applicability.
- budget: RM 3,500/pax pricing, internal approval delays, PO process.
- venue: on-site vs remote, travel costs, recording rights.
- time: 2-day duration, weekday/weekend, ERP-migration prep, quarter-end pressure.`;

async function getRecentRepResponseExcerpts(
  bucket: DrillBucket,
  limit = 3,
): Promise<string[]> {
  const rows = await db
    .select({ repResponse: drills.repResponse })
    .from(drills)
    .where(eq(drills.bucket, bucket))
    .orderBy(desc(drills.grade), desc(drills.createdAt))
    .limit(limit);
  return rows.map((r) => r.repResponse.slice(0, 220));
}

// --- Single drill scenario (drill library) ----------------------------------

const DRILL_SYSTEM = `You generate a single objection-handling DRILL scenario
for a Malaysian solo founder selling 2-day vibe-coding workshops.

${BUCKETS_PRIMER}

Output a verbatim prospect statement that lands like something a real Malaysian
SME contact would say in conversation (not interview-style). Then output a
2-3 bullet rubric anchored to the chosen bucket — what a good response would
DO (defuse, redirect, anchor on outcomes), not what it would SAY.

Vary the scenario across runs. Avoid hypotheticals like "imagine a prospect
said". Quote it directly.`;

export async function generateDrillScenario(
  bucket: DrillBucket,
): Promise<Result<ScenarioOutput>> {
  const [recentBest, exemplars] = await Promise.all([
    getRecentRepResponseExcerpts(bucket, 2),
    getPlayExemplars([bucket as PlayBucket], 2),
  ]);
  const variationHint = recentBest.length
    ? `Recent rep responses in this bucket (avoid generating a scenario that's a near-duplicate of these themes):\n${recentBest
        .map((r, i) => `${i + 1}. ${r}`)
        .join("\n")}`
    : "No prior drills in this bucket yet — pick a fresh, realistic angle.";

  // Pinned plays from real calls — fold in as "real situations to draw from"
  // so the scenario feels grounded rather than synthetic.
  const exemplarHint = exemplars.length
    ? `\n\nReal scenarios from the rep's actual calls (use these as inspiration, do NOT copy verbatim):\n${exemplars
        .map((e, i) => `${i + 1}. Prospect said: "${e.scenario}" → Rep replied: "${e.repResponseExcerpt}"`)
        .join("\n")}`
    : "";

  try {
    const res = await generateText({
      model: chat,
      output: Output.object({ schema: scenarioOutputSchema }),
      system: DRILL_SYSTEM,
      prompt: `Bucket: ${DRILL_BUCKET_LABEL[bucket]} — ${DRILL_BUCKET_HELP[bucket]}\n\n${variationHint}${exemplarHint}\n\nGenerate the drill scenario now.`,
      maxOutputTokens: 600,
    });
    const parsed = scenarioOutputSchema.parse(res.output);
    return { ok: true, data: parsed };
  } catch (e) {
    return { ok: false, error: `Scenario generator failed: ${(e as Error).message}` };
  }
}

// --- Dry-run pack (3 prospect-specific moments) -----------------------------

const DRY_RUN_SYSTEM = `You generate a PRE-CALL DRY RUN pack of 3 moments for a
Malaysian solo founder selling 2-day vibe-coding workshops.

${BUCKETS_PRIMER}

The rep is dialing this prospect in the next ~15 minutes. Pick the THREE
hardest opening exchanges to expect, ordered:
  1) early rapport-break or mis-framing
  2) mid-call objection (most likely from briefing.expectedObjections)
  3) closing-line resistance to the briefing's nextStageMove commitment

Each moment is verbatim prospect speech — punchy, conversational, NOT
interview-style. Anchor each on a specific detail the briefing surfaced
(industry, employee count, audit risk, decision-maker stance) so the rep
can't drill on something generic.

For bucket, pick from content/budget/venue/time — the closest fit. Each
moment also gets a 2-3 bullet rubric for the grader.`;

export async function generateDryRunPack(args: {
  briefing: CallBriefing;
  clientName: string;
  industry: string | null;
  size: string | null;
  employees: number | null;
  devCount: number | null;
}): Promise<Result<DryRunPack>> {
  const { briefing, clientName, industry, size, employees, devCount } = args;
  const briefingSummary = {
    context: briefing.context,
    expectedObjections: briefing.expectedObjections.map((o) => ({
      category: o.category,
      objection: o.objection,
    })),
    nextStageMove: briefing.nextStageMove,
    watchouts: briefing.watchouts,
    discoveryQuestions: briefing.discoveryQuestions.map((q) => q.question),
  };

  // Pull pinned exemplars matching the briefing's expected-objection buckets,
  // so the dry-run grader can later reward the rep for echoing winning lines.
  const expectedBuckets = briefing.expectedObjections
    .map((o) => o.category)
    .filter((c): c is PlayBucket => c !== "other" || true);
  const exemplars = await getPlayExemplars(expectedBuckets, 1);
  const exemplarHint = exemplars.length
    ? `\n\nWinning lines from the rep's prior calls (let the rubric reward responses that echo these patterns — but do NOT lift them verbatim into rubric text):\n${exemplars
        .map((e, i) => `${i + 1}. (${e.bucket}) "${e.repResponseExcerpt}"`)
        .join("\n")}`
    : "";

  try {
    const res = await generateText({
      model: chat,
      output: Output.object({ schema: dryRunPackSchema }),
      system: DRY_RUN_SYSTEM,
      prompt: `Client: ${clientName}${industry ? ` (${industry})` : ""}${size ? ` · ${size}` : ""}${employees ? ` · ${employees} employees` : ""}${devCount ? ` · ${devCount} devs` : ""}\n\nBriefing summary:\n${JSON.stringify(briefingSummary, null, 2)}${exemplarHint}\n\nGenerate the 3-moment dry-run pack now.`,
      maxOutputTokens: 900,
    });
    const parsed = dryRunPackSchema.parse(res.output);
    return { ok: true, data: parsed };
  } catch (e) {
    return { ok: false, error: `Dry-run pack generator failed: ${(e as Error).message}` };
  }
}

// Re-export for use in drill UI submit flow.
export async function getCurrentBest(
  bucket: DrillBucket,
): Promise<{ grade: number; excerpt: string } | null> {
  const [row] = await db
    .select({ grade: drillBestResponses.grade, repResponse: drillBestResponses.repResponse })
    .from(drillBestResponses)
    .where(eq(drillBestResponses.bucket, bucket))
    .limit(1);
  if (!row) return null;
  return { grade: row.grade, excerpt: row.repResponse.slice(0, 220) };
}
