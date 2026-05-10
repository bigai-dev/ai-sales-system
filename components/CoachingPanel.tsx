import type { CoachingPanelData } from "@/lib/queries/coaching";
import { buildCoachingMarkdown } from "@/lib/exporters/coaching";
import RegradeButton from "./RegradeButton";
import CopyMarkdownButton from "./CopyMarkdownButton";

export default function CoachingPanel({ data }: { data: CoachingPanelData }) {
  const { scores, opportunities, wins, sourcedFrom } = data;
  const markdown = buildCoachingMarkdown(data);
  return (
    <div className="panel p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="font-semibold">Closing call analysis &amp; coaching</div>
          <div className="text-xs text-muted">
            {sourcedFrom === "db"
              ? "AI-graded from your most recent closing calls"
              : "Baseline targets — re-grade to refresh from real call data"}
          </div>
        </div>
        <div className="flex gap-2">
          <CopyMarkdownButton markdown={markdown} label="Export markdown" copiedLabel="✓ Copied to clipboard" />
          <RegradeButton />
        </div>
      </div>
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 md:col-span-4 space-y-3">
          <div className="text-xs uppercase tracking-wider text-muted mb-1">
            Score breakdown
          </div>
          <div className="space-y-3">
            {scores.map((s) => (
              <div key={s.label}>
                <div className="flex justify-between text-xs mb-1">
                  <span>{s.label}</span>
                  <span className="font-semibold">{s.score}</span>
                </div>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: `${s.score}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="col-span-12 md:col-span-5">
          <div className="text-xs uppercase tracking-wider text-muted mb-2">
            Top improvement opportunities
          </div>
          <div className="space-y-3">
            {opportunities.map((o) => (
              <div
                key={o.title}
                className="rounded-xl border border-border-subtle bg-surface p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="font-medium text-sm">{o.title}</div>
                  <span className={`chip chip-${o.impact.tone}`}>{o.impact.text}</span>
                </div>
                <div className="text-xs text-muted mt-1">{o.detail}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="col-span-12 md:col-span-3">
          <div className="text-xs uppercase tracking-wider text-muted mb-2">
            What&apos;s working
          </div>
          <div className="space-y-2 text-sm">
            {wins.map(([prefix, num, suffix], i) => (
              <div key={i} className="flex gap-2">
                <span className="text-success">✓</span>
                <div>
                  {prefix} {num && <b>{num}</b>} {suffix}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
