import Link from "next/link";
import { getTrainingMetrics } from "@/lib/queries/training-metrics";
import WeakestMetricCallout from "@/components/training/WeakestMetricCallout";
import MetricSparkline from "@/components/training/MetricSparkline";

export const metadata = {
  title: "Training trends",
};

export default async function TrainingTrendsPage() {
  const metrics = await getTrainingMetrics();
  const hasData = metrics.totalAnalyzedCalls > 0;
  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <div className="text-xs text-muted">
            <Link href="/training" className="underline underline-offset-2">
              Training
            </Link>{" "}
            <span className="mx-1">/</span> Trends
          </div>
          <h1 className="text-2xl font-semibold mt-1">Trends</h1>
          <div className="text-sm text-muted mt-1">
            Five metrics derived from the briefing → debrief loop. Last 30 days.
          </div>
        </div>
      </div>

      <WeakestMetricCallout weakest={metrics.weakest} hasData={hasData} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {metrics.series.map((s) => (
          <MetricSparkline key={s.key} series={s} />
        ))}
      </div>

      {hasData && (
        <div className="text-xs text-muted">
          Computed from {metrics.totalAnalyzedCalls} call
          {metrics.totalAnalyzedCalls === 1 ? "" : "s"} in the last 30 days. The 30d delta compares
          the last 7 days to days 8–30 of the window.
        </div>
      )}
    </div>
  );
}
