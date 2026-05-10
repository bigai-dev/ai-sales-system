"use server";
import { eq } from "drizzle-orm";
import { revalidatePath, revalidateTag } from "next/cache";
import { db } from "@/db/client";
import { proposals } from "@/db/schema";
import type { Result } from "@/lib/types";

export async function deleteProposal(id: string): Promise<Result> {
  const [row] = await db
    .select({ clientId: proposals.clientId })
    .from(proposals)
    .where(eq(proposals.id, id));
  if (!row) return { ok: false, error: "Proposal not found" };

  await db.delete(proposals).where(eq(proposals.id, id));
  revalidateTag("proposals", "default");
  revalidatePath(`/clients/${row.clientId}`);
  revalidatePath("/today");
  return { ok: true };
}
