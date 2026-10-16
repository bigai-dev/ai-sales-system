import Link from "next/link";
import { Flame } from "lucide-react";
import { getTrainingMetrics } from "@/lib/queries/training-metrics";
import { getDrillStreak } from "@/lib/queries/drills";
import { getPinnedPlays } from "@/lib/queries/plays";
import WeakestMetricCallout from "@/components/training/WeakestMetricCallout";
import MetricSparkline from "@/components/training/MetricSparkline";
import PlayCard from "@/components/training/PlayCard";
import { TOPIC_LABEL } from "@/lib/constants/labels";
import { PAGE } from "@/lib/constants/copy";
import { routes } from "@/lib/constants/routes";
import { ButtonLink, PageHeader, Panel, SectionLabel } from "@/components/ui";

export const metadata = { title: PAGE.training.title };

export default async function TrainingPage() {
  const [metrics, streak, pinned] = await Promise.all([
    getTrainingMetrics(),
    getDrillStreak(),
    getPinnedPlays(6),
  ]);
  const hasData = metrics.totalAnalyzedCalls > 0;
  const weakestTopic = streak.weakestBucket ?? null;

  return (
    <div className="space-y-6">
      <PageHeader
        title={PAGE.training.title}
        description={PAGE.training.description}
        actions={<ButtonLink href={routes.rolePlay()}>Start role play</ButtonLink>}
      />

      <Panel className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-2xl font-semibold tabular-nums">
            <Flame size={22} className="text-accent" aria-hidden />
            Day {streak.current} streak
          </div>
          <p className="mt-1 text-sm text-muted">
            {streak.drilledToday
              ? "Today's role play done. Back tomorrow."
              : weakestTopic
                ? `Weakest topic right now: ${TOPIC_LABEL[weakestTopic]}. One role play today keeps the streak.`
                : "One role play today keeps the streak."}
          </p>
        </div>
        <ButtonLink href={routes.rolePlay(weakestTopic ?? undefined)} variant="ghost">
          {weakestTopic ? `Practise ${TOPIC_LABEL[weakestTopic]}` : "Choose a topic"}
        </ButtonLink>
      </Panel>

      <WeakestMetricCallout weakest={metrics.weakest} hasData={hasData} weakestTopic={weakestTopic} />

      {hasData && (
        <section>
          <SectionLabel hint="From your reviewed calls in the last 30 days. The change compares the last 7 days with the 3 weeks before." className="mb-3">
            Trends
          </SectionLabel>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {metrics.series.map((s) => (
              <MetricSparkline key={s.key} series={s} />
            ))}
          </div>
          <p className="mt-2 text-xs text-muted">
            Built from {metrics.totalAnalyzedCalls} reviewed call
            {metrics.totalAnalyzedCalls === 1 ? "" : "s"}.
          </p>
        </section>
      )}

      {pinned.length > 0 && (
        <section>
          <div className="mb-3 flex items-end justify-between">
            <SectionLabel hint="Lines that worked on real calls.">Pinned plays</SectionLabel>
            <Link href={routes.playbook()} className="text-xs underline underline-offset-2">
              All plays
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {pinned.map((p) => (
              <PlayCard key={p.id} play={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
