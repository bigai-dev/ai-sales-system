"use server";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db/client";
import { calls, clients, deals } from "@/db/schema";
import type { Result } from "@/lib/types";
import { getCurrentRepId } from "@/lib/queries/reps";

export async function createCallForClient(formData: FormData): Promise<void> {
  const clientId = String(formData.get("clientId") ?? "");
  if (!clientId) throw new Error("Missing clientId");

  // scheduledAt comes from a <input type="datetime-local"> in the Plan-Call
  // modal. The browser submits it as "YYYY-MM-DDTHH:mm" in the user's local
  // timezone; new Date() parses that as local time. Fall back to now if the
  // field is missing (e.g. an older form / programmatic caller).
  const scheduledAtRaw = String(formData.get("scheduledAt") ?? "").trim();
  const parsed = scheduledAtRaw ? new Date(scheduledAtRaw).getTime() : NaN;
  const scheduledAt = Number.isFinite(parsed) ? parsed : Date.now();

  const [client] = await db
    .select({ id: clients.id })
    .from(clients)
    .where(eq(clients.id, clientId));
  if (!client) throw new Error("Client not found");

  const openDeal = await db
    .select({ id: deals.id })
    .from(deals)
    .where(eq(deals.clientId, clientId))
    .orderBy(desc(deals.lastActivityAt))
    .limit(1);

  const repId = await getCurrentRepId();

  const [row] = await db
    .insert(calls)
    .values({
      clientId,
      dealId: openDeal[0]?.id ?? null,
      repId,
      status: "planned",
      scheduledAt,
      // startedAt has a NOT NULL constraint with a default of `Date.now()`.
      // We don't override it — the planned-list sort uses `scheduledAt`, so
      // `startedAt` can keep its real meaning ("the actual time the call
      // session was opened") which is "now" at creation time.
    })
    .returning({ id: calls.id });

  revalidatePath("/calls");
  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/today");
  redirect(`/calls/${row.id}`);
}

export async function deleteCall(callId: string): Promise<Result> {
  const [row] = await db
    .select({ clientId: calls.clientId })
    .from(calls)
    .where(eq(calls.id, callId));
  if (!row) return { ok: false, error: "Call not found" };

  await db.delete(calls).where(eq(calls.id, callId));
  revalidatePath("/calls");
  if (row.clientId) revalidatePath(`/clients/${row.clientId}`);
  revalidatePath("/today");
  return { ok: true };
}
