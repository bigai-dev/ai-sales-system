import {
  OBJECTION_LABEL,
  STAGE_FULL,
  type CallBriefing,
} from "@/lib/schemas/call-briefing";
import GenerateBriefingButton from "./GenerateBriefingButton";

export default function BriefingPanel({
  callId,
  briefing,
}: {
  callId: string;
  briefing: CallBriefing | null;
}) {
  if (!briefing) {
    return (
      <div className="panel p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="max-w-xl">
          <div className="text-[11px] uppercase tracking-wider text-muted">
            Pre-call briefing
          </div>
          <div className="font-semibold mt-1">No briefing yet</div>
          <div className="text-sm text-muted mt-2 leading-relaxed">
            DeepSeek will read this client&apos;s metadata, latest readiness audit, and
            prior call debriefs to draft 2-4 discovery questions, likely
            objections, and the next-stage move you&apos;re after. ~5-15 seconds.
          </div>
        </div>
        <GenerateBriefingButton callId={callId} hasBriefing={false} />
      </div>
    );
  }

  return (
    <div className="panel p-5 space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[11px] uppercase tracking-wider text-muted">
            Pre-call briefing
          </div>
          <div className="text-sm text-foreground mt-2 leading-relaxed">
            {briefing.context}
          </div>
        </div>
        <GenerateBriefingButton callId={callId} hasBriefing />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <div className="text-[11px] uppercase tracking-wider text-muted mb-2">
            Discovery questions
          </div>
          <div className="space-y-2">
            {briefing.discoveryQuestions.map((q, i) => (
              <div
                key={i}
                className="rounded-lg border border-border-subtle bg-surface-elevated/40 p-3"
              >
                <div className="text-sm font-medium text-foreground">
                  {i + 1}. {q.question}
                </div>
                <div className="text-[12px] text-muted mt-1 leading-snug">
                  Why: {q.why}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="text-[11px] uppercase tracking-wider text-muted mb-2">
            Likely objections
          </div>
          <div className="space-y-2">
            {briefing.expectedObjections.map((o, i) => (
              <div
                key={i}
                className="rounded-lg border border-border-subtle bg-surface-elevated/40 p-3"
              >
                <div className="flex items-center gap-2">
                  <span className="chip chip-warn">{OBJECTION_LABEL[o.category]}</span>
                  <span className="text-sm font-medium text-foreground">
                    {o.objection}
                  </span>
                </div>
                <div className="text-[12px] text-muted mt-2 leading-snug">
                  → {o.response}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border-subtle bg-accent-quiet/40 p-4">
        <div className="text-[11px] uppercase tracking-wider text-muted">
          Next-stage move you&apos;re after
        </div>
        <div className="mt-1 flex flex-wrap items-baseline gap-2">
          <span className="text-sm font-semibold text-accent">
            Land them in {briefing.nextStageMove.target} — {STAGE_FULL[briefing.nextStageMove.target]}
          </span>
        </div>
        <div className="text-sm text-foreground mt-2 leading-relaxed">
          {briefing.nextStageMove.what}
        </div>
      </div>

      {briefing.watchouts.length > 0 && (
        <div>
          <div className="text-[11px] uppercase tracking-wider text-muted mb-2">
            Watch-outs
          </div>
          <ul className="space-y-1">
            {briefing.watchouts.map((w, i) => (
              <li key={i} className="text-sm text-foreground">
                · {w}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
