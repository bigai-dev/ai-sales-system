"use client";
import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, Sparkles } from "lucide-react";
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
      className="inline-flex items-center gap-1 text-xs text-muted transition hover:text-accent disabled:opacity-50"
    >
      {hasInsight ? <RefreshCw size={12} aria-hidden /> : <Sparkles size={12} aria-hidden />}
      {pending ? "Thinking…" : hasInsight ? "Refresh" : "Ask AI"}
    </button>
  );
}
