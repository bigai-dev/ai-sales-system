import Link from "next/link";
import { getRecentCalls } from "@/lib/queries/calls";
import { OUTCOME_LABEL, OUTCOME_TONE } from "@/lib/schemas/call-debrief";

const TONE_CHIP: Record<"good" | "warn" | "bad" | "info", string> = {
  good: "chip-good",
  warn: "chip-warn",
  bad: "chip-bad",
  info: "chip-info",
};

const STATUS_LABEL: Record<string, string> = {
  planned: "Planned",
  completed: "Completed",
  scheduled: "Planned",
  ended: "Completed",
  live: "Live",
};

function timeAgo(ms: number): string {
  const diff = Date.now() - ms;
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  if (d < 30) return `${Math.floor(d / 7)}w ago`;
  return new Date(ms).toLocaleDateString("en-MY", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function CallsPage() {
  const calls = await getRecentCalls(50);

  const planned = calls.filter((c) => c.status === "planned" || c.status === "scheduled");
  const completed = calls.filter(
    (c) => c.status === "completed" || c.status === "ended",
  );

  return (
    <section className="space-y-6">
      <div>
        <div className="text-xs text-muted uppercase tracking-wider">Calls</div>
        <h1 className="text-2xl font-bold mt-1">
          {calls.length} session{calls.length === 1 ? "" : "s"} ·{" "}
          <span className="text-accent">{planned.length} planned</span>
        </h1>
        <div className="text-xs text-muted mt-1">
          Start a new session from any client&apos;s page.
        </div>
      </div>

      {planned.length > 0 && (
        <div>
          <div className="text-[11px] uppercase tracking-wider text-muted mb-2">
            Planned · ready to take
          </div>
          <div className="space-y-2">
            {planned.map((c) => (
              <CallRow key={c.id} call={c} />
            ))}
          </div>
        </div>
      )}

      {completed.length > 0 && (
        <div>
          <div className="text-[11px] uppercase tracking-wider text-muted mb-2">
            Recent debriefs
          </div>
          <div className="space-y-2">
            {completed.map((c) => (
              <CallRow key={c.id} call={c} />
            ))}
          </div>
        </div>
      )}

      {calls.length === 0 && (
        <div className="panel p-6 text-sm text-muted">
          No calls yet. Open a client and click <strong>Plan call</strong> to start.
        </div>
      )}
    </section>
  );
}

function CallRow({
  call,
}: {
  call: {
    id: string;
    clientId: string | null;
    clientName: string | null;
    status: string;
    outcome: string | null;
    scheduledAt: number | null;
    startedAt: number;
    nextStep: string | null;
  };
}) {
  const when = call.scheduledAt ?? call.startedAt;
  const tone =
    call.outcome &&
    OUTCOME_TONE[call.outcome as keyof typeof OUTCOME_TONE]
      ? TONE_CHIP[OUTCOME_TONE[call.outcome as keyof typeof OUTCOME_TONE]]
      : "chip-info";
  const outcomeLabel =
    call.outcome && OUTCOME_LABEL[call.outcome as keyof typeof OUTCOME_LABEL]
      ? OUTCOME_LABEL[call.outcome as keyof typeof OUTCOME_LABEL]
      : STATUS_LABEL[call.status] ?? call.status;

  return (
    <Link
      href={`/calls/${call.id}`}
      className="panel p-4 flex items-center justify-between gap-4 row-hover"
    >
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium truncate">
          {call.clientName ?? "Unscoped call"}
        </div>
        <div className="text-[11px] text-muted mt-0.5">
          {timeAgo(when)}
          {call.nextStep ? <> · Next: {call.nextStep}</> : null}
        </div>
      </div>
      <span className={`chip ${tone} shrink-0`}>{outcomeLabel}</span>
    </Link>
  );
}
