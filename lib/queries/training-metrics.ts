import { unstable_cache } from "next/cache";
import { and, desc, eq, gte, isNotNull } from "drizzle-orm";
import { db } from "@/db/client";
import { calls, callMetrics } from "@/db/schema";

const DAY_MS = 24 * 60 * 60 * 1000;
const WINDOW_DAYS = 30;
const RECENT_DAYS = 7;

export type MetricKey =
  | "stageProgression"
  | "briefingAdherence"
  | "discoveryCoverage"
  | "objectionPreparedness"
  | "talkPct";

export type MetricSeries = {
  key: MetricKey;
  label: string;
  shortHelp: string;
  // 'higher' = bigger is better. 'band' = target range (talkPct).
  scale: "higher" | "band";
  band?: { min: number; max: number };
  current: number | null; // 0-100; null when no recent data
  delta30: number | null; // pct-point change vs days 8-30
  points: { ts: number; value: number }[]; // sparkline, ascending by ts
};

export type TrainingMetrics = {
  series: MetricSeries[];
  weakest: MetricSeries | null;
  totalAnalyzedCalls: number;
};

const META: Record<
  MetricKey,
  { label: string; help: string; scale: "higher" | "band"; band?: { min: number; max: number } }
> = {
  stageProgression: {
    label: "Stage progression",
    help: "Share of calls where the deal advanced past the briefing's target stage.",
    scale: "higher",
  },
  briefingAdherence: {
    label: "Briefing adherence",
    help: "Share of calls where you landed the briefing's nextStageMove commitment.",
    scale: "higher",
  },
  discoveryCoverage: {
    label: "Discovery coverage",
    help: "Average % of the briefing's discovery questions you got answered.",
    scale: "higher",
  },
  objectionPreparedness: {
    label: "Objection preparedness",
    help: "Of expected objections, share that you either pre-empted or engaged with on the call.",
    scale: "higher",
  },
  talkPct: {
    label: "Talk balance",
    help: "Your share of the conversation. Target band is 30–40%.",
    scale: "band",
    band: { min: 30, max: 40 },
  },
};

const KEYS: MetricKey[] = [
  "stageProgression",
  "briefingAdherence",
  "discoveryCoverage",
  "objectionPreparedness",
  "talkPct",
];

// stageProgression and briefingAdherence are stored as 0/1 ints; expand to
// 0/100 so all five series share one percentage visualization scale.
const IS_BOOLEAN: Record<MetricKey, boolean> = {
  stageProgression: true,
  briefingAdherence: true,
  discoveryCoverage: false,
  objectionPreparedness: false,
  talkPct: false,
};

function avg(values: number[]): number | null {
  if (values.length === 0) return null;
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
}

async function fetchTrainingMetrics(): Promise<TrainingMetrics> {
  const now = Date.now();
  const windowStart = now - WINDOW_DAYS * DAY_MS;
  const recentStart = now - RECENT_DAYS * DAY_MS;

  const rows = await db
    .select({
      ts: calls.analyzedAt,
      stageProgression: callMetrics.stageProgression,
      briefingAdherence: callMetrics.briefingAdherence,
      discoveryCoverage: callMetrics.discoveryCoverage,
      objectionPreparedness: callMetrics.objectionPreparedness,
      talkPct: callMetrics.talkPct,
    })
    .from(callMetrics)
    .innerJoin(calls, eq(calls.id, callMetrics.callId))
    .where(and(isNotNull(calls.analyzedAt), gte(calls.analyzedAt, windowStart)))
    .orderBy(desc(calls.analyzedAt));

  const series: MetricSeries[] = KEYS.map((key) => {
    const points: { ts: number; value: number }[] = [];
    const recentValues: number[] = [];
    const priorValues: number[] = [];

    for (const r of rows) {
      const ts = r.ts ?? 0;
      const raw = r[key];
      if (raw === null || raw === undefined) continue;
      const val = IS_BOOLEAN[key] ? raw * 100 : raw;
      points.push({ ts, value: val });
      if (ts >= recentStart) recentValues.push(val);
      else if (ts >= windowStart) priorValues.push(val);
    }

    points.sort((a, b) => a.ts - b.ts);

    const current = avg(recentValues);
    const prior = avg(priorValues);
    const delta30 = current !== null && prior !== null ? current - prior : null;

    return {
      key,
      label: META[key].label,
      shortHelp: META[key].help,
      scale: META[key].scale,
      band: META[key].band,
      current,
      delta30,
      points,
    };
  });

  const candidates = series.filter(
    (s): s is MetricSeries & { current: number } =>
      s.scale === "higher" && typeof s.current === "number",
  );
  const weakest = candidates.length
    ? candidates.reduce((min, s) => (s.current < min.current ? s : min))
    : null;

  return {
    series,
    weakest,
    totalAnalyzedCalls: rows.length,
  };
}

export const getTrainingMetrics = unstable_cache(fetchTrainingMetrics, ["training-metrics"], {
  tags: ["training-trends"],
  revalidate: 300,
});
