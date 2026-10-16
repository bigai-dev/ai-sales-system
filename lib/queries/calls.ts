import { desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { calls, clients } from "@/db/schema";

export async function getCallById(id: string) {
  const [row] = await db
    .select({ call: calls, clientName: clients.name })
    .from(calls)
    .leftJoin(clients, eq(calls.clientId, clients.id))
    .where(eq(calls.id, id));
  if (!row) return null;
  return { ...row.call, clientName: row.clientName };
}

export type CallListItem = {
  id: string;
  clientId: string | null;
  clientName: string | null;
  status: typeof calls.$inferSelect.status;
  outcome: typeof calls.$inferSelect.outcome;
  scheduledAt: number | null;
  startedAt: number;
  endedAt: number | null;
  nextStep: string | null;
};

export async function getRecentCalls(limit = 50): Promise<CallListItem[]> {
  const rows = await db
    .select({
      id: calls.id,
      clientId: calls.clientId,
      clientName: clients.name,
      status: calls.status,
      outcome: calls.outcome,
      scheduledAt: calls.scheduledAt,
      startedAt: calls.startedAt,
      endedAt: calls.endedAt,
      nextStep: calls.nextStep,
    })
    .from(calls)
    .leftJoin(clients, eq(calls.clientId, clients.id))
    .orderBy(desc(calls.startedAt))
    .limit(limit);
  return rows;
}

export async function getCallsByClient(clientId: string): Promise<CallListItem[]> {
  const rows = await db
    .select({
      id: calls.id,
      clientId: calls.clientId,
      clientName: clients.name,
      status: calls.status,
      outcome: calls.outcome,
      scheduledAt: calls.scheduledAt,
      startedAt: calls.startedAt,
      endedAt: calls.endedAt,
      nextStep: calls.nextStep,
    })
    .from(calls)
    .leftJoin(clients, eq(calls.clientId, clients.id))
    .where(eq(calls.clientId, clientId))
    .orderBy(desc(calls.startedAt));
  return rows;
}

export type WeeklyCalls = { label: string; planned: number; completed: number };

/** Calls per week for the last `weeks` weeks (oldest first), for the dashboard chart. */
export async function getCallsPerWeek(weeks = 8): Promise<WeeklyCalls[]> {
  const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
  const now = Date.now();
  const start = now - weeks * WEEK_MS;
  const rows = await db
    .select({ status: calls.status, startedAt: calls.startedAt, scheduledAt: calls.scheduledAt })
    .from(calls);
  const out: WeeklyCalls[] = Array.from({ length: weeks }, (_, i) => {
    const weekStart = new Date(start + i * WEEK_MS);
    return {
      label: weekStart.toLocaleDateString("en-MY", { day: "numeric", month: "short" }),
      planned: 0,
      completed: 0,
    };
  });
  for (const r of rows) {
    const ts = r.scheduledAt ?? r.startedAt;
    if (ts < start || ts > now + WEEK_MS) continue;
    const idx = Math.min(weeks - 1, Math.max(0, Math.floor((ts - start) / WEEK_MS)));
    if (r.status === "completed" || r.status === "ended") out[idx].completed += 1;
    else out[idx].planned += 1;
  }
  return out;
}
