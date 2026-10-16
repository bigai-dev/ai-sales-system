"use client";

import { useState, useTransition } from "react";
import Modal from "./Modal";
import { gradeDryRun, startDryRun } from "@/lib/ai/dry-run";
import { TOPIC_LABEL } from "@/lib/constants/labels";
import type { CallDryRun, DryRunMoment } from "@/lib/schemas/dry-run";
import { Button, ErrorText, SectionLabel, Textarea } from "@/components/ui";
import { BTN, ERR } from "@/lib/constants/copy";

type Props = {
  callId: string;
  initialDryRun: CallDryRun | null;
  hasBriefing: boolean;
};

type LocalMoment = DryRunMoment & { localResponse: string };

/**
 * Role play for one specific call: the AI writes the three hardest moments
 * it expects with this client, you type your replies, it scores them.
 */
export default function DryRunButton({ callId, initialDryRun, hasBriefing }: Props) {
  const [open, setOpen] = useState(false);
  const [dryRun, setDryRun] = useState<CallDryRun | null>(initialDryRun);
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<"idle" | "loading" | "filling" | "scoring" | "scored">(
    initialDryRun && initialDryRun.moments.every((m) => m.grade !== null) ? "scored" : "idle",
  );
  const [pending, startTransition] = useTransition();
  const [localMoments, setLocalMoments] = useState<LocalMoment[]>(
    (initialDryRun?.moments ?? []).map((m) => ({ ...m, localResponse: m.repResponse })),
  );

  function load() {
    setError(null);
    setPhase("loading");
    startTransition(async () => {
      const r = await startDryRun(callId);
      if (!r.ok) {
        setError(r.error);
        setPhase(dryRun ? "scored" : "idle");
        return;
      }
      setDryRun(r.data);
      setLocalMoments(r.data.moments.map((m) => ({ ...m, localResponse: "" })));
      setPhase("filling");
    });
  }

  function openModal() {
    setError(null);
    setOpen(true);
    if (dryRun && dryRun.moments.every((m) => m.grade !== null)) {
      setPhase("scored");
      return;
    }
    if (dryRun) {
      setPhase("filling");
      return;
    }
    load();
  }

  function submit() {
    const tooShort = localMoments.find((m) => m.localResponse.trim().length < 10);
    if (tooShort) {
      setError("Write at least a sentence in each box.");
      return;
    }
    setError(null);
    setPhase("scoring");
    startTransition(async () => {
      const r = await gradeDryRun({
        callId,
        responses: localMoments.map((m) => ({
          momentId: m.momentId,
          repResponse: m.localResponse,
        })),
      });
      if (!r.ok) {
        setError(r.error);
        setPhase("filling");
        return;
      }
      setDryRun(r.data);
      setLocalMoments(r.data.moments.map((m) => ({ ...m, localResponse: m.repResponse })));
      setPhase("scored");
    });
  }

  function updateLocal(momentId: string, value: string) {
    setLocalMoments((prev) =>
      prev.map((m) => (m.momentId === momentId ? { ...m, localResponse: value } : m)),
    );
  }

  const buttonLabel = dryRun
    ? phase === "scored" || dryRun.moments.every((m) => m.grade !== null)
      ? "See role-play results"
      : "Continue role play"
    : BTN.rolePlayThisCall;

  return (
    <>
      <Button
        variant="ghost"
        onClick={openModal}
        disabled={!hasBriefing || pending}
        title={hasBriefing ? "Practise the 3 hardest moments before you dial" : ERR.needCallPlan}
      >
        {buttonLabel}
      </Button>

      <Modal open={open} onClose={() => setOpen(false)} title="Role play for this call" size="lg">
        {phase === "loading" && (
          <div className="py-6 text-center text-sm text-muted">
            Writing the 3 toughest moments for this client…
          </div>
        )}

        <ErrorText className="mb-3">{error}</ErrorText>

        {(phase === "filling" || phase === "scoring") && dryRun && (
          <>
            <p className="mb-4 text-xs text-muted">
              Type how you would actually reply. Score all three when you&apos;re ready.
            </p>
            <div className="space-y-4">
              {localMoments.map((m, i) => (
                <div key={m.momentId} className="rounded-lg border border-border-subtle p-3">
                  <SectionLabel>
                    Moment {i + 1} · {TOPIC_LABEL[m.bucket]}
                  </SectionLabel>
                  <div className="mt-1 text-sm italic">&ldquo;{m.prompt}&rdquo;</div>
                  <ul className="mt-2 list-disc space-y-0.5 pl-4 text-xs text-muted">
                    {m.rubric.map((r, j) => (
                      <li key={j}>{r}</li>
                    ))}
                  </ul>
                  <Textarea
                    value={m.localResponse}
                    onChange={(e) => updateLocal(m.momentId, e.target.value)}
                    placeholder="Your reply…"
                    disabled={phase === "scoring"}
                    className="mt-2 min-h-[80px]"
                  />
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between">
              <Button variant="text" onClick={load} disabled={phase === "scoring" || pending}>
                New moments
              </Button>
              <Button
                onClick={submit}
                disabled={pending}
                busy={phase === "scoring"}
                busyLabel="Scoring…"
              >
                Score all 3
              </Button>
            </div>
          </>
        )}

        {phase === "scored" && dryRun && (
          <>
            <div className="rounded-lg border border-accent/40 bg-accent-quiet/30 p-4">
              <SectionLabel>Take this in with you</SectionLabel>
              <div className="mt-1 text-sm">{dryRun.takeaway}</div>
            </div>

            <div className="mt-4 space-y-3">
              {dryRun.moments.map((m, i) => (
                <div key={m.momentId} className="rounded-lg border border-border-subtle p-3">
                  <div className="flex items-baseline justify-between gap-2">
                    <SectionLabel>
                      Moment {i + 1} · {TOPIC_LABEL[m.bucket]}
                    </SectionLabel>
                    <div className="text-lg font-semibold tabular-nums">{m.grade ?? "—"}</div>
                  </div>
                  <div className="mt-1 text-sm italic">&ldquo;{m.prompt}&rdquo;</div>
                  <div className="mt-2 text-sm">{m.repResponse}</div>
                  <div className="mt-1 text-xs italic text-muted">{m.feedback}</div>
                </div>
              ))}
            </div>

            <div className="mt-4 flex items-center justify-end gap-2">
              <Button variant="ghost" onClick={load} disabled={pending}>
                Try new moments
              </Button>
              <Button onClick={() => setOpen(false)}>Done</Button>
            </div>
          </>
        )}
      </Modal>
    </>
  );
}
