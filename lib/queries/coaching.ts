import { unstable_cache } from "next/cache";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import {
  coachingOpportunities as oppT,
  coachingScores as scoreT,
  coachingWins as winT,
} from "@/db/schema";
import { scoreBreakdown as seedScores, opportunities as seedOpps, wins as seedWins } from "@/lib/data/fallbacks";

export type CoachingPanelData = {
  scores: { label: string; score: number }[];
  opportunities: { title: string; detail: string; impact: { text: string; tone: "good" | "warn" | "bad" | "info" } }[];
  wins: [string, string, string][];
  sourcedFrom: "db" | "seed";
};

// The latest runId is whichever one wrote rows most recently. We pick from
// scores because every grader run inserts at least one score row; if it
// didn't insert opportunities/wins for a given run, those tables fall back
// to the most recent rows by generatedAt for that run id.
async function findLatestRunId(): Promise<string | null> {
  const [latest] = await db
    .select({ runId: scoreT.runId })
    .from(scoreT)
    .orderBy(desc(scoreT.generatedAt))
    .limit(1);
  return latest?.runId ?? null;
}

function seedFallback(): CoachingPanelData {
  return {
    scores: seedScores.map((s) => ({ label: s.label, score: s.score })),
    opportunities: seedOpps.map((o) => ({
      title: o.title,
      detail: o.detail,
      impact: { text: o.impact.text, tone: o.impact.tone },
    })),
    wins: seedWins,
    sourcedFrom: "seed",
  };
}

export const getCoachingPanel = unstable_cache(
  async (): Promise<CoachingPanelData> => {
    const runId = await findLatestRunId();
    if (!runId) return seedFallback();

    const [scoreRows, oppRows, winRows] = await Promise.all([
      db.select().from(scoreT).where(eq(scoreT.runId, runId)).orderBy(scoreT.sortIdx),
      db.select().from(oppT).where(eq(oppT.runId, runId)).orderBy(oppT.sortIdx),
      db.select().from(winT).where(eq(winT.runId, runId)).orderBy(winT.sortIdx),
    ]);

    if (scoreRows.length === 0 && oppRows.length === 0 && winRows.length === 0) {
      return seedFallback();
    }

    return {
      scores: scoreRows.map((s) => ({ label: s.label, score: s.score })),
      opportunities: oppRows.map((o) => ({
        title: o.title,
        detail: o.detail,
        impact: { text: o.impactText, tone: o.impactTone },
      })),
      wins: winRows.map(
        (w) => [w.prefix, w.num ?? "", w.suffix ?? ""] as [string, string, string],
      ),
      sourcedFrom: "db",
    };
  },
  ["coaching-panel"],
  { tags: ["coaching-panel"], revalidate: 300 },
);
