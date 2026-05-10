"use client";
import { useState, useTransition } from "react";
import Modal from "../Modal";
import CopyMarkdownButton from "../CopyMarkdownButton";
import { generateFollowupEmail } from "@/lib/ai/draft-email";
import type { EmailDraft } from "@/lib/schemas/email-draft";

type Phase =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "ready"; draft: EmailDraft }
  | { kind: "error"; message: string };

export default function DraftEmailButton({ callId }: { callId: string }) {
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const [, startTransition] = useTransition();

  function run() {
    setPhase({ kind: "loading" });
    setOpen(true);
    startTransition(async () => {
      const r = await generateFollowupEmail(callId);
      if (r.ok && r.data) setPhase({ kind: "ready", draft: r.data });
      else if (r.ok) setPhase({ kind: "error", message: "Empty response" });
      else setPhase({ kind: "error", message: r.error });
    });
  }

  function close() {
    setOpen(false);
  }

  return (
    <>
      <button onClick={run} className="btn-ghost">
        Draft email
      </button>
      <Modal open={open} onClose={close} title="Follow-up email" size="lg">
        {phase.kind === "loading" && (
          <div className="py-12 flex flex-col items-center gap-4 text-center">
            <div className="text-sm">Drafting from your debrief…</div>
            <div className="text-xs text-muted max-w-sm">
              DeepSeek is referencing the prospect&apos;s exact words and the next-step
              you committed to. ~5–10s.
            </div>
            <div className="w-32 bar-track">
              <div className="bar-fill" style={{ transform: "scaleX(0.7)" }} />
            </div>
          </div>
        )}

        {phase.kind === "error" && (
          <div className="py-6 space-y-4">
            <div className="chip chip-bad">{phase.message.slice(0, 200)}</div>
            <div className="text-xs text-muted">
              Tip: a debrief is required before drafting an email. If the call has
              been debriefed, retry — DeepSeek can occasionally rate-limit.
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={close} className="btn-ghost">
                Close
              </button>
              <button onClick={run} className="btn">
                Retry
              </button>
            </div>
          </div>
        )}

        {phase.kind === "ready" && (
          <div className="space-y-4">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-muted mb-1">
                Subject
              </div>
              <div className="flex gap-2">
                <input
                  readOnly
                  value={phase.draft.subject}
                  onFocus={(e) => e.currentTarget.select()}
                  className="flex-1 bg-surface border border-border-subtle rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/40"
                />
                <CopyMarkdownButton
                  markdown={phase.draft.subject}
                  label="Copy subject"
                  copiedLabel="✓ Copied"
                  variant="ghost"
                />
              </div>
            </div>

            <div>
              <div className="text-[11px] uppercase tracking-wider text-muted mb-1">
                Body
              </div>
              <textarea
                readOnly
                value={phase.draft.body}
                onFocus={(e) => e.currentTarget.select()}
                rows={16}
                className="w-full bg-surface border border-border-subtle rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/40 leading-relaxed font-mono resize-y"
              />
            </div>

            {phase.draft.attachmentNote && (
              <div className="text-[11px] text-muted leading-snug">
                <span className="text-foreground font-medium">Suggested attachment:</span>{" "}
                {phase.draft.attachmentNote}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex gap-1">
                <button onClick={run} className="btn-text">
                  Regenerate
                </button>
              </div>
              <div className="flex gap-2">
                <button onClick={close} className="btn-ghost">
                  Close
                </button>
                <CopyMarkdownButton
                  markdown={`Subject: ${phase.draft.subject}\n\n${phase.draft.body}`}
                  label="Copy email"
                  copiedLabel="✓ Copied to clipboard"
                  variant="primary"
                />
              </div>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
