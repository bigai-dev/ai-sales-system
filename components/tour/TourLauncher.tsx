"use client";
import { useTransition } from "react";
import { useTour } from "./TourProvider";

export default function TourLauncher() {
  const { active, start } = useTour();
  const [pending, startTx] = useTransition();

  if (active) return null;

  return (
    <button
      type="button"
      onClick={() => startTx(() => start())}
      disabled={pending}
      className="inline-flex items-center gap-1.5 rounded-md border border-border-subtle bg-surface px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted hover:text-foreground hover:border-accent/40 transition disabled:opacity-50"
      aria-label="Start product tour"
      title="Start guided tour"
    >
      <PlayIcon />
      {pending ? "Loading…" : "Demo mode"}
    </button>
  );
}

function PlayIcon() {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}
