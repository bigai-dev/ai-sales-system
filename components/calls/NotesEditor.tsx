"use client";
import { useEffect, useRef, useState, useTransition } from "react";
import { generateCallDebrief, saveCallNotes } from "@/lib/ai/call-debrief";

const MIN_FOR_ANALYSIS = 30;

export default function NotesEditor({
  callId,
  initialNotes,
  hasDebrief,
}: {
  callId: string;
  initialNotes: string;
  hasDebrief: boolean;
}) {
  const [notes, setNotes] = useState(initialNotes);
  const [savedAt, setSavedAt] = useState<number | null>(initialNotes ? Date.now() : null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced auto-save while typing.
  useEffect(() => {
    if (notes === initialNotes) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      startTransition(async () => {
        const r = await saveCallNotes(callId, notes);
        if (r.ok) setSavedAt(Date.now());
      });
    }, 800);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [notes, callId, initialNotes]);

  async function analyze() {
    setError(null);
    setAnalyzing(true);
    // Flush any pending save first.
    if (notes !== initialNotes) {
      await saveCallNotes(callId, notes);
      setSavedAt(Date.now());
    }
    startTransition(async () => {
      const r = await generateCallDebrief(callId);
      setAnalyzing(false);
      if (!r.ok) setError(r.error);
    });
  }

  const tooShort = notes.trim().length < MIN_FOR_ANALYSIS;

  return (
    <div className="panel p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-semibold">Call notes</div>
          <div className="text-xs text-muted">
            Type as you go (or paste from your notepad). Auto-saves every second.
          </div>
        </div>
        <span className="text-[11px] text-muted">
          {savedAt ? `Saved ${timeAgo(savedAt)}` : "Not saved"}
        </span>
      </div>

      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={10}
        placeholder={`What did the prospect say? What did you commit to? Use your own shorthand — e.g.
- 12 devs, mid-level AI familiarity (most use Copilot, none use Cursor)
- Budget OK if scoped to one cohort first
- Worried about training during sprint week
- Asked to send proposal by Friday`}
        className="w-full bg-surface-elevated border border-border-subtle rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/40 resize-y font-mono leading-relaxed"
      />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-[11px] text-muted">
          {notes.trim().length} chars
          {tooShort && (
            <span className="ml-2 text-warning">
              · Need {MIN_FOR_ANALYSIS}+ to analyze
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {error && <span className="chip chip-bad">{error.slice(0, 120)}</span>}
          <button
            onClick={analyze}
            className="btn"
            disabled={tooShort || analyzing}
            title={
              tooShort
                ? `Need ${MIN_FOR_ANALYSIS}+ characters of notes`
                : "Run DeepSeek analysis on these notes"
            }
          >
            {analyzing
              ? "Analyzing…"
              : hasDebrief
                ? "Re-analyze"
                : "Analyze debrief"}
          </button>
        </div>
      </div>
    </div>
  );
}

function timeAgo(ms: number): string {
  const diff = Date.now() - ms;
  const s = Math.floor(diff / 1000);
  if (s < 5) return "just now";
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ago`;
}
