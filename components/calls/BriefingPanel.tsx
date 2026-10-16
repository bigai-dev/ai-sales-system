import { OBJECTION_LABEL, type CallBriefing } from "@/lib/schemas/call-briefing";
import { stageLabel } from "@/lib/constants/labels";
import GenerateBriefingButton from "./GenerateBriefingButton";
import DryRunButton from "../DryRunButton";
import type { CallDryRun } from "@/lib/schemas/dry-run";
import { Panel, SectionLabel, StatusChip } from "@/components/ui";

/** The AI's plan for a call: context, questions to ask, objections to expect, the goal. */
export default function BriefingPanel({
  callId,
  briefing,
  dryRun,
}: {
  callId: string;
  briefing: CallBriefing | null;
  dryRun: CallDryRun | null;
}) {
  if (!briefing) {
    return (
      <Panel className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="max-w-xl">
          <SectionLabel>Call plan</SectionLabel>
          <p className="mt-1 text-sm leading-relaxed text-muted">
            The AI reads this client&apos;s profile, latest readiness check and past call
            reviews, then writes 2–4 questions to ask, the objections to expect and the
            goal for this call. About 10 seconds.
          </p>
        </div>
        <GenerateBriefingButton callId={callId} hasBriefing={false} />
      </Panel>
    );
  }

  return (
    <Panel className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <SectionLabel>Call plan</SectionLabel>
          <p className="mt-2 text-sm leading-relaxed text-foreground">{briefing.context}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <DryRunButton callId={callId} initialDryRun={dryRun} hasBriefing />
          <GenerateBriefingButton callId={callId} hasBriefing />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <SectionLabel className="mb-2">Questions to ask</SectionLabel>
          <div className="space-y-2">
            {briefing.discoveryQuestions.map((q, i) => (
              <div key={i} className="rounded-lg border border-border-subtle bg-surface-elevated/40 p-3">
                <div className="text-sm font-medium text-foreground">
                  {i + 1}. {q.question}
                </div>
                <div className="mt-1 text-xs leading-snug text-muted">Why: {q.why}</div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <SectionLabel className="mb-2">Objections to expect</SectionLabel>
          <div className="space-y-2">
            {briefing.expectedObjections.map((o, i) => (
              <div key={i} className="rounded-lg border border-border-subtle bg-surface-elevated/40 p-3">
                <div className="flex items-center gap-2">
                  <StatusChip tone="warn">{OBJECTION_LABEL[o.category]}</StatusChip>
                  <span className="text-sm font-medium text-foreground">{o.objection}</span>
                </div>
                <div className="mt-2 text-xs leading-snug text-muted">
                  Your answer: {o.response}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border-subtle bg-accent-quiet/40 p-4">
        <SectionLabel>Goal for this call</SectionLabel>
        <div className="mt-1 text-sm font-semibold text-accent">
          Move them to {stageLabel(briefing.nextStageMove.target)}
        </div>
        <p className="mt-2 text-sm leading-relaxed text-foreground">{briefing.nextStageMove.what}</p>
      </div>

      {briefing.watchouts.length > 0 && (
        <div>
          <SectionLabel className="mb-2">Watch out for</SectionLabel>
          <ul className="list-disc space-y-1 pl-5">
            {briefing.watchouts.map((w, i) => (
              <li key={i} className="text-sm text-foreground">
                {w}
              </li>
            ))}
          </ul>
        </div>
      )}
    </Panel>
  );
}
