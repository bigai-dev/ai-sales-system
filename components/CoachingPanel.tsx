import { Check } from "lucide-react";
import type { CoachingPanelData } from "@/lib/queries/coaching";
import { buildCoachingMarkdown } from "@/lib/exporters/coaching";
import RegradeButton from "./RegradeButton";
import CopyMarkdownButton from "./CopyMarkdownButton";
import { Panel, SectionLabel, StatusChip } from "@/components/ui";
import type { Tone } from "@/lib/constants/labels";
import { BTN } from "@/lib/constants/copy";

/** AI coaching built from the most recent reviewed calls. */
export default function CoachingPanel({ data }: { data: CoachingPanelData }) {
  const { scores, opportunities, wins, sourcedFrom } = data;
  const markdown = buildCoachingMarkdown(data);
  return (
    <Panel
      title="Coaching from your calls"
      aside={
        <div className="flex gap-2">
          <CopyMarkdownButton markdown={markdown} label={BTN.copy} copiedLabel="Copied" />
          <RegradeButton />
        </div>
      }
    >
      <p className="-mt-2 mb-4 text-xs text-muted">
        {sourcedFrom === "db"
          ? "Scored by the AI from your most recent reviewed calls."
          : "Starting targets. Review a few calls, then press Refresh to coach from real ones."}
      </p>
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 md:col-span-4">
          <SectionLabel className="mb-2">Scores</SectionLabel>
          <div className="space-y-3">
            {scores.map((s) => (
              <div key={s.label}>
                <div className="mb-1 flex justify-between text-xs">
                  <span>{s.label}</span>
                  <span className="font-semibold tabular-nums">{s.score}</span>
                </div>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: `${s.score}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="col-span-12 md:col-span-5">
          <SectionLabel className="mb-2">Work on next</SectionLabel>
          <div className="space-y-3">
            {opportunities.map((o) => (
              <div key={o.title} className="rounded-lg border border-border-subtle p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="text-sm font-medium">{o.title}</div>
                  <StatusChip tone={o.impact.tone as Tone} className="shrink-0">
                    {o.impact.text}
                  </StatusChip>
                </div>
                <div className="mt-1 text-xs text-muted">{o.detail}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="col-span-12 md:col-span-3">
          <SectionLabel className="mb-2">What&apos;s working</SectionLabel>
          <ul className="space-y-2 text-sm">
            {wins.map(([prefix, num, suffix], i) => (
              <li key={i} className="flex gap-2">
                <Check size={14} className="mt-0.5 shrink-0 text-success" aria-hidden />
                <div>
                  {prefix} {num && <b>{num}</b>} {suffix}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Panel>
  );
}
