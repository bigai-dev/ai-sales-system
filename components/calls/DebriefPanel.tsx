import { OUTCOME_LABEL, OUTCOME_TONE, stageLabel } from "@/lib/constants/labels";
import type { CallDebrief } from "@/lib/schemas/call-debrief";
import { OBJECTION_LABEL } from "@/lib/schemas/call-briefing";
import DraftEmailButton from "./DraftEmailButton";
import { Panel, SectionLabel, StatusChip } from "@/components/ui";

/** The AI's write-up after a call, built from the notes. */
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
      <Panel data-tour="debrief-panel">
        <SectionLabel>Call review</SectionLabel>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Once you&apos;ve typed enough notes above, press <strong>Review call</strong>. The
          AI pulls out the outcome, objections raised, commitments, the next step and one
          coaching note.
        </p>
      </Panel>
    );
  }

  return (
    <Panel data-tour="debrief-panel" className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <SectionLabel>Call review</SectionLabel>
          <div className="mt-2 flex items-center gap-2">
            <StatusChip tone={OUTCOME_TONE[debrief.outcome]}>
              {OUTCOME_LABEL[debrief.outcome]}
            </StatusChip>
            <span className="text-xs text-muted">
              Reviewed {analyzedAt ? new Date(analyzedAt).toLocaleString("en-MY") : "—"}
            </span>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-foreground">{debrief.summary}</p>
        </div>
        <div className="shrink-0">
          <DraftEmailButton callId={callId} />
        </div>
      </div>

      {debrief.objectionsRaised.length > 0 && (
        <div>
          <SectionLabel className="mb-2">Objections raised</SectionLabel>
          <div className="space-y-2">
            {debrief.objectionsRaised.map((o, i) => (
              <div
                key={i}
                className="flex items-start gap-2 rounded-lg border border-border-subtle bg-surface-elevated/40 p-3"
              >
                <StatusChip tone="warn" className="shrink-0">
                  {OBJECTION_LABEL[o.category]}
                </StatusChip>
                <span className="text-sm text-foreground">{o.verbatim}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {debrief.commitments.length > 0 && (
        <div>
          <SectionLabel className="mb-2">Commitments</SectionLabel>
          <div className="space-y-2">
            {debrief.commitments.map((c, i) => (
              <div
                key={i}
                className="flex items-start gap-2 rounded-lg border border-border-subtle bg-surface-elevated/40 p-3"
              >
                <StatusChip tone={c.who === "rep" ? "info" : "good"} className="shrink-0">
                  {c.who === "rep" ? "You" : "Client"}
                </StatusChip>
                <span className="text-sm text-foreground">{c.what}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-border-subtle bg-accent-quiet/40 p-4">
          <SectionLabel>Next step</SectionLabel>
          <p className="mt-1 text-sm leading-relaxed text-foreground">{debrief.nextStep}</p>
        </div>
        <div className="rounded-lg border border-border-subtle bg-surface-elevated/40 p-4">
          <SectionLabel>Suggested stage</SectionLabel>
          <div className="mt-1 text-sm font-semibold text-accent">
            {stageLabel(debrief.suggestedStage)}
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border-subtle bg-surface-elevated/40 p-4">
        <SectionLabel>Coaching note</SectionLabel>
        <p className="mt-1 text-sm leading-relaxed text-foreground">{debrief.coachingNote}</p>
      </div>
    </Panel>
  );
}
