"use client";

import { useState, useTransition } from "react";
import Modal from "./Modal";
import { gradeDryRun, startDryRun } from "@/lib/ai/dry-run";
import { DRILL_BUCKET_LABEL } from "@/lib/schemas/drill";
import type { CallDryRun, DryRunMoment } from "@/lib/schemas/dry-run";

type Props = {
  callId: string;
  initialDryRun: CallDryRun | null;
  hasBriefing: boolean;
};

type LocalMoment = DryRunMoment & { localResponse: string };

export default function DryRunButton({ callId, initialDryRun, hasBriefing }: Props) {
  const [open, setOpen] = useState(false);
  const [dryRun, setDryRun] = useState<CallDryRun | null>(initialDryRun);
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<"idle" | "loading" | "filling" | "grading" | "graded">(
    initialDryRun && initialDryRun.moments.every((m) => m.grade !== null) ? "graded" : "idle",
  );
  const [pending, startTransition] = useTransition();
  const [localMoments, setLocalMoments] = useState<LocalMoment[]>(
    (initialDryRun?.moments ?? []).map((m) => ({ ...m, localResponse: m.repResponse })),
  );

  function openModal() {
    setError(null);
    setOpen(true);
    if (dryRun && dryRun.moments.every((m) => m.grade !== null)) {
      setPhase("graded");
      return;
    }
    if (dryRun) {
      setPhase("filling");
      return;
    }
    setPhase("loading");
    startTransition(async () => {
      const r = await startDryRun(callId);
      if (!r.ok) {
        setError(r.error);
        setPhase("idle");
        return;
      }
      setDryRun(r.data);
      setLocalMoments(r.data.moments.map((m) => ({ ...m, localResponse: "" })));
      setPhase("filling");
    });
  }

  function regenerate() {
    setError(null);
    setPhase("loading");
    startTransition(async () => {
      const r = await startDryRun(callId);
      if (!r.ok) {
        setError(r.error);
        setPhase(dryRun ? "graded" : "idle");
        return;
      }
      setDryRun(r.data);
      setLocalMoments(r.data.moments.map((m) => ({ ...m, localResponse: "" })));
      setPhase("filling");
    });
  }

  function submit() {
    const tooShort = localMoments.find((m) => m.localResponse.trim().length < 10);
    if (tooShort) {
      setError("Write at least a sentence in each box.");
      return;
    }
    setError(null);
    setPhase("grading");
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
      setPhase("graded");
    });
  }

  function updateLocal(momentId: string, value: string) {
    setLocalMoments((prev) =>
      prev.map((m) => (m.momentId === momentId ? { ...m, localResponse: value } : m)),
    );
  }

  const buttonLabel = dryRun
    ? phase === "graded" || dryRun.moments.every((m) => m.grade !== null)
      ? "Open Dry Run"
      : "Resume Dry Run"
    : "Dry Run";

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        disabled={!hasBriefing || pending}
        title={
          hasBriefing
            ? "Practice the 3 hardest moments before dialing"
            : "Generate a briefing first"
        }
        className={`px-3 py-2 rounded-lg text-sm font-semibold border transition ${
          hasBriefing
            ? "border-accent text-accent hover:bg-accent hover:text-accent-foreground"
            : "border-border-subtle text-muted cursor-not-allowed"
        }`}
      >
        {buttonLabel}
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Pre-call Dry Run" size="lg">
        {phase === "loading" && (
          <div className="text-sm text-muted py-6 text-center">
            Generating 3 prospect-specific moments…
          </div>
        )}

        {error && <div className="text-xs delta-down mb-3">{error}</div>}

        {(phase === "filling" || phase === "grading") && dryRun && (
          <>
            <div className="text-xs text-muted mb-4">
              Type how you&apos;d actually reply. Grade all 3 at once when you&apos;re ready.
            </div>
            <div className="space-y-4">
              {localMoments.map((m, i) => (
                <div key={m.momentId} className="rounded-lg border border-border-subtle p-3">
                  <div className="flex items-baseline justify-between gap-2">
                    <div className="text-[11px] uppercase tracking-wider text-muted">
                      Moment {i + 1} · {DRILL_BUCKET_LABEL[m.bucket]}
                    </div>
                  </div>
                  <div className="mt-1 italic text-sm">&ldquo;{m.prompt}&rdquo;</div>
                  <ul className="mt-2 text-[11px] text-muted space-y-0.5 list-disc pl-4">
                    {m.rubric.map((r, j) => (
                      <li key={j}>{r}</li>
                    ))}
                  </ul>
                  <textarea
                    value={m.localResponse}
                    onChange={(e) => updateLocal(m.momentId, e.target.value)}
                    placeholder="Your reply…"
                    disabled={phase === "grading"}
                    className="mt-2 w-full min-h-[80px] rounded-md border border-border-subtle bg-surface p-2 text-sm focus:outline-none focus:border-accent"
                  />
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={regenerate}
                disabled={phase === "grading" || pending}
                className="text-xs text-muted underline underline-offset-2 hover:text-foreground"
              >
                Regenerate moments
              </button>
              <button
                type="button"
                onClick={submit}
                disabled={phase === "grading" || pending}
                className="px-4 py-2 rounded-lg bg-accent text-accent-foreground text-sm font-semibold disabled:opacity-60"
              >
                {phase === "grading" ? "Grading…" : "Grade all 3"}
              </button>
            </div>
          </>
        )}

        {phase === "graded" && dryRun && (
          <>
            <div className="rounded-lg border border-accent/40 bg-accent-quiet/30 p-4">
              <div className="text-[11px] uppercase tracking-wider text-muted">
                Take this in with you
              </div>
              <div className="mt-1 text-sm">{dryRun.takeaway}</div>
            </div>

            <div className="space-y-3 mt-4">
              {dryRun.moments.map((m, i) => (
                <div key={m.momentId} className="rounded-lg border border-border-subtle p-3">
                  <div className="flex items-baseline justify-between gap-2">
                    <div className="text-[11px] uppercase tracking-wider text-muted">
                      Moment {i + 1} · {DRILL_BUCKET_LABEL[m.bucket]}
                    </div>
                    <div className="text-lg font-semibold">{m.grade ?? "—"}</div>
                  </div>
                  <div className="mt-1 italic text-sm">&ldquo;{m.prompt}&rdquo;</div>
                  <div className="mt-2 text-sm">{m.repResponse}</div>
                  <div className="mt-1 text-[11px] text-muted italic">{m.feedback}</div>
                </div>
              ))}
            </div>

            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={regenerate}
                disabled={pending}
                className="px-3 py-2 rounded-lg border border-border-subtle text-sm hover:bg-surface-elevated"
              >
                Run again
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="px-4 py-2 rounded-lg bg-accent text-accent-foreground text-sm font-semibold"
              >
                Done
              </button>
            </div>
          </>
        )}
      </Modal>
    </>
  );
}
