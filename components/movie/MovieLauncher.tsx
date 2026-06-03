"use client";
import { useMovie } from "./MovieProvider";

// The one button that starts the webinar demo. Styled as the primary accent
// action so it's unmistakable on stage.
export default function MovieLauncher() {
  const { active, start } = useMovie();
  if (active) return null;

  return (
    <button
      type="button"
      onClick={start}
      className="inline-flex items-center gap-1.5 rounded-md bg-accent px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-accent-foreground shadow-sm transition hover:brightness-110"
      aria-label="Start the webinar demo"
      title="Start the webinar demo (full screen)"
    >
      <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M8 5v14l11-7z" />
      </svg>
      Present
    </button>
  );
}
