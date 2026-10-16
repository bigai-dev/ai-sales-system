"use client";
import { useState, useTransition } from "react";
import Modal from "./Modal";
import { deleteProposal } from "@/lib/ai/proposal";
import { safeFilename } from "@/lib/format/filename";
import { Button, ErrorText } from "@/components/ui";
import { BTN } from "@/lib/constants/copy";

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
      if (r.ok) close();
      else {
        setError(r.error);
        setConfirming(false);
      }
    });
  }

  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>
        View
      </Button>
      <Modal open={open} onClose={close} title={`Proposal · ${clientName}`} size="lg">
        <div className="space-y-4">
          <div className="-mt-2 text-xs text-muted">Written {dateStr}</div>
          <iframe
            src={pdfUrl}
            className="h-[70vh] w-full rounded-md border border-border bg-white"
            title={`Proposal for ${clientName}`}
          />
          <ErrorText>{error}</ErrorText>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              {confirming ? (
                <Button variant="danger" onClick={onDelete}>
                  Yes, delete it
                </Button>
              ) : (
                <Button variant="textDanger" onClick={() => setConfirming(true)}>
                  {BTN.delete}
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={confirming ? () => setConfirming(false) : close}>
                {confirming ? BTN.cancel : BTN.close}
              </Button>
              <a href={pdfUrl} download={safeFilename(clientName)} className="btn">
                {BTN.downloadPdf}
              </a>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}
