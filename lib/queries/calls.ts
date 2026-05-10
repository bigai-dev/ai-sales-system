import { desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { calls, clients } from "@/db/schema";

export async function getCallById(id: string) {
  const [row] = await db.select().from(calls).where(eq(calls.id, id));
  if (!row) return null;

  let clientName: string | null = null;
  if (row.clientId) {
    const [c] = await db
      .select({ name: clients.name })
      .from(clients)
      .where(eq(clients.id, row.clientId));
    clientName = c?.name ?? null;
  }

  return { ...row, clientName };
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
