import Link from "next/link";
import {
  getClientTimeline,
  type TimelineEvent,
  type TimelineEventKind,
  type TimelineEventTone,
} from "@/lib/queries/timeline";
import { timeAgo } from "@/lib/format/time";

const KIND_LABEL: Record<TimelineEventKind, string> = {
  call_planned: "Call",
  call_completed: "Call",
  proposal: "Proposal",
  audit: "Audit",
};

const TONE_DOT: Record<TimelineEventTone, string> = {
  good: "var(--success)",
  warn: "var(--warning)",
  bad: "var(--danger)",
  info: "var(--accent)",
  neutral: "var(--quiet)",
};

const TONE_CHIP: Record<TimelineEventTone, string> = {
  good: "chip-good",
  warn: "chip-warn",
  bad: "chip-bad",
  info: "chip-info",
  neutral: "chip",
};

export default async function ClientTimeline({ clientId }: { clientId: string }) {
  const events = await getClientTimeline(clientId);

  return (
    <div className="panel p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="font-semibold">Timeline</div>
        <div className="text-[11px] uppercase tracking-wider text-muted">
          {events.length} event{events.length === 1 ? "" : "s"}
        </div>
      </div>

      {events.length === 0 ? (
        <div className="text-sm text-muted">
          No activity yet — plan a call or generate a readiness audit to start
          the timeline.
        </div>
      ) : (
        <ol className="relative pl-5">
          {/* Vertical rail */}
          <div
            aria-hidden
            className="absolute top-1 bottom-1 left-[5px] w-px"
            style={{ background: "var(--border-subtle)" }}
          />
          {events.map((e, i) => (
            <TimelineRow key={e.id} event={e} isLast={i === events.length - 1} />
          ))}
        </ol>
      )}
    </div>
  );
}

function TimelineRow({
  event,
  isLast,
}: {
  event: TimelineEvent;
  isLast: boolean;
}) {
  return (
    <li className={`relative ${isLast ? "" : "pb-4"}`}>
      <span
        aria-hidden
        className="absolute left-[-15px] top-2 w-[11px] h-[11px] rounded-full"
        style={{
          background: TONE_DOT[event.tone],
          boxShadow: "0 0 0 3px var(--surface)",
        }}
      />
      <Link
        href={event.href}
        className="group block row-hover -mx-2 px-2 py-1.5 rounded-md"
      >
        <div className="flex items-baseline justify-between gap-3">
          <div className="min-w-0 flex items-baseline gap-2">
            <span
              className={`chip ${TONE_CHIP[event.tone]} shrink-0 text-[10px] uppercase tracking-wider`}
            >
              {KIND_LABEL[event.kind]}
            </span>
            <div className="text-sm font-medium text-foreground truncate group-hover:text-accent transition-colors">
              {event.title}
            </div>
          </div>
          <div className="text-[11px] text-muted shrink-0 tabular-nums">
            {timeAgo(event.occurredAt)}
          </div>
        </div>
        {event.subtitle && (
          <div className="text-[11px] text-muted mt-1 leading-snug pl-[60px]">
            {event.subtitle}
          </div>
        )}
      </Link>
    </li>
  );
}
