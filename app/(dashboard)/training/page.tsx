import Link from "next/link";
import { getTrainingMetrics } from "@/lib/queries/training-metrics";
import { getDrillStreak } from "@/lib/queries/drills";
import { getPinnedPlays } from "@/lib/queries/plays";
import WeakestMetricCallout from "@/components/training/WeakestMetricCallout";
import MetricSparkline from "@/components/training/MetricSparkline";
import PlayCard from "@/components/training/PlayCard";
import { DRILL_BUCKET_LABEL } from "@/lib/schemas/drill";

export const metadata = {
  title: "Training",
};

const STREAK_FIRE = "\u{1F525}"; // 🔥

export default async function TrainingLanding() {
  const [metrics, streak, pinned] = await Promise.all([
    getTrainingMetrics(),
    getDrillStreak(),
    getPinnedPlays(6),
  ]);
  const hasData = metrics.totalAnalyzedCalls > 0;
  const featured = metrics.series.slice(0, 3);

  const drillCtaHref = streak.weakestBucket
    ? `/training/drills/${streak.weakestBucket}`
    : "/training/drills";

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold">Training</h1>
          <div className="text-sm text-muted mt-1">
            Trends from your real calls + drills you can do in two minutes.
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/training/trends"
            className="px-3 py-2 rounded-lg border border-border-subtle text-sm font-semibold hover:bg-surface-elevated"
          >
            See trends
          </Link>
          <Link
            href={drillCtaHref}
            className="px-3 py-2 rounded-lg bg-accent text-accent-foreground text-sm font-semibold"
          >
            Drill now
          </Link>
        </div>
      </div>

      <div className="panel p-5 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="text-2xl font-semibold">
            {STREAK_FIRE} Day {streak.current} streak
          </div>
          <div className="text-sm text-muted mt-1">
            {streak.drilledToday
              ? "Today's drill done — back tomorrow."
              : streak.weakestBucket
                ? `Weakest bucket right now: ${DRILL_BUCKET_LABEL[streak.weakestBucket]}. Drill once today to keep the streak alive.`
                : "Drill once today to keep the streak alive."}
          </div>
        </div>
        <Link
          href={drillCtaHref}
          className="px-3 py-2 rounded-lg bg-accent text-accent-foreground text-sm font-semibold whitespace-nowrap"
        >
          {streak.weakestBucket
            ? `Drill ${DRILL_BUCKET_LABEL[streak.weakestBucket]}`
            : "Pick a bucket"}
        </Link>
      </div>

      <WeakestMetricCallout weakest={metrics.weakest} hasData={hasData} />

      {hasData && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {featured.map((s) => (
              <MetricSparkline key={s.key} series={s} />
            ))}
          </div>
          <div className="text-xs text-muted">
            Computed from {metrics.totalAnalyzedCalls} call
            {metrics.totalAnalyzedCalls === 1 ? "" : "s"} in the last 30 days. Metrics derive from
            existing briefing/debrief data — no extra LLM grading.
          </div>
        </>
      )}

      {pinned.length > 0 && (
        <div>
          <div className="flex items-end justify-between mb-3">
            <div>
              <div className="text-xs uppercase tracking-wider text-muted">Pinned plays</div>
              <h2 className="text-lg font-semibold mt-1">
                Winning lines from your real calls
              </h2>
            </div>
            <Link
              href="/training/playbook"
              className="text-xs underline underline-offset-2"
            >
              All plays →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pinned.map((p) => (
              <PlayCard key={p.id} play={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
