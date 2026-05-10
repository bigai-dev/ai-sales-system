import { desc, isNotNull } from "drizzle-orm";
import { db } from "@/db/client";
import { calls, clients } from "@/db/schema";

export type DemoTargets = {
  clientId: string | null;
  callId: string | null;
};

// Picks the demo anchor: prefers the most recent *debriefed* call (so the
// debrief panel step has real content). Falls back to most recent call, then
// to the first client. Returns nulls only if the DB is completely empty.
export async function getDemoTargets(): Promise<DemoTargets> {
  const [debriefed] = await db
    .select({ id: calls.id, clientId: calls.clientId })
    .from(calls)
    .where(isNotNull(calls.analyzedAt))
    .orderBy(desc(calls.analyzedAt))
    .limit(1);

  if (debriefed?.clientId) {
    return { clientId: debriefed.clientId, callId: debriefed.id };
  }

  const [recent] = await db
    .select({ id: calls.id, clientId: calls.clientId })
    .from(calls)
    .orderBy(desc(calls.startedAt))
    .limit(1);

  if (recent?.clientId) {
    return { clientId: recent.clientId, callId: recent.id };
  }

  const [client] = await db.select({ id: clients.id }).from(clients).limit(1);
  return { clientId: client?.id ?? null, callId: null };
}
