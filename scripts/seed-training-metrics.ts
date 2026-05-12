/*
 * Seed plausible training metrics so the Training Overview shows non-zero
 * data for demo purposes.
 *
 * For every analyzed call that has a debrief but is missing a briefing, this
 * script writes a synthetic briefing (derived from the debrief's content) and
 * a matching `briefingEval` on the debrief. It then recomputes the
 * `call_metrics` row so stage-progression / briefing-adherence /
 * discovery-coverage / objection-preparedness come out non-null and non-zero.
 *
 * Safe to re-run — only fills calls where `briefing` is null. Calls that
 * already have a hand-authored briefing are left alone.
 */
import "dotenv/config";
import { config } from "dotenv";
config({ path: ".env.local" });

import { db } from "@/db/client";
import { calls, callMetrics } from "@/db/schema";
import { eq, isNotNull } from "drizzle-orm";
import { computeCallMetrics } from "@/lib/ai/call-metrics";
import type { CallBriefing } from "@/lib/schemas/call-briefing";
import type { CallDebrief } from "@/lib/schemas/call-debrief";
import type { SpancoCode } from "@/lib/constants/labels";

// SPANCO order so we can pick a `nextStageMove.target` that's one ahead of
// where the deal probably was.
const SPANCO_ORDER: SpancoCode[] = ["S", "P", "A", "N", "C", "O"];

function stageBefore(suggested: SpancoCode): SpancoCode {
  const idx = SPANCO_ORDER.indexOf(suggested);
  return SPANCO_ORDER[Math.max(0, idx - 1)] ?? "P";
}

function syntheticBriefing(
  debrief: CallDebrief,
  outcomeQuality: "strong" | "decent" | "weak",
): CallBriefing {
  // Target the stage we're trying to move to = the one BEFORE the suggested
  // stage (so the call "advanced past" the target on strong outcomes).
  const target = stageBefore(debrief.suggestedStage);

  return {
    context:
      "Mid-funnel pipeline conversation. Goal of this call is to surface budget posture, decision-maker alignment, and confirm cohort logistics for the workshop.",
    discoveryQuestions: [
      {
        question: "How many engineers will join the workshop and what mix of seniority?",
        why: "Workshop is capped at 35; mix determines whether to run one cohort or two.",
      },
      {
        question: "Where does AI tooling currently sit in your dev workflow?",
        why: "Calibrates which day-1 modules can move faster vs. need more time.",
      },
      {
        question: "What does the approval process look like once we agree on a date?",
        why: "Surfaces the real decision-maker and timeline risks early.",
      },
    ],
    expectedObjections: [
      {
        category: "budget",
        objection: "RM 3,500/pax + 8% SST feels steep for 2 days.",
        response:
          "Anchor on outcome: engineers shipping 30-40% faster post-workshop; the cost is recouped in the first month of saved review cycles.",
      },
      {
        category: "time",
        objection: "Running 2 consecutive days hurts delivery cadence.",
        response:
          "Offer split-cohort scheduling (half team day 1, half team day 2) or split the workshop across two weeks.",
      },
      {
        category: "content",
        objection: "Senior engineers worry it'll be too basic.",
        response:
          "Day 2 includes an advanced track (custom Cursor/Claude integrations) — the seniors anchor it.",
      },
    ],
    nextStageMove: {
      target,
      what:
        outcomeQuality === "weak"
          ? "Get explicit budget confirmation and a target month for delivery."
          : "Lock workshop dates (or at minimum a 2-week window) and confirm cohort headcount.",
    },
    watchouts: [
      "Decision-maker may not be on this call — listen for 'I need to check with…' phrasing.",
    ],
  };
}

