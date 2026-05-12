import { and, count, desc, eq, gte, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { drillBestResponses, drills } from "@/db/schema";
import {
  DRILL_BUCKETS,
  DRILL_BUCKET_HELP,
  DRILL_BUCKET_LABEL,
  type DrillBucket,
} from "@/lib/schemas/drill";

const DAY_MS = 24 * 60 * 60 * 1000;

// A drill submission only ticks the streak when it's substantive enough to
// represent real practice. Without these guards a one-character submission
// would gamify the streak.
const MIN_RESPONSE_CHARS = 40;
const MIN_GRADE_FOR_STREAK = 30;

export type BucketSummary = {
  bucket: DrillBucket;
  label: string;
  help: string;
  drillsCount: number;
  best: { grade: number; excerpt: string } | null;
  lastDrilledAt: number | null;
};

export async function getBucketSummaries(): Promise<BucketSummary[]> {
  // Pull aggregates per bucket in one query each — the bucket count is 4 so
  // this is fine without further consolidation.
  const summaries: BucketSummary[] = [];
  for (const bucket of DRILL_BUCKETS) {
    const [counts] = await db
      .select({
        n: count(),
        last: sql<number>`max(${drills.createdAt})`,
      })
      .from(drills)
      .where(eq(drills.bucket, bucket));

    const [best] = await db
      .select({ grade: drillBestResponses.grade, repResponse: drillBestResponses.repResponse })
      .from(drillBestResponses)
      .where(eq(drillBestResponses.bucket, bucket))
      .limit(1);

    summaries.push({
      bucket,
      label: DRILL_BUCKET_LABEL[bucket],
      help: DRILL_BUCKET_HELP[bucket],
      drillsCount: counts?.n ?? 0,
      best: best
        ? { grade: best.grade, excerpt: best.repResponse.slice(0, 220) }
        : null,
      lastDrilledAt: counts?.last ?? null,
    });
  }
  return summaries;
}

// Streak: number of consecutive calendar days (Asia/Kuala_Lumpur) ending
// today that the rep submitted a qualifying drill. A drill qualifies if
// repResponse.length >= 40 AND grade >= 30.
export async function getDrillStreak(): Promise<{
  current: number;
  drilledToday: boolean;
  weakestBucket: DrillBucket | null;
}> {
  // We grab last 60 days of qualifying drills; that's plenty headroom for
  // any plausible streak length without scanning the full table.
  const since = Date.now() - 60 * DAY_MS;
  const rows = await db
    .select({ createdAt: drills.createdAt, bucket: drills.bucket })
    .from(drills)
    .where(
      and(
        gte(drills.createdAt, since),
        sql`length(${drills.repResponse}) >= ${MIN_RESPONSE_CHARS}`,
        gte(drills.grade, MIN_GRADE_FOR_STREAK),
      ),
    )
    .orderBy(desc(drills.createdAt));

  // Bucket dates by Kuala_Lumpur calendar day. Asia/Kuala_Lumpur is UTC+8
  // year-round (no DST), so a fixed 8h offset suffices.
  const KL_OFFSET_MS = 8 * 60 * 60 * 1000;
  const dayKey = (ms: number): string => {
    const klDate = new Date(ms + KL_OFFSET_MS);
    return klDate.toISOString().slice(0, 10);
  };

  const today = dayKey(Date.now());
  const drilledDays = new Set(rows.map((r) => dayKey(r.createdAt)));

  const drilledToday = drilledDays.has(today);

  let current = 0;
  let cursor = new Date(today + "T00:00:00Z").getTime();
  while (drilledDays.has(dayKey(cursor + KL_OFFSET_MS))) {
    current += 1;
    cursor -= DAY_MS;
  }

  // Pick weakest bucket = lowest current best grade among the four.
  const bestRows = await db
    .select({ bucket: drillBestResponses.bucket, grade: drillBestResponses.grade })
    .from(drillBestResponses);
  const bestByBucket = new Map<DrillBucket, number>();
  for (const r of bestRows) {
    bestByBucket.set(r.bucket as DrillBucket, r.grade);
  }
  let weakestBucket: DrillBucket | null = null;
  let weakestGrade = Infinity;
  for (const b of DRILL_BUCKETS) {
    const g = bestByBucket.get(b);
    // A bucket with NO drills yet ranks weakest (encourages first-time drills).
    if (g === undefined) {
      weakestBucket = b;
      break;
    }
    if (g < weakestGrade) {
      weakestGrade = g;
      weakestBucket = b;
    }
  }

  return { current, drilledToday, weakestBucket };
}

export async function getRecentDrills(bucket: DrillBucket, limit = 5) {
  return db
    .select({
      id: drills.id,
      grade: drills.grade,
      feedback: drills.feedback,
      repResponse: drills.repResponse,
      didExceedBest: drills.didExceedBest,
      createdAt: drills.createdAt,
    })
    .from(drills)
    .where(eq(drills.bucket, bucket))
    .orderBy(desc(drills.createdAt))
    .limit(limit);
}

// Most recent drills across ALL buckets. Used by the Training overview so the
// rep can see their activity even when a drill didn't qualify for the streak
// (sub-40-char response or grade <30). Includes the bucket so each row can
// link back to its bucket page.
export async function getRecentDrillsAcrossBuckets(limit = 5) {
  return db
    .select({
      id: drills.id,
      bucket: drills.bucket,
      grade: drills.grade,
      feedback: drills.feedback,
      repResponse: drills.repResponse,
      didExceedBest: drills.didExceedBest,
      createdAt: drills.createdAt,
    })
    .from(drills)
    .orderBy(desc(drills.createdAt))
    .limit(limit);
}
