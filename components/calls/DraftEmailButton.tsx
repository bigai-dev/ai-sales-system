"use client";
import { useState, useTransition } from "react";
import Modal from "../Modal";
import CopyMarkdownButton from "../CopyMarkdownButton";
import { generateFollowupEmail } from "@/lib/ai/draft-email";
import type { EmailDraft } from "@/lib/schemas/email-draft";
import { Button, ErrorText, Field, Input, Textarea } from "@/components/ui";
import { BTN } from "@/lib/constants/copy";

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
      else if (r.ok) setPhase({ kind: "error", message: "The AI returned nothing. Try again." });
      else setPhase({ kind: "error", message: r.error });
    });
  }

  function close() {
    setOpen(false);
  }

  return (
    <>
      <Button variant="ghost" onClick={run}>
        {BTN.draftEmail}
      </Button>
      <Modal open={open} onClose={close} title="Follow-up email" size="lg">
        {phase.kind === "loading" && (
          <div className="flex flex-col items-center gap-4 py-12 text-center">
            <div className="text-sm">Drafting from your call review…</div>
            <div className="max-w-sm text-xs text-muted">
              The AI uses the client&apos;s own words and the next step you agreed. About 10
              seconds.
            </div>
            <div className="bar-track w-32">
              <div className="bar-fill" style={{ transform: "scaleX(0.7)" }} />
            </div>
          </div>
        )}

        {phase.kind === "error" && (
          <div className="space-y-4 py-6">
            <ErrorText>{phase.message}</ErrorText>
            <p className="text-xs text-muted">
              The call needs a review before an email can be drafted. If it has one, just try
              again.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={close}>
                {BTN.close}
              </Button>
              <Button onClick={run}>{BTN.tryAgain}</Button>
            </div>
          </div>
        )}

        {phase.kind === "ready" && (
          <div className="space-y-4">
            <Field label="Subject">
              <div className="flex gap-2">
                <Input readOnly value={phase.draft.subject} onFocus={(e) => e.currentTarget.select()} />
                <CopyMarkdownButton
                  markdown={phase.draft.subject}
                  label="Copy"
                  copiedLabel="Copied"
                  variant="ghost"
                />
              </div>
            </Field>

            <Field label="Email">
              <Textarea
                readOnly
                value={phase.draft.body}
                onFocus={(e) => e.currentTarget.select()}
                rows={16}
                className="resize-y font-mono leading-relaxed"
              />
            </Field>

            {phase.draft.attachmentNote && (
              <p className="text-xs leading-snug text-muted">
                <span className="font-medium text-foreground">Attach:</span>{" "}
                {phase.draft.attachmentNote}
              </p>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2">
              <Button variant="text" onClick={run}>
                Draft again
              </Button>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={close}>
                  {BTN.close}
                </Button>
                <CopyMarkdownButton
                  markdown={`Subject: ${phase.draft.subject}\n\n${phase.draft.body}`}
                  label="Copy email"
                  copiedLabel="Copied"
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
