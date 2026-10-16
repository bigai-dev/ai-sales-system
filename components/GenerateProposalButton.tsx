"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Modal from "./Modal";
import CopyMarkdownButton from "./CopyMarkdownButton";
import type { ProposalDoc } from "@/lib/exporters/proposal";
import type { Result } from "@/lib/types";
import { Button, ErrorText } from "@/components/ui";
import { BTN } from "@/lib/constants/copy";

type GenerateResult = Result<{
  id: string;
  doc: ProposalDoc;
  markdown: string;
  pricing: { totalCents: number; cohortSize: number };
}>;

type Phase =
  | { kind: "idle" }
  | { kind: "loading"; stage: "drafting" | "rendering" }
  | {
      kind: "ready";
      markdown: string;
      pdfUrl: string;
      doc: ProposalDoc;
    }
  | { kind: "error"; message: string };

async function fetchPdfBlob(doc: ProposalDoc, signal: AbortSignal): Promise<Blob> {
  const res = await fetch("/api/proposal/pdf", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(doc),
    signal,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `PDF render failed (${res.status})`);
  }
  return res.blob();
}

function suggestedFilename(client: string): string {
  const safe = client.replace(/[^a-z0-9]+/gi, "_").replace(/^_|_$/g, "");
  return `proposal-${safe || "client"}.pdf`;
}

export default function GenerateProposalButton({
  clientId,
  disabled = false,
  disabledHint,
}: {
  clientId: string;
  /** When no readiness check exists yet the button is shown but can't run. */
  disabled?: boolean;
  disabledHint?: string;
}) {
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const abortRef = useRef<AbortController | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (phase.kind !== "ready") return;
    const url = phase.pdfUrl;
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [phase]);

  async function run() {
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    setPhase({ kind: "loading", stage: "drafting" });
    setOpen(true);

    let generation: GenerateResult;
    try {
      const res = await fetch("/api/proposal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId }),
        signal: ac.signal,
      });
      generation = (await res.json()) as GenerateResult;
    } catch (e) {
      if (ac.signal.aborted) return;
      setPhase({ kind: "error", message: (e as Error).message });
      return;
    }

    if (!generation.ok) {
      setPhase({ kind: "error", message: generation.error });
      return;
    }
    if (!generation.data) {
      setPhase({ kind: "error", message: "The AI returned nothing. Try again." });
      return;
    }

    // The proposal is now saved server-side. Refresh the route so the client
    // page's "Proposals" list re-reads from the DB and shows it immediately —
    // otherwise the saved proposal stays invisible until a manual reload.
    router.refresh();

    setPhase({ kind: "loading", stage: "rendering" });
    try {
      const blob = await fetchPdfBlob(generation.data.doc, ac.signal);
      if (ac.signal.aborted) return;
      const url = URL.createObjectURL(blob);
      setPhase({
        kind: "ready",
        markdown: generation.data.markdown,
        pdfUrl: url,
        doc: generation.data.doc,
      });
    } catch (e) {
      if (ac.signal.aborted) return;
      setPhase({ kind: "error", message: (e as Error).message });
    }
  }

  function cancel() {
    abortRef.current?.abort();
    abortRef.current = null;
    setPhase({ kind: "idle" });
    setOpen(false);
  }

  function close() {
    if (phase.kind === "loading") {
      cancel();
      return;
    }
    setOpen(false);
  }

  return (
    <>
      <Button onClick={run} disabled={disabled} title={disabled ? disabledHint : undefined}>
        {BTN.generateProposal}
      </Button>
      <Modal open={open} onClose={close} title="Workshop proposal" size="lg">
        {phase.kind === "loading" && (
          <div className="flex flex-col items-center gap-4 py-12 text-center">
            <div className="text-sm">
              {phase.stage === "drafting"
                ? "Writing the proposal from the readiness check…"
                : "Laying out the PDF…"}
            </div>
            <div className="max-w-sm text-xs text-muted">
              {phase.stage === "drafting"
                ? "The AI matches each gap it found to a Day 1 or Day 2 module. About 20 seconds."
                : "Almost done."}
            </div>
            <div className="bar-track w-32">
              <div
                className="bar-fill"
                style={{
                  transform: `scaleX(${phase.stage === "drafting" ? 0.55 : 0.92})`,
                }}
              />
            </div>
            <Button variant="ghost" onClick={cancel} className="mt-2">
              {BTN.cancel}
            </Button>
          </div>
        )}

        {phase.kind === "error" && (
          <div className="space-y-4 py-6">
            <ErrorText>{phase.message}</ErrorText>
            <p className="text-xs text-muted">
              A proposal needs a readiness check first. If one exists, just try again.
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
            <iframe
              src={phase.pdfUrl}
              className="w-full h-[70vh] rounded-md border border-border bg-white"
              title="Workshop proposal preview"
            />
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex gap-1">
                <Button variant="text" onClick={run}>
                  Write again
                </Button>
                <CopyMarkdownButton
                  markdown={phase.markdown}
                  label={BTN.copy}
                  copiedLabel="Copied"
                  variant="text"
                />
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={close}>
                  {BTN.close}
                </Button>
                <a
                  href={phase.pdfUrl}
                  download={suggestedFilename(phase.doc.client)}
                  className="btn"
                >
                  {BTN.downloadPdf}
                </a>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
