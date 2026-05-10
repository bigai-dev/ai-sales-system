import { eq, gt, isNull } from "drizzle-orm";
import { db } from "@/db/client";
import {
  calls,
  clients,
  deals,
  proposals,
  taskDismissals,
  scratchNotes,
} from "@/db/schema";
import { formatMoney } from "@/db/lib/money";
import { STAGE_NAME } from "@/lib/constants/labels";

export type TaskKind =
  | "prep_briefing"
  | "take_call"
  | "debrief_call"
  | "follow_up"
  | "chase_proposal"
  | "move_deal"
  | "confirm_delivery"
  | "scratch";

export type TaskUrgency = "overdue" | "today" | "this_week" | "soon";

export type TaskItem = {
  id: string;
  kind: TaskKind;
  urgency: TaskUrgency;
  title: string;
  subtitle: string;
  suggestion: string | null; // recommended next action ("Generate proposal", etc.)
  clientName: string | null;
  href: string;
  eventAt: number; // canonical timestamp the task pivots around (past or future)
  sortKey: number;
  valueCents: number | null; // deal value for triage signal
  hot: boolean; // hot-deal marker
};

export type CalendarEvent = {
  id: string;
  kind: "call" | "delivery";
  title: string;
  subtitle: string;
  href: string;
  eventAt: number;
};

const DAY_MS = 86_400_000;
const WEEK_MS = 7 * DAY_MS;

function urgencyOf(targetMs: number, now: number): TaskUrgency {
  const diff = targetMs - now;
  if (diff < 0) return "overdue";
  if (diff < DAY_MS) return "today";
  if (diff < WEEK_MS) return "this_week";
  return "soon";
}

const STAGE_STUCK_THRESHOLD_MS: Record<string, number> = {
  A: 5 * DAY_MS,
  N: 7 * DAY_MS,
  C: 5 * DAY_MS,
};

const STAGE_SUGGESTION: Record<string, string> = {
  A: "Generate a proposal to advance to Negotiation",
  N: "Schedule a decision call to close",
  C: "Confirm contract details and move to Order",
};

const URGENCY_BOOST: Record<TaskUrgency, TaskUrgency> = {
  overdue: "overdue",
  today: "overdue",
  this_week: "today",
  soon: "this_week",
};

export type TodayInbox = {
  tasks: TaskItem[];
  calendar: CalendarEvent[];
};

