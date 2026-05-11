import Link from "next/link";
import type { MetricSeries } from "@/lib/queries/training-metrics";

// Maps weakest-metric labels to the rehearsal bucket the rep should drill.
// In v1 these all point at the drill library landing; once Phase C ships the
// /training/drills/[bucket] routes, swap this to a concrete bucket per metric.
const SUGGESTED_DRILL: Record<string, { bucket: string; reason: string }> = {
  stageProgression: {
    bucket: "next-step-clarity",
    reason: "Practice extracting concrete commitments before the call ends.",
  },
  briefingAdherence: {
    bucket: "next-step-clarity",
    reason: "Drill on landing the briefing's nextStageMove verbatim.",
  },
  discoveryCoverage: {
    bucket: "discovery",
    reason: "Drill the standard 3 discovery questions for varied prospects.",
  },
  objectionPreparedness: {
    bucket: "objections",
    reason: "Drill the four objection buckets — content, budget, venue, time.",
  },
};

export default function WeakestMetricCallout({
  weakest,
  hasData,
}: {
  weakest: MetricSeries | null;
  hasData: boolean;
}) {
  if (!hasData) {
    return (
      <div className="panel p-5 border-l-4" style={{ borderLeftColor: "var(--accent)" }}>
        <div className="font-medium">No analyzed calls in the last 30 days yet.</div>
        <div className="text-sm text-muted mt-1">
          Once you debrief calls with a briefing attached, your trends will populate here. The
          metrics derive from data your existing briefing → debrief flow already produces — no
          extra LLM grading required.
        </div>
      </div>
    );
  }
  if (!weakest || weakest.current === null) {
    return null;
  }
  const suggestion = SUGGESTED_DRILL[weakest.key];
  return (
    <div className="panel p-5 border-l-4" style={{ borderLeftColor: "var(--warn)" }}>
      <div className="text-xs uppercase tracking-wider text-muted">Weakest metric right now</div>
      <div className="mt-1 text-lg font-semibold">
        {weakest.label} — {weakest.current}%
      </div>
      <div className="text-sm text-muted mt-1">{weakest.shortHelp}</div>
      {suggestion && (
        <div className="mt-3 text-sm">
          <span className="text-muted">Suggested drill: </span>
          <Link href="/training/drills" className="underline underline-offset-2">
            {suggestion.bucket}
          </Link>
          <span className="text-muted"> — {suggestion.reason}</span>
        </div>
      )}
    </div>
  );
}
