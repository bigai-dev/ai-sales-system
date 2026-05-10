import { desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { reps } from "@/db/schema";

export type PrimaryRep = {
  initials: string;
  name: string;
  role: string;
};

export async function getPrimaryRep(): Promise<PrimaryRep> {
  const [primary] = await db
    .select({ initials: reps.initials, name: reps.name })
    .from(reps)
    .where(eq(reps.isPrimary, true))
    .orderBy(desc(reps.createdAt))
    .limit(1);

  if (primary) {
    return { initials: primary.initials, name: primary.name, role: "Founder" };
  }

  const [fallback] = await db
    .select({ initials: reps.initials, name: reps.name })
    .from(reps)
    .orderBy(desc(reps.createdAt))
    .limit(1);

  if (fallback) {
    return { initials: fallback.initials, name: fallback.name, role: "Founder" };
  }

  return { initials: "?", name: "—", role: "—" };
}

/**
 * Returns the rep ID that owns the current request. Today this is just the
 * primary rep (single-user system). When auth lands, swap the body to read
 * from the session — every caller already routes through here, so the change
 * is a one-liner. Don't bypass this helper; that's the seam.
 */
export async function getCurrentRepId(): Promise<string | null> {
  const [primary] = await db
    .select({ id: reps.id })
    .from(reps)
    .where(eq(reps.isPrimary, true))
    .limit(1);
  if (primary) return primary.id;
  const [fallback] = await db.select({ id: reps.id }).from(reps).limit(1);
  return fallback?.id ?? null;
}
