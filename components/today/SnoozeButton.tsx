"use client";

import { useState, useTransition } from "react";
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
        onClick={() => setOpen((o) => !o)}
        className={`inline-flex items-center gap-1 text-[11px] uppercase tracking-wider px-2 py-1 rounded-md border transition shrink-0 ${
          open
            ? "border-border bg-surface-elevated text-foreground"
            : "border-border-subtle bg-surface text-muted hover:text-foreground hover:border-border"
        }`}
        aria-label="Snooze"
        title="Snooze this task"
      >
        <ClockIcon />
        Snooze
      </button>
      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="absolute right-0 top-full mt-1 z-50 w-44 rounded-lg border border-border bg-surface-elevated shadow-xl p-1">
            <div className="text-[10px] uppercase tracking-wider text-muted px-2 py-1.5">
              Snooze until…
            </div>
            {PRESETS.map((p) => (
              <button
                key={p.value}
                onClick={() => pick(p.value)}
                disabled={pending}
                className="w-full text-left text-sm px-2 py-1.5 rounded hover:bg-surface text-foreground disabled:opacity-50 transition-colors"
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

function ClockIcon() {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="12" cy="12" r="9" />
      <polyline points="12 7 12 12 15.5 14" />
    </svg>
  );
}
