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
