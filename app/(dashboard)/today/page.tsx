import Link from "next/link";
import {
  getTodayInbox,
  type TaskItem,
  type TaskKind,
  type TaskUrgency,
} from "@/lib/queries/today";
import { relativeTime, calendarTime } from "@/lib/format/time";
import { formatMoney } from "@/db/lib/money";
import SnoozeButton from "@/components/today/SnoozeButton";
import QuickCapture from "@/components/today/QuickCapture";
import { completeScratch } from "@/app/(dashboard)/today/actions";

const KIND_LABEL: Record<TaskKind, string> = {
  prep_briefing: "Prep",
  take_call: "Call",
  debrief_call: "Debrief",
  follow_up: "Follow up",
  chase_proposal: "Chase",
  move_deal: "Stuck",
  confirm_delivery: "Delivery",
  scratch: "Note",
};

const KIND_CHIP: Record<TaskKind, string> = {
  prep_briefing: "chip-info",
  take_call: "chip-warn",
  debrief_call: "chip-warn",
  follow_up: "chip",
  chase_proposal: "chip",
  move_deal: "chip-bad",
  confirm_delivery: "chip-info",
  scratch: "chip",
};

const URGENCY_LABEL: Record<TaskUrgency, string> = {
  overdue: "Overdue",
  today: "Today",
  this_week: "This week",
  soon: "Later",
};

const URGENCY_CAPTION: Record<TaskUrgency, string> = {
  overdue: "Past their window — handle first",
  today: "Need attention in the next 24 hours",
  this_week: "Pencil into this week's schedule",
  soon: "On the radar but not urgent",
};

export default async function TodayPage() {
  const { tasks, calendar } = await getTodayInbox();

  const buckets: Record<TaskUrgency, TaskItem[]> = {
    overdue: [],
    today: [],
    this_week: [],
    soon: [],
  };
  for (const t of tasks) buckets[t.urgency].push(t);

  const totalActive = buckets.overdue.length + buckets.today.length;
  const orderedUrgencies: TaskUrgency[] = ["overdue", "today", "this_week", "soon"];

  return (
    <section className="space-y-6">
      <div>
        <div className="text-xs text-muted uppercase tracking-wider">Today</div>
        <h1 className="text-2xl font-bold mt-1">
          {tasks.length === 0 ? (
            <>You're clear</>
          ) : (
            <>
              <span className="text-accent">{totalActive}</span> need you now
              <span className="text-muted">
                {" "}
                · {tasks.length} total
              </span>
            </>
          )}
        </h1>
        <div className="text-xs text-muted mt-1">
          Pulled from active calls, stale proposals, deals stuck in stage, and
          your quick-captures. Snooze items you'll handle later.
        </div>
      </div>

      <QuickCapture />

      {calendar.length > 0 && (
        <div>
          <div className="flex items-baseline justify-between mb-2">
            <div className="text-[11px] uppercase tracking-wider font-semibold text-muted">
              Week ahead{" "}
              <span className="text-quiet font-normal">· {calendar.length}</span>
            </div>
            <div className="text-[11px] text-muted">
              Scheduled calls and workshop deliveries
            </div>
          </div>
          <div className="panel p-1.5">
            <div className="space-y-0.5">
              {calendar.map((e) => (
                <Link
                  key={e.id}
                  href={e.href}
                  className="group row-hover rounded-lg px-4 py-2.5 flex items-center gap-3"
                >
                  <span className="text-[11px] uppercase tracking-wider text-muted shrink-0 w-20 tabular-nums">
                    {calendarTime(e.eventAt)}
                  </span>
                  <span
                    className={`chip ${
                      e.kind === "delivery" ? "chip-good" : "chip-info"
                    } shrink-0 text-[10px]`}
                  >
                    {e.kind === "delivery" ? "Workshop" : "Call"}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground truncate">
                      {e.title}
                    </div>
                    <div className="text-[11px] text-muted truncate">
                      {e.subtitle}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {tasks.length === 0 && (
        <div className="panel p-8 text-center">
          <div className="text-sm text-foreground">
            Nothing demands your attention right now.
          </div>
          <div className="text-xs text-muted mt-1">
            Use quick-capture above to drop something for later, or check the
            pipeline to scan deal momentum.
          </div>
        </div>
      )}

      {orderedUrgencies.map((u) => {
        const items = buckets[u];
        if (items.length === 0) return null;
        return (
          <div key={u}>
            <div className="flex items-baseline justify-between mb-2">
              <div className="text-[11px] uppercase tracking-wider font-semibold text-muted">
                {URGENCY_LABEL[u]}{" "}
                <span className="text-quiet font-normal">· {items.length}</span>
              </div>
              <div className="text-[11px] text-muted">{URGENCY_CAPTION[u]}</div>
            </div>
            <div className="panel p-1.5">
              <div className="space-y-0.5">
                {items.map((t) => (
                  <TaskRow key={t.id} task={t} />
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </section>
  );
}

function TaskRow({ task }: { task: TaskItem }) {
  return (
    <div className="group row-hover rounded-lg px-3 py-2.5 flex items-start gap-3">
      <span
        className={`chip ${KIND_CHIP[task.kind]} shrink-0 text-[10px] mt-0.5`}
      >
        {KIND_LABEL[task.kind]}
      </span>
      <Link href={task.href} className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <div className="text-sm font-medium text-foreground truncate">
            {task.title}
          </div>
        </div>
        <div className="text-[11px] text-muted truncate">{task.subtitle}</div>
        {task.suggestion && (
          <div className="text-[11px] text-muted/70 italic truncate mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            → {task.suggestion}
          </div>
        )}
      </Link>
      <div className="flex flex-col items-end gap-1 shrink-0 text-right">
        <div className="flex items-center gap-1.5">
          {task.hot && (
            <span
              className="text-[11px] leading-none"
              title="Hot deal"
              aria-label="Hot deal"
            >
              🔥
            </span>
          )}
          {task.valueCents !== null && (
            <span className="text-[11px] font-medium text-foreground tabular-nums">
              {formatMoney(task.valueCents)}
            </span>
          )}
          <span className="text-[11px] text-muted tabular-nums">
            · {relativeTime(task.eventAt)}
          </span>
        </div>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          {task.kind === "scratch" ? (
            <CompleteScratchButton id={task.id.replace(/^scratch-/, "")} />
          ) : (
            <SnoozeButton taskId={task.id} />
          )}
        </div>
      </div>
    </div>
  );
}

function CompleteScratchButton({ id }: { id: string }) {
  return (
    <form action={completeScratch}>
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        className="inline-flex items-center gap-1 text-[11px] uppercase tracking-wider px-2 py-1 rounded-md border border-border-subtle bg-surface text-muted hover:text-success hover:border-success/40 transition shrink-0"
        aria-label="Mark done"
        title="Mark done"
      >
        <CheckIcon />
        Done
      </button>
    </form>
  );
}

function CheckIcon() {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
