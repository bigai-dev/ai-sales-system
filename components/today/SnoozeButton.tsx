"use client";

import { useState, useTransition } from "react";
import { Clock } from "lucide-react";
import { snoozeTask } from "@/app/(dashboard)/today/actions";

const PRESETS: { value: string; label: string }[] = [
  { value: "4h", label: "4 hours" },
  { value: "1d", label: "Tomorrow" },
  { value: "3d", label: "3 days" },
  { value: "1w", label: "Next week" },
];

export default function SnoozeButton({ taskId }: { taskId: string }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function pick(preset: string) {
    const fd = new FormData();
    fd.set("taskId", taskId);
    fd.set("preset", preset);
    startTransition(async () => {
      await snoozeTask(fd);
      setOpen(false);
    });
  }

  return (
    <div className="relative" onClick={(e) => e.preventDefault()}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="btn-ghost btn-sm"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Clock size={13} aria-hidden />
        Snooze
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden />
          <div
            role="menu"
            className="absolute right-0 top-full z-50 mt-1 w-44 rounded-lg border border-border bg-surface-elevated p-1 shadow-xl"
          >
            <div className="px-2 py-1.5 text-xs text-muted">Snooze until…</div>
            {PRESETS.map((p) => (
              <button
                key={p.value}
                role="menuitem"
                onClick={() => pick(p.value)}
                disabled={pending}
                className="w-full rounded px-2 py-1.5 text-left text-sm text-foreground transition-colors hover:bg-surface disabled:opacity-50"
              >
                {p.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
