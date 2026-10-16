import Link from "next/link";
import { Flame } from "lucide-react";
import {
  getBucketSummaries,
  getDrillStreak,
  getRecentDrillsAcrossBuckets,
} from "@/lib/queries/drills";
import { TOPIC_LABEL } from "@/lib/constants/labels";
import { PAGE } from "@/lib/constants/copy";
import { routes } from "@/lib/constants/routes";
import { PageHeader, Panel, SectionLabel, StatusChip } from "@/components/ui";

export const metadata = { title: PAGE.rolePlay.title };

export default async function RolePlayHub() {
  const [summaries, streak, recentDrills] = await Promise.all([
    getBucketSummaries(),
    getDrillStreak(),
    getRecentDrillsAcrossBuckets(5),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        back={{ href: routes.training(), label: "Training" }}
        title={PAGE.rolePlay.title}
        description={`${PAGE.rolePlay.description} Your best reply on each topic is the bar to beat.`}
        actions={
          <div className="text-right">
            <div className="inline-flex items-center gap-1.5 text-2xl font-semibold tabular-nums">
              <Flame size={22} className="text-accent" aria-hidden />
              Day {streak.current}
            </div>
            <div className="text-xs text-muted">
              {streak.drilledToday
                ? "Today's role play done. Back tomorrow."
                : "Do one role play today to keep the streak."}
            </div>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {summaries.map((s) => (
          <Link
            key={s.bucket}
            href={routes.rolePlay(s.bucket)}
            className="panel group p-5 transition hover:border-accent"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold">{TOPIC_LABEL[s.bucket]}</div>
                <div className="mt-0.5 text-sm text-muted transition group-hover:text-accent">
                  {s.drillsCount === 0 ? "Try it for the first time" : "Practise again"}
                </div>
              </div>
              {s.best && (
                <div className="shrink-0 text-right">
                  <div className="text-xs text-muted">Best</div>
                  <div className="text-lg font-semibold tabular-nums">{s.best.grade}</div>
                </div>
              )}
            </div>
            <div className="mt-2 text-xs text-muted">{s.help}</div>
            {s.best && (
              <div className="mt-3 line-clamp-2 border-t border-border-subtle pt-3 text-xs text-muted">
                <span className="text-foreground/70">Your best so far:</span> {s.best.excerpt}
              </div>
            )}
            <div className="mt-3 text-xs text-muted">
              {s.drillsCount} role play{s.drillsCount === 1 ? "" : "s"} so far
            </div>
          </Link>
        ))}
      </div>

      {recentDrills.length > 0 && (
        <Panel title="Recent role plays">
          <ul className="divide-y divide-border-subtle">
            {recentDrills.map((d) => {
              const counts = d.repResponse.length >= 40 && d.grade >= 30;
              return (
                <li key={d.id}>
                  <Link
                    href={routes.rolePlay(d.bucket)}
                    className="row-hover -mx-2 block rounded-md px-2 py-3"
                  >
                    <div className="flex items-baseline justify-between gap-3">
                      <div className="flex flex-wrap items-baseline gap-2">
                        <span className="font-semibold tabular-nums">{d.grade}</span>
                        <SectionLabel>{TOPIC_LABEL[d.bucket]}</SectionLabel>
                        {!counts && <StatusChip>Too short to count</StatusChip>}
                        {d.didExceedBest && <StatusChip tone="good">New best</StatusChip>}
                      </div>
                      <div className="text-xs text-muted">
                        {new Date(d.createdAt).toLocaleString("en-MY", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                    <div className="mt-1 line-clamp-2 text-xs text-muted">{d.repResponse}</div>
                    <div className="mt-1 text-xs italic">{d.feedback}</div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </Panel>
      )}
    </div>
  );
}
