"use client";
import { useState } from "react";
import Modal from "./Modal";
import { Button } from "@/components/ui";
import { BTN } from "@/lib/constants/copy";

export default function InvoiceButton({
  dealId,
  invoiceNumber,
}: {
  dealId: string;
  invoiceNumber: string | null;
}) {
  const [open, setOpen] = useState(false);
  const pdfUrl = `/api/invoice/pdf?dealId=${encodeURIComponent(dealId)}`;
  const downloadName = invoiceNumber ? `${invoiceNumber}.pdf` : "invoice.pdf";
  const titleSuffix = invoiceNumber ?? "not numbered yet";

  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>
        Tax invoice
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title={`Tax invoice · ${titleSuffix}`} size="lg">
        <div className="space-y-4">
          <iframe
            src={pdfUrl}
            className="h-[70vh] w-full rounded-md border border-border bg-white"
            title={`Tax invoice ${titleSuffix}`}
          />
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              {BTN.close}
            </Button>
            <a href={pdfUrl} download={downloadName} className="btn">
              {BTN.downloadPdf}
            </a>
          </div>
        </div>
      </Modal>
    </>
  );
}
