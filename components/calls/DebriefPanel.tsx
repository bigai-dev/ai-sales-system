import {
  OUTCOME_LABEL,
  OUTCOME_TONE,
  type CallDebrief,
} from "@/lib/schemas/call-debrief";
import { OBJECTION_LABEL, STAGE_FULL } from "@/lib/schemas/call-briefing";
import DraftEmailButton from "./DraftEmailButton";

const TONE_CHIP: Record<"good" | "warn" | "bad" | "info", string> = {
  good: "chip-good",
  warn: "chip-warn",
  bad: "chip-bad",
  info: "chip-info",
};

export default function DebriefPanel({
  callId,
  debrief,
  analyzedAt,
}: {
  callId: string;
  debrief: CallDebrief | null;
  analyzedAt: number | null;
}) {
  if (!debrief) {
    return (
      <div data-tour="debrief-panel" className="panel p-6">
        <div className="text-[11px] uppercase tracking-wider text-muted">
          Debrief
        </div>
        <div className="text-sm text-muted mt-2 leading-relaxed">
          Once you&apos;ve typed enough notes above, click <strong>Analyze debrief</strong>.
          DeepSeek will extract outcome, objections raised, commitments,
          next-step, and a coaching observation.
        </div>
      </div>
    );
  }

  const tone = TONE_CHIP[OUTCOME_TONE[debrief.outcome]];

  return (
    <div data-tour="debrief-panel" className="panel p-5 space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[11px] uppercase tracking-wider text-muted">
            Debrief
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span className={`chip ${tone}`}>{OUTCOME_LABEL[debrief.outcome]}</span>
            <span className="text-[11px] text-muted">
              Analyzed {analyzedAt ? new Date(analyzedAt).toLocaleString("en-MY") : "—"}
            </span>
          </div>
          <div className="text-sm text-foreground mt-3 leading-relaxed">
            {debrief.summary}
          </div>
        </div>
        <div className="shrink-0">
          <DraftEmailButton callId={callId} />
        </div>
      </div>

      {debrief.objectionsRaised.length > 0 && (
        <div>
          <div className="text-[11px] uppercase tracking-wider text-muted mb-2">
            Objections raised
          </div>
          <div className="space-y-2">
            {debrief.objectionsRaised.map((o, i) => (
              <div
                key={i}
                className="flex items-start gap-2 rounded-lg border border-border-subtle bg-surface-elevated/40 p-3"
              >
                <span className="chip chip-warn shrink-0">{OBJECTION_LABEL[o.category]}</span>
                <span className="text-sm text-foreground">{o.verbatim}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {debrief.commitments.length > 0 && (
        <div>
          <div className="text-[11px] uppercase tracking-wider text-muted mb-2">
            Commitments
          </div>
          <div className="space-y-2">
            {debrief.commitments.map((c, i) => (
              <div
                key={i}
                className="flex items-start gap-2 rounded-lg border border-border-subtle bg-surface-elevated/40 p-3"
              >
                <span
                  className={`chip ${c.who === "rep" ? "chip-info" : "chip-good"} shrink-0`}
                >
                  {c.who === "rep" ? "You" : "Client"}
                </span>
                <span className="text-sm text-foreground">{c.what}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-lg border border-border-subtle bg-accent-quiet/40 p-4">
          <div className="text-[11px] uppercase tracking-wider text-muted">
            Next step
          </div>
          <div className="text-sm text-foreground mt-1 leading-relaxed">
            {debrief.nextStep}
          </div>
        </div>
        <div className="rounded-lg border border-border-subtle bg-surface-elevated/40 p-4">
          <div className="text-[11px] uppercase tracking-wider text-muted">
            Suggested SPANCO move
          </div>
          <div className="text-sm font-semibold text-accent mt-1">
            → {debrief.suggestedStage} · {STAGE_FULL[debrief.suggestedStage]}
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border-subtle bg-surface-elevated/40 p-4">
        <div className="text-[11px] uppercase tracking-wider text-muted">
          Coaching note
        </div>
        <div className="text-sm text-foreground mt-1 leading-relaxed">
          {debrief.coachingNote}
        </div>
      </div>
    </div>
  );
}
