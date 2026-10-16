"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { regradeCalls } from "@/app/actions/regrade";
import { Button, ErrorText } from "@/components/ui";
import { BTN, BUSY } from "@/lib/constants/copy";

export default function RegradeButton() {
  const [pending, start] = useTransition();
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  return (
    <div className="flex items-center gap-2">
      {note && <span className="text-xs text-muted">{note}</span>}
      <ErrorText className="text-xs">{error}</ErrorText>
      <Button
        busy={pending}
        busyLabel={BUSY.running}
        onClick={() =>
          start(async () => {
            setError(null);
            setNote(null);
            const r = await regradeCalls();
            if (r.ok) {
              const n = r.data?.graded ?? 0;
              setNote(n === 0 ? "No reviewed calls yet" : `Coached from ${n} call${n === 1 ? "" : "s"}`);
              router.refresh();
            } else {
              setError(r.error);
            }
          })
        }
      >
        {BTN.refresh}
      </Button>
    </div>
  );
}
