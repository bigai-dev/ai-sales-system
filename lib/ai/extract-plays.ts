"use server";

import { eq } from "drizzle-orm";
import { revalidatePath, revalidateTag } from "next/cache";
import { db } from "@/db/client";
import { drillBestResponses, plays } from "@/db/schema";
import type { CallBriefing } from "@/lib/schemas/call-briefing";
import type { CallDebrief } from "@/lib/schemas/call-debrief";
import type { DrillBucket } from "@/lib/schemas/drill";

type ExtractInput = {
  callId: string;
  briefing: CallBriefing | null;
  debrief: CallDebrief;
  notes: string | null;
};

// Heuristic threshold for "drill best-response was delivered live."
// We compare normalized token bags between drillBestResponses[bucket] and
// the rep's notes; if Jaccard similarity exceeds 0.4 OR a 30-char run of
// the best-response appears verbatim in the notes, treat it as delivered.
const SIMILARITY_THRESHOLD = 0.4;

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function tokens(s: string): Set<string> {
  return new Set(
    normalize(s)
      .split(" ")
      .filter((t) => t.length >= 4),
  );
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  for (const t of a) if (b.has(t)) inter += 1;
  return inter / (a.size + b.size - inter);
}

function hasVerbatimRun(haystack: string, needle: string, runChars = 30): boolean {
  if (needle.length < runChars) return false;
  const h = normalize(haystack);
  const n = normalize(needle);
  for (let i = 0; i <= n.length - runChars; i += runChars) {
    const slice = n.slice(i, i + runChars);
    if (h.includes(slice)) return true;
  }
  return false;
}

// Pick the rep's actual reply excerpt for a given objection. The debrief
// stores the verbatim of what the prospect SAID; we want the rep's reply.
// Best proxy: the call notes contain the rep's wording. Pull a window
// around the objection's bucket-keyword from notes; fall back to the
// debrief's coachingNote if notes are sparse.
function bestResponseExcerpt(args: {
  notes: string | null;
  debrief: CallDebrief;
  fallbackHint: string;
}): string {
  const { notes, debrief, fallbackHint } = args;
  if (notes && notes.length > 60) {
    return notes.slice(0, 280);
  }
  if (debrief.commitments.length > 0) {
    const repCommit = debrief.commitments.find((c) => c.who === "rep");
    if (repCommit) return repCommit.what.slice(0, 280);
  }
  return debrief.coachingNote.slice(0, 280) || fallbackHint;
}

// Returns the number of plays inserted for this call.
export async function extractPlays(input: ExtractInput): Promise<number> {
  const { callId, briefing, debrief, notes } = input;
  const inserts: Array<{
    bucket: DrillBucket | "other";
    scenario: string;
    repResponseExcerpt: string;
    outcome: string;
    source: "coaching_strength" | "drill_delivered" | "closed_won";
  }> = [];

  // Trigger 3: closed_won — extract every objection + response.
  if (debrief.outcome === "closed_won") {
    for (const obj of debrief.objectionsRaised) {
      inserts.push({
        bucket: obj.category,
        scenario: obj.verbatim,
        repResponseExcerpt: bestResponseExcerpt({
          notes,
          debrief,
          fallbackHint: `Closed-won response on ${obj.category}.`,
        }),
        outcome: debrief.outcome,
        source: "closed_won",
      });
    }
  }

  // Trigger 1: coachingNote calls the response a strength AND an objection
  // surfaced. Heuristic: coachingNote starts with or contains a
  // "strength" cue ("strong", "well", "great", "kept", "good", "nice",
  // "effective") and we have at least one objectionRaised.
  const STRENGTH_CUES = ["strong", "well", "great", "good", "nice", "effective", "kept", "excellent", "sharp"];
  const noteLow = debrief.coachingNote.toLowerCase();
  const hasStrengthCue = STRENGTH_CUES.some((c) => noteLow.includes(c));

  if (hasStrengthCue && debrief.objectionsRaised.length > 0 && debrief.outcome !== "closed_won") {
    // Pick the first objection — without finer signal we don't know which
    // one the coachingNote referred to. The rep can hide noise via the UI.
    const first = debrief.objectionsRaised[0];
    inserts.push({
      bucket: first.category,
      scenario: first.verbatim,
      repResponseExcerpt: debrief.coachingNote.slice(0, 280),
      outcome: debrief.outcome,
      source: "coaching_strength",
    });
  }

  // Trigger 2: a drillBestResponse was delivered live. We compare each
  // bucket's best response against the call notes; on similarity hit, we
  // extract the play AND tag drillBestResponses.callId so future Phase D
  // queries can see the live-delivery loop.
  if (notes && notes.trim().length > 0) {
    const bestRows = await db.select().from(drillBestResponses);
    for (const best of bestRows) {
      const tNotes = tokens(notes);
      const tBest = tokens(best.repResponse);
      const sim = jaccard(tNotes, tBest);
      const verbatim = hasVerbatimRun(notes, best.repResponse);
      if (sim >= SIMILARITY_THRESHOLD || verbatim) {
        const bucket = best.bucket as DrillBucket;
        // Find the corresponding objection in the debrief if any, to anchor
        // the scenario; otherwise use a synthetic stub.
        const matching = debrief.objectionsRaised.find((o) => o.category === bucket);
        inserts.push({
          bucket,
          scenario: matching
            ? matching.verbatim
            : `${bucket} objection — drill best-response delivered live.`,
          repResponseExcerpt: best.repResponse.slice(0, 280),
          outcome: debrief.outcome,
          source: "drill_delivered",
        });
        // Tag the best-response with this call so analytics can later show
        // "your drill best showed up in 3 of your last 10 calls."
        await db
          .update(drillBestResponses)
          .set({ callId })
          .where(eq(drillBestResponses.bucket, bucket));
      }
    }
  }

  if (inserts.length === 0) return 0;

  // Dedup: when the same call has both closed_won and drill_delivered
  // matching the same bucket, prefer closed_won (more durable evidence).
  const byBucketSource = new Map<string, (typeof inserts)[number]>();
  const SOURCE_RANK = { closed_won: 3, coaching_strength: 2, drill_delivered: 1 };
  for (const ins of inserts) {
    const key = `${ins.bucket}:${ins.scenario.slice(0, 60)}`;
    const existing = byBucketSource.get(key);
    if (!existing || SOURCE_RANK[ins.source] > SOURCE_RANK[existing.source]) {
      byBucketSource.set(key, ins);
    }
  }
  const final = Array.from(byBucketSource.values());

  await db.insert(plays).values(
    final.map((f) => ({
      callId,
      bucket: f.bucket,
      scenario: f.scenario,
      repResponseExcerpt: f.repResponseExcerpt,
      outcome: f.outcome,
      source: f.source,
    })),
  );

  revalidatePath("/training/playbook");
  revalidateTag("training-trends", "default");
  // Briefing reads back unused for now, but suppress the lint about it.
  void briefing;

  return final.length;
}
