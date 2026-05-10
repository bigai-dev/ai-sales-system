"use client";
import { useState, useTransition } from "react";
import { generateCallBriefing } from "@/lib/ai/call-briefing";

export default function GenerateBriefingButton({
  callId,
  hasBriefing,
}: {
  callId: string;
  hasBriefing: boolean;
}) {
  const [, startTransition] = useTransition();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function run() {
    setError(null);
    setLoading(true);
    startTransition(async () => {
      const r = await generateCallBriefing(callId);
      setLoading(false);
      if (!r.ok) setError(r.error);
    });
  }

  return (
    <div className="flex items-center gap-2">
      {error && <span className="chip chip-bad">{error.slice(0, 120)}</span>}
      <button onClick={run} className="btn" disabled={loading}>
        {loading
          ? hasBriefing
            ? "Regenerating…"
            : "Drafting…"
          : hasBriefing
            ? "Regenerate briefing"
            : "Prep this call"}
      </button>
    </div>
  );
}
