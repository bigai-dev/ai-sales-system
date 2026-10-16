import Link from "next/link";
import {
  CALL_STATUS_LABEL,
  OUTCOME_LABEL,
  OUTCOME_TONE,
  type CallOutcome,
  type CallStatus,
} from "@/lib/constants/labels";
import { routes } from "@/lib/constants/routes";
import { StatusChip } from "@/components/ui";

export type CallRowData = {
  id: string;
  clientName: string | null;
  status: string;
  outcome: string | null;
  scheduledAt: number | null;
  startedAt: number;
  nextStep: string | null;
};

/** One call in any list: who, when, what came of it. */
export default function CallRow({
  call,
  when,
  showClient = true,
}: {
  call: CallRowData;
  /** Pre-formatted time text ("in 2h", "3d ago"). */
  when: string;
  showClient?: boolean;
}) {
  const outcome = call.outcome as CallOutcome | null;
  const hasOutcome = !!outcome && outcome in OUTCOME_LABEL;
  const label = hasOutcome
    ? OUTCOME_LABEL[outcome]
    : (CALL_STATUS_LABEL[call.status as CallStatus] ?? call.status);
  const tone = hasOutcome ? OUTCOME_TONE[outcome] : "info";

  return (
    <Link
      href={routes.call(call.id)}
      className="row-hover -mx-2 flex items-center justify-between gap-3 rounded-lg px-2 py-3"
    >
      <div className="min-w-0">
        <div className="truncate text-sm font-medium">
          {showClient ? (call.clientName ?? "No client") : when}
        </div>
        <div className="mt-0.5 truncate text-xs text-muted">
          {showClient ? when : null}
          {showClient && call.nextStep ? " · " : null}
          {call.nextStep ? `Next: ${call.nextStep}` : null}
        </div>
      </div>
      <StatusChip tone={tone} className="shrink-0">
        {label}
      </StatusChip>
    </Link>
  );
}