export async function getTodayInbox(): Promise<TodayInbox> {
  const now = Date.now();
  const oneDayAgo = now - DAY_MS;
  const fiveDaysAgo = now - 5 * DAY_MS;
  const tenDaysAgo = now - 10 * DAY_MS;

  // -------- Active dismissals (snoozed tasks) --------
  const activeDismissals = await db
    .select({ taskId: taskDismissals.taskId, snoozedUntil: taskDismissals.snoozedUntil })
    .from(taskDismissals)
    .where(gt(taskDismissals.snoozedUntil, now));
  const dismissed = new Set(activeDismissals.map((d) => d.taskId));

  const tasks: TaskItem[] = [];
  const calendar: CalendarEvent[] = [];

  // -------- Per-client deal lookup (for value + hot enrichment) --------
  const allDeals = await db
    .select({
      id: deals.id,
      clientId: deals.clientId,
      clientName: clients.name,
      stage: deals.stage,
      valueCents: deals.valueCents,
      hot: deals.hot,
      daysInStageStartsAt: deals.daysInStageStartsAt,
      deliveryDate: deals.deliveryDate,
    })
    .from(deals)
    .leftJoin(clients, eq(deals.clientId, clients.id));

  // Highest-value open deal per client (used to enrich call/proposal tasks)
  const dealByClient = new Map<string, (typeof allDeals)[number]>();
  for (const d of allDeals) {
    if (d.stage === "O") continue; // closed-won, not actionable
    const existing = dealByClient.get(d.clientId);
    if (!existing || d.valueCents > existing.valueCents) {
      dealByClient.set(d.clientId, d);
    }
  }

  function enrich(clientId: string | null) {
    if (!clientId) return { valueCents: null as number | null, hot: false };
    const d = dealByClient.get(clientId);
    if (!d) return { valueCents: null, hot: false };
    return { valueCents: d.valueCents, hot: !!d.hot };
  }

  function pushTask(t: TaskItem) {
    if (dismissed.has(t.id)) return;
    if (t.hot && t.urgency !== "overdue") {
      t.urgency = URGENCY_BOOST[t.urgency];
    }
    tasks.push(t);
  }

  // -------- Calls --------
  const allCalls = await db
    .select({
      id: calls.id,
      clientId: calls.clientId,
      clientName: clients.name,
      status: calls.status,
      scheduledAt: calls.scheduledAt,
      startedAt: calls.startedAt,
      briefing: calls.briefing,
      debrief: calls.debrief,
      nextStep: calls.nextStep,
      analyzedAt: calls.analyzedAt,
    })
    .from(calls)
    .leftJoin(clients, eq(calls.clientId, clients.id));

  for (const c of allCalls) {
    const when = c.scheduledAt ?? c.startedAt;
    const isPlanned = c.status === "planned" || c.status === "scheduled";
    const isCompleted = c.status === "completed" || c.status === "ended";
    const clientName = c.clientName ?? "Unscoped call";
    const e = enrich(c.clientId);

    // Calendar entry for any planned call within next 7 days
    if (isPlanned && when > now && when <= now + WEEK_MS) {
      calendar.push({
        id: `cal-call-${c.id}`,
        kind: "call",
        title: clientName,
        subtitle: c.briefing ? "Briefing ready" : "No briefing yet",
        href: `/calls/${c.id}`,
        eventAt: when,
      });
    }

    // Prep briefing for upcoming calls (within next week)
    if (isPlanned && !c.briefing && when <= now + WEEK_MS) {
      pushTask({
        id: `prep-${c.id}`,
        kind: "prep_briefing",
        urgency: urgencyOf(when, now),
        title: "Prep briefing",
        subtitle: clientName,
        suggestion: "Generate the AI briefing before the call",
        clientName: c.clientName,
        href: `/calls/${c.id}`,
        eventAt: when,
        sortKey: when,
        valueCents: e.valueCents,
        hot: e.hot,
      });
    }

    // Take the call (within next 24h)
    if (isPlanned && when <= now + DAY_MS) {
      pushTask({
        id: `call-${c.id}`,
        kind: "take_call",
        urgency: urgencyOf(when, now),
        title: "Take this call",
        subtitle: clientName,
        suggestion: c.briefing ? null : "No briefing — generate one first",
        clientName: c.clientName,
        href: `/calls/${c.id}`,
        eventAt: when,
        sortKey: when,
        valueCents: e.valueCents,
        hot: e.hot,
      });
    }

    // Debrief completed calls without analysis
    if (isCompleted && !c.debrief) {
      pushTask({
        id: `debrief-${c.id}`,
        kind: "debrief_call",
        urgency: c.startedAt < oneDayAgo ? "overdue" : "today",
        title: "Debrief this call",
        subtitle: clientName,
        suggestion: "Capture notes and analyze",
        clientName: c.clientName,
        href: `/calls/${c.id}`,
        eventAt: c.startedAt,
        sortKey: c.startedAt,
        valueCents: e.valueCents,
        hot: e.hot,
      });
    }

    // Follow-up commitments — debrief produced a next-step that's been sitting
    if (c.debrief && c.nextStep && c.analyzedAt && c.analyzedAt < oneDayAgo) {
      const stale = c.analyzedAt < fiveDaysAgo;
      pushTask({
        id: `followup-${c.id}`,
        kind: "follow_up",
        urgency: stale ? "overdue" : "this_week",
        title: c.nextStep,
        subtitle: clientName,
        suggestion: "Draft the follow-up email from the debrief",
        clientName: c.clientName,
        href: `/calls/${c.id}`,
        eventAt: c.analyzedAt,
        sortKey: c.analyzedAt,
        valueCents: e.valueCents,
        hot: e.hot,
      });
    }
  }

  // -------- Stale proposals --------
  const allProposals = await db
    .select({
      id: proposals.id,
      clientId: proposals.clientId,
      clientName: clients.name,
      generatedAt: proposals.generatedAt,
      cohortSize: proposals.cohortSize,
    })
    .from(proposals)
    .leftJoin(clients, eq(proposals.clientId, clients.id));

  const latestProposalByClient = new Map<string, (typeof allProposals)[number]>();
  for (const p of allProposals) {
    const existing = latestProposalByClient.get(p.clientId);
    if (!existing || p.generatedAt > existing.generatedAt) {
      latestProposalByClient.set(p.clientId, p);
    }
  }

  for (const p of latestProposalByClient.values()) {
    if (p.generatedAt >= fiveDaysAgo) continue;
    const hasFollowupCall = allCalls.some(
      (c) => c.clientId === p.clientId && c.startedAt > p.generatedAt,
    );
    if (hasFollowupCall) continue;
    const e = enrich(p.clientId);

    pushTask({
      id: `chase-${p.id}`,
      kind: "chase_proposal",
      urgency: p.generatedAt < tenDaysAgo ? "overdue" : "this_week",
      title: `Chase proposal · ${p.cohortSize} pax`,
      subtitle: p.clientName ?? "—",
      suggestion: "Plan a check-in call or send a nudge email",
      clientName: p.clientName,
      href: `/clients/${p.clientId}`,
      eventAt: p.generatedAt,
      sortKey: p.generatedAt,
      valueCents: e.valueCents,
      hot: e.hot,
    });
  }

  // -------- Deals stuck in stage --------
  for (const d of allDeals) {
    const threshold = STAGE_STUCK_THRESHOLD_MS[d.stage];
    if (!threshold) continue; // S, P, O ignored
    const stuckMs = now - d.daysInStageStartsAt;
    if (stuckMs <= threshold) continue;

    const days = Math.floor(stuckMs / DAY_MS);
    pushTask({
      id: `stuck-${d.id}`,
      kind: "move_deal",
      urgency: stuckMs > 2 * threshold ? "overdue" : "this_week",
      title: `Stuck in ${STAGE_NAME[d.stage as "A" | "N" | "C"] ?? d.stage} (${d.stage})`,
      subtitle: `${d.clientName ?? "—"} · ${days} day${days === 1 ? "" : "s"}`,
      suggestion: STAGE_SUGGESTION[d.stage] ?? null,
      clientName: d.clientName,
      href: d.clientId ? `/clients/${d.clientId}` : "/pipeline",
      eventAt: d.daysInStageStartsAt,
      sortKey: d.daysInStageStartsAt,
      valueCents: d.valueCents,
      hot: !!d.hot,
    });
  }

  // -------- Workshop delivery confirmation (within 7 days) --------
  for (const d of allDeals) {
    if (!d.deliveryDate) continue;
    const daysOut = (d.deliveryDate - now) / DAY_MS;
    if (daysOut < -1 || daysOut > 7) continue; // skip stale or far-future
    pushTask({
      id: `delivery-${d.id}`,
      kind: "confirm_delivery",
      urgency: urgencyOf(d.deliveryDate, now),
      title: `Workshop delivery · ${formatMoney(d.valueCents)}`,
      subtitle: d.clientName ?? "—",
      suggestion: "Confirm cohort headcount, venue, and run-of-day",
      clientName: d.clientName,
      href: d.clientId ? `/clients/${d.clientId}` : "/pipeline",
      eventAt: d.deliveryDate,
      sortKey: d.deliveryDate,
      valueCents: d.valueCents,
      hot: !!d.hot,
    });
    calendar.push({
      id: `cal-delivery-${d.id}`,
      kind: "delivery",
      title: `${d.clientName ?? "Workshop"} delivery`,
      subtitle: formatMoney(d.valueCents),
      href: d.clientId ? `/clients/${d.clientId}` : "/pipeline",
      eventAt: d.deliveryDate,
    });
  }

  // -------- Scratch notes (quick-capture) --------
  const openScratch = await db
    .select()
    .from(scratchNotes)
    .where(isNull(scratchNotes.doneAt));
  for (const n of openScratch) {
    const eventAt = n.dueAt ?? n.createdAt;
    pushTask({
      id: `scratch-${n.id}`,
      kind: "scratch",
      urgency: n.dueAt ? urgencyOf(n.dueAt, now) : "this_week",
      title: n.body,
      subtitle: "Quick capture",
      suggestion: null,
      clientName: null,
      href: `/today`,
      eventAt,
      sortKey: eventAt,
      valueCents: null,
      hot: false,
    });
  }

  // Sort: urgency tier first, then sortKey ASC (oldest first within tier).
  const URGENCY_ORDER: Record<TaskUrgency, number> = {
    overdue: 0,
    today: 1,
    this_week: 2,
    soon: 3,
  };
  tasks.sort((a, b) => {
    const u = URGENCY_ORDER[a.urgency] - URGENCY_ORDER[b.urgency];
    if (u !== 0) return u;
    // Hot deals win ties within the same urgency tier
    if (a.hot !== b.hot) return a.hot ? -1 : 1;
    return a.sortKey - b.sortKey;
  });

  calendar.sort((a, b) => a.eventAt - b.eventAt);

  return { tasks, calendar };
}
