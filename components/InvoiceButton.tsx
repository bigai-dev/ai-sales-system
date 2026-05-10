"use client";
import { useState } from "react";
import Modal from "./Modal";

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
  const titleSuffix = invoiceNumber ? invoiceNumber : "— pending";

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-ghost">
        Tax invoice
      </button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={`Tax invoice · ${titleSuffix}`}
        size="lg"
      >
        <div className="space-y-4">
          <iframe
            src={pdfUrl}
            className="w-full h-[70vh] rounded-md border border-border bg-white"
            title={`Tax invoice ${titleSuffix}`}
          />
          <div className="flex flex-wrap items-center justify-end gap-2">
            <button onClick={() => setOpen(false)} className="btn-ghost">
              Close
            </button>
            <a href={pdfUrl} download={downloadName} className="btn">
              Download PDF
            </a>
          </div>
        </div>
      </Modal>
    </>
  );
}
