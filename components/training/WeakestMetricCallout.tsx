import Link from "next/link";
import type { MetricSeries } from "@/lib/queries/training-metrics";
import { TOPIC_LABEL, type Topic } from "@/lib/constants/labels";
import { routes } from "@/lib/constants/routes";
import { Panel, SectionLabel } from "@/components/ui";

/**
 * Which role-play topic helps most with each trend. Where no single topic
 * fits, the link goes to the topic picker.
 */
function suggestionFor(key: string, weakestTopic: Topic | null): { href: string; label: string; reason: string } {
  switch (key) {
    case "discoveryCoverage":
      return {
        href: routes.rolePlay("content"),
        label: TOPIC_LABEL.content,
        reason: "Practise asking about headcount, AI experience and budget early.",
      };
    case "objectionPreparedness":
      return weakestTopic
        ? {
            href: routes.rolePlay(weakestTopic),
            label: TOPIC_LABEL[weakestTopic],
            reason: "Your lowest-scoring objection topic.",
          }
        : {
            href: routes.rolePlay(),
            label: "Pick a topic",
            reason: "Practise the objections you hear most.",
          };
    default:
      return {
        href: routes.rolePlay(),
        label: "Pick a topic",
        reason: "Practise asking for a clear next step before the call ends.",
      };
  }
}

export default function WeakestMetricCallout({
  weakest,
  hasData,
  weakestTopic = null,
}: {
  weakest: MetricSeries | null;
  hasData: boolean;
  weakestTopic?: Topic | null;
}) {
  if (!hasData) {
    return (
      <Panel className="border-l-4" style={{ borderLeftColor: "var(--accent)" }}>
        <div className="text-sm font-medium">No reviewed calls in the last 30 days yet.</div>
        <p className="mt-1 text-sm text-muted">
          Make a call plan, take the call, then review it. Your trends build from those reviews.
        </p>
      </Panel>
    );
  }
  if (!weakest || weakest.current === null) return null;

  const s = suggestionFor(weakest.key, weakestTopic);
  return (
    <Panel className="border-l-4" style={{ borderLeftColor: "var(--warning)" }}>
      <SectionLabel>Weakest right now</SectionLabel>
      <div className="mt-1 text-lg font-semibold">
        {weakest.label} — {weakest.current}%
      </div>
      <p className="mt-1 text-sm text-muted">{weakest.shortHelp}</p>
      <p className="mt-3 text-sm">
        <span className="text-muted">Suggested role play: </span>
        <Link href={s.href} className="underline underline-offset-2">
          {s.label}
        </Link>
        <span className="text-muted"> — {s.reason}</span>
      </p>
    </Panel>
  );
}