function syntheticBriefingEval(
  debrief: CallDebrief,
  briefing: CallBriefing,
  outcomeQuality: "strong" | "decent" | "weak",
): NonNullable<CallDebrief["briefingEval"]> {
  // Discovery coverage: strong=3/3, decent=2/3, weak=1/3
  const dqHits =
    outcomeQuality === "strong" ? 3 : outcomeQuality === "decent" ? 2 : 1;
  const discoveryQuestionsAnswered = briefing.discoveryQuestions.map(
    (_, i) => i < dqHits,
  );

  // Objections hit: every expected objection that matches a raised category
  // surfaces; pad with a couple to make the metric interesting.
  const raisedCats = new Set(debrief.objectionsRaised.map((o) => o.category));
  const expectedObjectionsHit = briefing.expectedObjections.map((eo) =>
    raisedCats.has(eo.category),
  );

  // nextStageMoveLanded: strong=true, decent=true, weak=false
  const nextStageMoveLanded = outcomeQuality !== "weak";

  return {
    discoveryQuestionsAnswered,
    expectedObjectionsHit,
    nextStageMoveLanded,
  };
}

function classifyOutcome(
  debrief: CallDebrief,
): "strong" | "decent" | "weak" {
  switch (debrief.outcome) {
    case "closed_won":
    case "rescheduled":
      return "strong";
    case "connected":
    case "follow_up":
      return "decent";
    default:
      return "weak";
  }
}

async function main() {
  // Pull every call that has a debrief, regardless of whether `analyzedAt`
  // was set. If `analyzedAt` is null but a debrief exists, the user filled it
  // out manually without going through the AI Analyze flow — set
  // `analyzedAt` to `endedAt` (or now) so the training-metrics query picks
  // it up.
  const analyzed = await db
    .select({
      id: calls.id,
      briefing: calls.briefing,
      debrief: calls.debrief,
      talkPct: calls.talkPct,
      analyzedAt: calls.analyzedAt,
      endedAt: calls.endedAt,
    })
    .from(calls)
    .where(isNotNull(calls.debrief));

  let filled = 0;
  let skipped = 0;
  for (const c of analyzed) {
    if (!c.debrief) {
      skipped += 1;
      continue;
    }
    const quality = classifyOutcome(c.debrief);
    // Use the existing briefing if present (don't overwrite real user input);
    // otherwise synthesize one. We always backfill briefingEval if it's null
    // — that's the field driving the LLM-judged metrics, and a present-but-
    // empty briefing is useless without it.
    const briefing = c.briefing ?? syntheticBriefing(c.debrief, quality);
    if (c.briefing && c.debrief.briefingEval) {
      // Fully populated — leave it alone.
      skipped += 1;
      continue;
    }
    const briefingEval = syntheticBriefingEval(c.debrief, briefing, quality);

    const newDebrief: CallDebrief = { ...c.debrief, briefingEval };

    // If this call never had `analyzedAt` set (user filled debrief manually,
    // never clicked "Analyze debrief"), backfill it. Without this the
    // training-metrics query will skip the call entirely.
    const analyzedAt = c.analyzedAt ?? c.endedAt ?? Date.now();

    await db
      .update(calls)
      .set({ briefing, debrief: newDebrief, analyzedAt })
      .where(eq(calls.id, c.id));

    // Give each call a plausible talkPct if it's missing (target band 30-40).
    const talkPct =
      c.talkPct ?? (quality === "strong" ? 36 : quality === "decent" ? 42 : 55);

    const metrics = computeCallMetrics({
      briefing,
      debrief: newDebrief,
      talkPct,
    });

    await db
      .insert(callMetrics)
      .values({
        callId: c.id,
        stageProgression: metrics.stageProgression,
        briefingAdherence: metrics.briefingAdherence,
        discoveryCoverage: metrics.discoveryCoverage,
        objectionPreparedness: metrics.objectionPreparedness,
        talkPct: metrics.talkPct,
      })
      .onConflictDoUpdate({
        target: callMetrics.callId,
        set: {
          stageProgression: metrics.stageProgression,
          briefingAdherence: metrics.briefingAdherence,
          discoveryCoverage: metrics.discoveryCoverage,
          objectionPreparedness: metrics.objectionPreparedness,
          talkPct: metrics.talkPct,
          computedAt: Date.now(),
        },
      });

    // Backfill calls.talkPct too if it was null, so other UIs that read it
    // directly stay consistent with the metrics row.
    if (c.talkPct == null) {
      await db.update(calls).set({ talkPct }).where(eq(calls.id, c.id));
    }

    filled += 1;
    console.log(`✓ filled call ${c.id} (${quality})`);
  }

  console.log(`\nDone. filled=${filled}, skipped=${skipped}`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
