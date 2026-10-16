"use client";
import { useEffect, useRef, useState, useTransition } from "react";
import { ChevronDown, Play, Presentation } from "lucide-react";
import { useTour } from "./tour/TourProvider";
import { useMovie } from "./movie/MovieProvider";

/**
 * One small "Demo" button that opens the two demo tools:
 * the guided tour and the full-screen presentation.
 */
export default function DemoMenu() {
  const tour = useTour();
  const movie = useMovie();
  const [open, setOpen] = useState(false);
  const [pending, startTx] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (tour.active || movie.active) return null;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="btn-ghost btn-sm"
      >
        Demo
        <ChevronDown size={14} aria-hidden />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute bottom-full left-0 mb-2 w-56 rounded-lg border border-border bg-surface p-1 shadow-xl"
        >
          <MenuItem
            icon={<Play size={14} aria-hidden />}
            label="Guided tour"
            hint="Walk through the sales loop"
            disabled={pending}
            onClick={() => {
              setOpen(false);
              startTx(() => tour.start());
            }}
          />
          <MenuItem
            icon={<Presentation size={14} aria-hidden />}
            label="Present full screen"
            hint="Webinar slideshow"
            onClick={() => {
              setOpen(false);
              movie.start();
            }}
          />
        </div>
      )}
    </div>
  );
}

function MenuItem({
  icon,
  label,
  hint,
  onClick,
  disabled,
}: {
  icon: React.ReactNode;
  label: string;
  hint: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      disabled={disabled}
      className="flex w-full items-start gap-2.5 rounded-md px-2.5 py-2 text-left transition hover:bg-surface-elevated disabled:opacity-50"
    >
      <span className="mt-0.5 text-muted">{icon}</span>
      <span className="min-w-0">
        <span className="block text-sm font-medium text-foreground">{label}</span>
        <span className="block text-xs text-muted">{hint}</span>
      </span>
    </button>
  );
}
