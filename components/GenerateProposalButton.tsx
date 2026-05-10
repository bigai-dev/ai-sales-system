"use client";
import { useEffect, useRef, useState } from "react";
import Modal from "./Modal";
import CopyMarkdownButton from "./CopyMarkdownButton";
import type { ProposalDoc } from "@/lib/exporters/proposal";
import type { Result } from "@/lib/types";

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

export default function GenerateProposalButton({ clientId }: { clientId: string }) {
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const abortRef = useRef<AbortController | null>(null);

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
      setPhase({ kind: "error", message: "Empty response" });
      return;
    }

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
      <button onClick={run} className="btn">
        Generate proposal
      </button>
      <Modal open={open} onClose={close} title="Workshop proposal" size="lg">
        {phase.kind === "loading" && (
          <div className="py-12 flex flex-col items-center gap-4 text-center">
            <div className="text-sm">
              {phase.stage === "drafting"
                ? "Drafting proposal from the audit…"
                : "Rendering PDF…"}
            </div>
            <div className="text-xs text-muted max-w-sm">
              {phase.stage === "drafting"
                ? "DeepSeek is mapping audit gaps to Day-1 / Day-2 modules. ~10–25s."
                : "Laying out A4 page with pricing table. Almost done."}
            </div>
            <div className="w-32 bar-track">
              <div
                className="bar-fill"
                style={{
                  transform: `scaleX(${phase.stage === "drafting" ? 0.55 : 0.92})`,
                }}
              />
            </div>
            <button onClick={cancel} className="btn-ghost mt-2">
              Cancel
            </button>
          </div>
        )}

        {phase.kind === "error" && (
          <div className="py-6 space-y-4">
            <div className="chip chip-bad">{phase.message.slice(0, 200)}</div>
            <div className="text-xs text-muted">
              Tip: a readiness audit is required before a proposal can be drafted.
              If the audit exists, retry — DeepSeek can occasionally rate-limit.
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
            <iframe
              src={phase.pdfUrl}
              className="w-full h-[70vh] rounded-md border border-border bg-white"
              title="Workshop proposal preview"
            />
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex gap-1">
                <button onClick={run} className="btn-text">
                  Regenerate
                </button>
                <CopyMarkdownButton
                  markdown={phase.markdown}
                  label="Copy markdown"
                  copiedLabel="✓ Copied"
                  variant="text"
                />
              </div>
              <div className="flex gap-2">
                <button onClick={close} className="btn-ghost">
                  Close
                </button>
                <a
                  href={phase.pdfUrl}
                  download={suggestedFilename(phase.doc.client)}
                  className="btn"
                >
                  Download PDF
                </a>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
