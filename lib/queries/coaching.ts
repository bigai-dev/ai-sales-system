import { unstable_cache } from "next/cache";
import { db } from "@/db/client";
import {
  coachingOpportunities as oppT,
  coachingScores as scoreT,
  coachingWins as winT,
} from "@/db/schema";
import { scoreBreakdown as seedScores, opportunities as seedOpps, wins as seedWins } from "@/lib/data";

export type CoachingPanelData = {
  scores: { label: string; score: number }[];
  opportunities: { title: string; detail: string; impact: { text: string; tone: "good" | "warn" | "bad" | "info" } }[];
  wins: [string, string, string][];
  sourcedFrom: "db" | "seed";
};

export const getCoachingPanel = unstable_cache(
  async (): Promise<CoachingPanelData> => {
    const [scoreRows, oppRows, winRows] = await Promise.all([
      db.select().from(scoreT).orderBy(scoreT.sortIdx),
      db.select().from(oppT).orderBy(oppT.sortIdx),
      db.select().from(winT).orderBy(winT.sortIdx),
    ]);

    if (scoreRows.length === 0 && oppRows.length === 0 && winRows.length === 0) {
      // Fall back to the static seed so the dashboard never looks empty
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
  { tags: ["coaching-panel"] },
);
