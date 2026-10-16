"use client";
import { useEffect, useRef, useState, useTransition } from "react";
import { generateCallDebrief, saveCallNotes } from "@/lib/ai/call-debrief";
import { Button, ErrorText, Panel, SectionLabel, Textarea } from "@/components/ui";
import { BTN } from "@/lib/constants/copy";

const MIN_FOR_REVIEW = 30;

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
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [reviewing, setReviewing] = useState(false);
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

  async function review() {
    setError(null);
    setReviewing(true);
    // Flush any pending save first.
    if (notes !== initialNotes) {
      await saveCallNotes(callId, notes);
      setSavedAt(Date.now());
    }
    startTransition(async () => {
      const r = await generateCallDebrief(callId);
      setReviewing(false);
      if (!r.ok) setError(r.error);
    });
  }

  const tooShort = notes.trim().length < MIN_FOR_REVIEW;

  return (
    <Panel className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <SectionLabel hint="Type as you go or paste from your notepad. Saves by itself.">
          Notes
        </SectionLabel>
        <span className="shrink-0 text-xs text-muted">
          {savedAt ? `Saved ${timeAgo(savedAt)}` : initialNotes ? "Saved" : "Not saved yet"}
        </span>
      </div>

      <Textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={10}
        placeholder={`What did they say? What did you commit to? Shorthand is fine, e.g.
- 12 devs, most use Copilot, none use Cursor
- Budget OK if we start with one cohort
- Worried about training during sprint week
- Send proposal by Friday`}
        className="resize-y font-mono leading-relaxed"
      />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-xs text-muted">
          {tooShort
            ? `Write at least ${MIN_FOR_REVIEW} characters to review this call.`
            : `${notes.trim().length} characters`}
        </div>
        <div className="flex items-center gap-2">
          <ErrorText>{error}</ErrorText>
          <Button
            onClick={review}
            disabled={tooShort}
            busy={reviewing}
            busyLabel="Reviewing…"
            variant={hasDebrief ? "ghost" : "primary"}
          >
            {hasDebrief ? "Review again" : BTN.reviewCall}
          </Button>
        </div>
      </div>
    </Panel>
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
