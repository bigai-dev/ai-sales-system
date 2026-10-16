import Link from "next/link";
import { Calendar, Check, Flame } from "lucide-react";
import { getTodayInbox, type TaskItem, type TaskKind, type TaskUrgency } from "@/lib/queries/today";
import { relativeTime, calendarTime } from "@/lib/format/time";
import { formatMoney } from "@/db/lib/money";
import SnoozeButton from "@/components/today/SnoozeButton";
import QuickCapture from "@/components/today/QuickCapture";
import { completeScratch } from "@/app/(dashboard)/today/actions";
import { PAGE } from "@/lib/constants/copy";
import { routes } from "@/lib/constants/routes";
import type { Tone } from "@/lib/constants/labels";
import { EmptyState, PageHeader, Panel, SectionLabel, StatusChip } from "@/components/ui";

const KIND: Record<TaskKind, { label: string; tone: Tone }> = {
  prep_briefing: { label: "Plan call", tone: "info" },
  take_call: { label: "Call", tone: "warn" },
  debrief_call: { label: "Review call", tone: "warn" },
  follow_up: { label: "Follow up", tone: "neutral" },
  chase_proposal: { label: "Chase proposal", tone: "neutral" },
  move_deal: { label: "Deal stalled", tone: "bad" },
  confirm_delivery: { label: "Workshop", tone: "info" },
  scratch: { label: "Note", tone: "neutral" },
};

const URGENCY: Record<TaskUrgency, { label: string; hint: string }> = {
  overdue: { label: "Overdue", hint: "Past their time; handle these first." },
  today: { label: "Today", hint: "Need attention in the next 24 hours." },
  this_week: { label: "This week", hint: "Fit these in this week." },
  soon: { label: "Later", hint: "On the radar, not urgent." },
};

export const metadata = { title: PAGE.today.title };

export default async function TodayPage() {
  const { tasks, calendar } = await getTodayInbox();

  const groups: Record<TaskUrgency, TaskItem[]> = { overdue: [], today: [], this_week: [], soon: [] };
  for (const t of tasks) groups[t.urgency].push(t);
  const needNow = groups.overdue.length + groups.today.length;
  const order: TaskUrgency[] = ["overdue", "today", "this_week", "soon"];

  return (
    <section className="space-y-6">
      <PageHeader
        title={PAGE.today.title}
        description={
          tasks.length === 0
            ? "You're clear."
            : `${needNow} need you now · ${tasks.length} in total. Snooze what can wait.`
        }
      />

      <QuickCapture />

      {calendar.length > 0 && (
        <section>
          <SectionLabel hint="Planned calls and workshop dates in the next 7 days." className="mb-2">
            Week ahead
          </SectionLabel>
          <Panel padding="none">
            <ul className="divide-y divide-border-subtle">
              {calendar.map((e) => (
                <li key={e.id}>
                  <Link href={e.href} className="row-hover flex items-center gap-3 px-4 py-2.5">
                    <span className="w-20 shrink-0 text-xs tabular-nums text-muted">
                      {calendarTime(e.eventAt)}
                    </span>
                    <Calendar size={14} className="shrink-0 text-muted" aria-hidden />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-foreground">
                        {e.kind === "delivery" ? "Workshop · " : ""}
                        {e.title}
                      </div>
                      <div className="truncate text-xs text-muted">{e.subtitle}</div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </Panel>
        </section>
      )}

      {tasks.length === 0 && (
        <EmptyState
          title="Nothing needs you right now."
          hint={
            <>
              Add a note above for later, or open <Link href={routes.deals()} className="underline">Deals</Link> to
              see what's moving.
            </>
          }
        />
      )}

      <div data-tour="today-list" className="space-y-6">
        {order.map((u) => {
          const items = groups[u];
          if (items.length === 0) return null;
          return (
            <section key={u}>
              <SectionLabel hint={URGENCY[u].hint} className="mb-2">
                {URGENCY[u].label} · {items.length}
              </SectionLabel>
              <Panel padding="none">
                <ul className="divide-y divide-border-subtle">
                  {items.map((t) => (
                    <TaskRow key={t.id} task={t} />
                  ))}
                </ul>
              </Panel>
            </section>
          );
        })}
      </div>
    </section>
  );
}

function TaskRow({ task }: { task: TaskItem }) {
  const kind = KIND[task.kind];
  return (
    <li className="row-hover flex flex-wrap items-start gap-3 px-4 py-3">
      <StatusChip tone={kind.tone} className="mt-0.5 shrink-0">
        {kind.label}
      </StatusChip>
      <Link href={task.href} className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-foreground">{task.title}</div>
        <div className="truncate text-xs text-muted">{task.subtitle}</div>
        {task.suggestion && (
          <div className="mt-0.5 truncate text-xs italic text-muted">{task.suggestion}</div>
        )}
      </Link>
      <div className="flex shrink-0 flex-col items-end gap-1.5 text-right">
        <div className="flex items-center gap-1.5 text-xs">
          {task.hot && <Flame size={13} className="text-accent" aria-label="Hot deal" />}
          {task.valueCents !== null && (
            <span className="font-medium tabular-nums text-foreground">{formatMoney(task.valueCents)}</span>
          )}
          <span className="tabular-nums text-muted">{relativeTime(task.eventAt)}</span>
        </div>
        {task.kind === "scratch" ? (
          <CompleteScratchButton id={task.id.replace(/^scratch-/, "")} />
        ) : (
          <SnoozeButton taskId={task.id} />
        )}
      </div>
    </li>
  );
}

function CompleteScratchButton({ id }: { id: string }) {
  return (
    <form action={completeScratch}>
      <input type="hidden" name="id" value={id} />
      <button type="submit" className="btn-ghost btn-sm" aria-label="Mark done">
        <Check size={13} aria-hidden />
        Done
      </button>
    </form>
  );
}
