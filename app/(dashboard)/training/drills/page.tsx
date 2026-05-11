import Link from "next/link";
import { getBucketSummaries, getDrillStreak } from "@/lib/queries/drills";

export const metadata = {
  title: "Training drills",
};

const STREAK_FIRE = "\u{1F525}"; // 🔥

export default async function DrillsHub() {
  const [summaries, streak] = await Promise.all([
    getBucketSummaries(),
    getDrillStreak(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <div className="text-xs text-muted">
            <Link href="/training" className="underline underline-offset-2">
              Training
            </Link>
            <span className="mx-1">/</span> Drills
          </div>
          <h1 className="text-2xl font-semibold mt-1">Drills</h1>
          <div className="text-sm text-muted mt-1">
            Pick a bucket and drill an objection scenario. Your best response per bucket gets
            remembered as the bar to beat.
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-semibold">
            {STREAK_FIRE} Day {streak.current}
          </div>
          <div className="text-xs text-muted">
            {streak.drilledToday
              ? "Today's drill done — back tomorrow."
              : "Drill once today to keep the streak alive."}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {summaries.map((s) => (
          <Link
            key={s.bucket}
            href={`/training/drills/${s.bucket}`}
            className="panel p-5 hover:border-accent transition group"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs uppercase tracking-wider text-muted">{s.label}</div>
                <div className="font-semibold mt-1 group-hover:text-accent transition">
                  {s.drillsCount === 0 ? "Drill for the first time" : "Drill again"}
                </div>
              </div>
              {s.best && (
                <div className="text-right shrink-0">
                  <div className="text-xs text-muted">Best</div>
                  <div className="text-lg font-semibold">{s.best.grade}</div>
                </div>
              )}
            </div>
            <div className="text-xs text-muted mt-2">{s.help}</div>
            {s.best && (
              <div className="mt-3 text-xs text-muted border-t border-border-subtle pt-3 line-clamp-2">
                <span className="text-foreground/70">Your best so far:</span> {s.best.excerpt}
              </div>
            )}
            <div className="mt-3 text-[11px] text-muted">
              {s.drillsCount} drill{s.drillsCount === 1 ? "" : "s"} so far
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
