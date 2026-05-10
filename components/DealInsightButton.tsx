"use client";
import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { generateDealInsight } from "@/lib/ai/deal-insight";

export default function DealInsightButton({
  dealId,
  hasInsight,
}: {
  dealId: string;
  hasInsight: boolean;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  return (
    <button
      type="button"
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.stopPropagation();
        start(async () => {
          setError(null);
          const r = await generateDealInsight(dealId);
          if (!r.ok) setError(r.error);
          router.refresh();
        });
      }}
      disabled={pending}
      title={error ?? undefined}
      className="text-[10px] uppercase tracking-wider text-accent hover:text-[#a78bfa] transition disabled:opacity-50"
    >
      {pending ? "Thinking…" : hasInsight ? "↻ Regenerate" : "✨ Generate AI insight"}
    </button>
  );
}
