import Link from "next/link";
import {
  getClientTimeline,
  type TimelineEvent,
  type TimelineEventKind,
  type TimelineEventTone,
} from "@/lib/queries/timeline";
import { timeAgo } from "@/lib/format/time";
import { Panel, StatusChip } from "@/components/ui";

const KIND_LABEL: Record<TimelineEventKind, string> = {
  call_planned: "Call",
  call_completed: "Call",
  proposal: "Proposal",
  audit: "Readiness",
};

const TONE_DOT: Record<TimelineEventTone, string> = {
  good: "var(--success)",
  warn: "var(--warning)",
  bad: "var(--danger)",
  info: "var(--accent)",
  neutral: "var(--quiet)",
};

/** Every call, proposal and readiness check for one client, newest first. */
export default async function ClientTimeline({ clientId }: { clientId: string }) {
  const events = await getClientTimeline(clientId);

  return (
    <Panel
      data-tour="client-timeline"
      title="Timeline"
      aside={
        <span className="text-xs text-muted">
          {events.length} event{events.length === 1 ? "" : "s"}
        </span>
      }
    >
      {events.length === 0 ? (
        <p className="text-sm text-muted">
          Nothing yet. Plan a call or run a readiness check to start the timeline.
        </p>
      ) : (
        <ol className="relative pl-5">
          <div
            aria-hidden
            className="absolute bottom-1 left-[5px] top-1 w-px"
            style={{ background: "var(--border-subtle)" }}
          />
          {events.map((e, i) => (
            <TimelineRow key={e.id} event={e} isLast={i === events.length - 1} />
          ))}
        </ol>
      )}
    </Panel>
  );
}

function TimelineRow({ event, isLast }: { event: TimelineEvent; isLast: boolean }) {
  return (
    <li className={`relative ${isLast ? "" : "pb-4"}`}>
      <span
        aria-hidden
        className="absolute left-[-15px] top-2 h-[11px] w-[11px] rounded-full"
        style={{ background: TONE_DOT[event.tone], boxShadow: "0 0 0 3px var(--surface)" }}
      />
      <Link href={event.href} className="group row-hover -mx-2 block rounded-md px-2 py-1.5">
        <div className="flex items-baseline justify-between gap-3">
          <div className="flex min-w-0 items-baseline gap-2">
            <StatusChip tone={event.tone} className="shrink-0">
              {KIND_LABEL[event.kind]}
            </StatusChip>
            <div className="truncate text-sm font-medium text-foreground transition-colors group-hover:text-accent">
              {event.title}
            </div>
          </div>
          <div className="shrink-0 text-xs tabular-nums text-muted">{timeAgo(event.occurredAt)}</div>
        </div>
        {event.subtitle && (
          <div className="mt-1 pl-[60px] text-xs leading-snug text-muted">{event.subtitle}</div>
        )}
      </Link>
    </li>
  );
}
