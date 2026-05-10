import { desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { calls, healthChecks, proposals } from "@/db/schema";
import { formatMoneyExact } from "@/db/lib/money";
import { OUTCOME_LABEL, OUTCOME_TONE } from "@/lib/schemas/call-debrief";
import { VENUE_LABEL } from "@/lib/schemas/proposal";

export type TimelineEventKind =
  | "call_planned"
  | "call_completed"
  | "proposal"
  | "audit";

export type TimelineEventTone = "good" | "warn" | "bad" | "info" | "neutral";

export type TimelineEvent = {
  id: string;
  kind: TimelineEventKind;
  occurredAt: number;
  title: string;
  subtitle: string | null;
  href: string;
  tone: TimelineEventTone;
};

const AUDIT_TONE: Record<"Healthy" | "At risk" | "Critical", TimelineEventTone> = {
  Healthy: "good",
  "At risk": "warn",
  Critical: "bad",
};

function truncate(s: string, n: number): string {
  if (s.length <= n) return s;
  return s.slice(0, n - 1).trimEnd() + "…";
}

export async function getClientTimeline(clientId: string): Promise<TimelineEvent[]> {
  const [callRows, proposalRows, auditRows] = await Promise.all([
    db
      .select({
        id: calls.id,
        status: calls.status,
        scheduledAt: calls.scheduledAt,
        startedAt: calls.startedAt,
        endedAt: calls.endedAt,
        analyzedAt: calls.analyzedAt,
        outcome: calls.outcome,
        nextStep: calls.nextStep,
      })
      .from(calls)
      .where(eq(calls.clientId, clientId))
      .orderBy(desc(calls.startedAt)),
    db
      .select({
        id: proposals.id,
        generatedAt: proposals.generatedAt,
        cohortSize: proposals.cohortSize,
        totalCents: proposals.totalCents,
        venue: proposals.venue,
      })
      .from(proposals)
      .where(eq(proposals.clientId, clientId))
      .orderBy(desc(proposals.generatedAt)),
    db
      .select({
        id: healthChecks.id,
        generatedAt: healthChecks.generatedAt,
        overallScore: healthChecks.overallScore,
        status: healthChecks.status,
        summary: healthChecks.summary,
      })
      .from(healthChecks)
      .where(eq(healthChecks.clientId, clientId))
      .orderBy(desc(healthChecks.generatedAt)),
  ]);

  const events: TimelineEvent[] = [];

  for (const c of callRows) {
    const planned = c.status === "planned" || c.status === "scheduled";
    const occurredAt =
      c.analyzedAt ?? c.endedAt ?? (planned ? c.scheduledAt ?? c.startedAt : c.startedAt);
    const outcomeLabel =
      c.outcome && OUTCOME_LABEL[c.outcome as keyof typeof OUTCOME_LABEL]
        ? OUTCOME_LABEL[c.outcome as keyof typeof OUTCOME_LABEL]
        : planned
          ? "Planned call"
          : "Call";
    const tone: TimelineEventTone = planned
      ? "info"
      : c.outcome && OUTCOME_TONE[c.outcome as keyof typeof OUTCOME_TONE]
        ? OUTCOME_TONE[c.outcome as keyof typeof OUTCOME_TONE]
        : "neutral";
    events.push({
      id: `call-${c.id}`,
      kind: planned ? "call_planned" : "call_completed",
      occurredAt,
      title: planned ? "Planned call" : `Call · ${outcomeLabel}`,
      subtitle: c.nextStep ?? null,
      href: `/calls/${c.id}`,
      tone,
    });
  }

  for (const p of proposalRows) {
    events.push({
      id: `proposal-${p.id}`,
      kind: "proposal",
      occurredAt: p.generatedAt,
      title: `Proposal · ${p.cohortSize} pax · ${formatMoneyExact(p.totalCents)} invoiced`,
      subtitle: VENUE_LABEL[p.venue],
      href: `/clients/${clientId}`,
      tone: "info",
    });
  }

  for (const a of auditRows) {
    const tone =
      AUDIT_TONE[a.status as keyof typeof AUDIT_TONE] ?? "neutral";
    events.push({
      id: `audit-${a.id}`,
      kind: "audit",
      occurredAt: a.generatedAt,
      title: `Readiness audit · ${a.overallScore} · ${a.status}`,
      subtitle: truncate(a.summary, 120),
      href: `/clients/${clientId}/health-check`,
      tone,
    });
  }

  events.sort((a, b) => b.occurredAt - a.occurredAt);
  return events;
}
