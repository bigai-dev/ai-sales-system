/*
 * One-shot backfill for the call_metrics table.
 *
 * For every analyzed call (calls.analyzedAt IS NOT NULL), compute and upsert
 * a row in call_metrics. Old debriefs predate the briefingEval extension, so
 * the LLM-judged metrics (briefingAdherence, discoveryCoverage,
 * objectionPreparedness) come out NULL. The rule-based metrics
 * (stageProgression, talkPct) are populated from existing JSON.
 *
 * Re-running is safe (uses ON CONFLICT DO UPDATE).
 */
import { db } from "@/db/client";
import { calls, callMetrics } from "@/db/schema";
import { isNotNull } from "drizzle-orm";
import { computeCallMetrics } from "@/lib/ai/call-metrics";

async function main() {
  const analyzed = await db
    .select({
      id: calls.id,
      briefing: calls.briefing,
      debrief: calls.debrief,
      talkPct: calls.talkPct,
    })
    .from(calls)
    .where(isNotNull(calls.analyzedAt));

  console.log(`Backfilling metrics for ${analyzed.length} analyzed calls...`);
  let written = 0;
  for (const c of analyzed) {
    const metrics = computeCallMetrics({
      briefing: c.briefing ?? null,
      debrief: c.debrief ?? null,
      talkPct: c.talkPct ?? null,
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
    written += 1;
  }
  console.log(`Wrote ${written} rows.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
