"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteDeal, updateDeal } from "@/app/(dashboard)/deals/actions";
import { STAGE, STAGE_CODES, type StageCode } from "@/lib/constants/labels";
import { Button, ErrorText, Select } from "@/components/ui";
import { BTN } from "@/lib/constants/copy";

/** Stage picker and delete button for one deal on the client page. */
export default function DealRowActions({ dealId, stage }: { dealId: string; stage: StageCode }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function changeStage(to: StageCode) {
    if (to === stage) return;
    setError(null);
    start(async () => {
      const r = await updateDeal(dealId, { stage: to });
      if (!r.ok) setError(r.error);
      else router.refresh();
    });
  }

  function remove() {
    if (!confirm("Delete this deal? This can't be undone.")) return;
    setError(null);
    start(async () => {
      const r = await deleteDeal(dealId);
      if (!r.ok) setError(r.error);
      else router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select
        aria-label="Stage"
        value={stage}
        disabled={pending}
        onChange={(e) => changeStage(e.target.value as StageCode)}
        className="w-auto py-1 text-xs"
      >
        {STAGE_CODES.map((c) => (
          <option key={c} value={c}>
            {STAGE[c].label}
          </option>
        ))}
      </Select>
      <Button variant="textDanger" size="sm" onClick={remove} disabled={pending}>
        {BTN.delete}
      </Button>
      <ErrorText className="text-xs">{error}</ErrorText>
    </div>
  );
}
