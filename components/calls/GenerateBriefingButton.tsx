"use client";
import { useState, useTransition } from "react";
import { generateCallBriefing } from "@/lib/ai/call-briefing";
import { Button, ErrorText } from "@/components/ui";

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
      <ErrorText>{error}</ErrorText>
      <Button
        onClick={run}
        variant={hasBriefing ? "ghost" : "primary"}
        busy={loading}
        busyLabel="Planning…"
      >
        {hasBriefing ? "Remake call plan" : "Make call plan"}
      </Button>
    </div>
  );
}
