"use client";
import { useState } from "react";
import Modal from "./Modal";
import { createCallForClient } from "@/app/(dashboard)/calls/actions";

function defaultDateTimeLocal(): string {
  // Default to tomorrow at 09:00 in the user's local timezone, formatted as
  // "YYYY-MM-DDTHH:mm" which is what <input type="datetime-local"> expects.
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(9, 0, 0, 0);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function PlanCallButton({ clientId }: { clientId: string }) {
  const [open, setOpen] = useState(false);
  const [scheduledAt, setScheduledAt] = useState<string>(defaultDateTimeLocal);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="btn-ghost">
        Plan call
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Plan a call">
        <form action={createCallForClient} className="space-y-4 text-sm">
          <input type="hidden" name="clientId" value={clientId} />
          <label className="flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-wider text-muted">
              When
            </span>
            <input
              type="datetime-local"
              name="scheduledAt"
              required
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="bg-surface border border-border-subtle rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/40"
            />
            <span className="text-[11px] text-muted">
              Pick the date and time the call is scheduled for. You'll land on
              the call page where you can add notes when the call happens.
            </span>
          </label>
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="btn-ghost text-xs"
            >
              Cancel
            </button>
            <button type="submit" className="btn text-xs">
              Plan call
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
