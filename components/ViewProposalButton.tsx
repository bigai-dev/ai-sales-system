"use client";
import { useState, useTransition } from "react";
import Modal from "./Modal";
import { deleteProposal } from "@/lib/ai/proposal";

function safeFilename(client: string): string {
  const safe = client.replace(/[^a-z0-9]+/gi, "_").replace(/^_|_$/g, "");
  return `proposal-${safe || "client"}.pdf`;
}

export default function ViewProposalButton({
  id,
  clientName,
  generatedAt,
}: {
  id: string;
  clientName: string;
  generatedAt: number;
}) {
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const pdfUrl = `/api/proposal/pdf?id=${encodeURIComponent(id)}`;
  const dateStr = new Date(generatedAt).toLocaleString("en-MY", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  function close() {
    setOpen(false);
    setConfirming(false);
    setError(null);
  }

  function onDelete() {
    setError(null);
    startTransition(async () => {
      const r = await deleteProposal(id);
      if (r.ok) {
        close();
      } else {
        setError(r.error);
        setConfirming(false);
      }
    });
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-ghost">
        View
      </button>
      <Modal
        open={open}
        onClose={close}
        title={`Proposal · ${clientName}`}
        size="lg"
      >
        <div className="space-y-4">
          <div className="text-[11px] uppercase tracking-wider text-muted -mt-2">
            Generated {dateStr}
          </div>
          <iframe
            src={pdfUrl}
            className="w-full h-[70vh] rounded-md border border-border bg-white"
            title={`Proposal for ${clientName}`}
          />
          {error && (
            <div className="chip chip-bad">{error.slice(0, 200)}</div>
          )}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              {confirming ? (
                <button onClick={onDelete} className="btn-danger">
                  Confirm delete
                </button>
              ) : (
                <button
                  onClick={() => setConfirming(true)}
                  className="btn-text-danger"
                >
                  Delete
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={confirming ? () => setConfirming(false) : close}
                className="btn-ghost"
              >
                {confirming ? "Cancel" : "Close"}
              </button>
              <a
                href={pdfUrl}
                download={safeFilename(clientName)}
                className="btn"
              >
                Download PDF
              </a>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}
