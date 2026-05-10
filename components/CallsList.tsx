import Link from "next/link";
import { getCallsByClient } from "@/lib/queries/calls";
import { OUTCOME_LABEL, OUTCOME_TONE } from "@/lib/schemas/call-debrief";
import { timeAgo } from "@/lib/format/time";
import { STATUS_LABEL, type CallStatus } from "@/lib/constants/labels";

const TONE_CHIP: Record<"good" | "warn" | "bad" | "info", string> = {
  good: "chip-good",
  warn: "chip-warn",
  bad: "chip-bad",
  info: "chip-info",
};


export default async function CallsList({ clientId }: { clientId: string }) {
  const rows = await getCallsByClient(clientId);

  return (
    <div className="panel p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="font-semibold">Calls</div>
        <div className="text-[11px] uppercase tracking-wider text-muted">
          {rows.length} on record
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="text-sm text-muted">
          No calls yet. Click <strong>Plan call</strong> above to start one.
        </div>
      ) : (
        <div className="divide-y divide-border-subtle">
          {rows.map((c) => {
            const when = c.scheduledAt ?? c.startedAt;
            const tone =
              c.outcome &&
              OUTCOME_TONE[c.outcome as keyof typeof OUTCOME_TONE]
                ? TONE_CHIP[OUTCOME_TONE[c.outcome as keyof typeof OUTCOME_TONE]]
                : "chip-info";
            const label =
              c.outcome && OUTCOME_LABEL[c.outcome as keyof typeof OUTCOME_LABEL]
                ? OUTCOME_LABEL[c.outcome as keyof typeof OUTCOME_LABEL]
                : STATUS_LABEL[c.status as CallStatus] ?? c.status;
            return (
              <Link
                key={c.id}
                href={`/calls/${c.id}`}
                className="flex items-center justify-between py-3 first:pt-0 last:pb-0 gap-3 row-hover -mx-1 px-1 rounded"
              >
                <div className="min-w-0">
                  <div className="text-sm font-medium">{timeAgo(when)}</div>
                  {c.nextStep && (
                    <div className="text-[11px] text-muted mt-0.5 truncate">
                      Next: {c.nextStep}
                    </div>
                  )}
                </div>
                <span className={`chip ${tone} shrink-0`}>{label}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
