"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { regradeCalls } from "@/app/actions/regrade";

export default function RegradeButton() {
  const [pending, start] = useTransition();
  const [last, setLast] = useState<string | null>(null);
  const router = useRouter();

  return (
    <div className="flex items-center gap-2">
      {last && <span className="text-[11px] text-muted">{last}</span>}
      <button
        className="btn"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const r = await regradeCalls();
            if (r.ok) {
              setLast(`Graded ${r.data?.graded ?? 0} calls`);
              router.refresh();
            } else {
              setLast(`Error: ${r.error.slice(0, 60)}`);
            }
          })
        }
      >
        {pending ? "Regrading…" : "Generate coaching plan"}
      </button>
    </div>
  );
}
