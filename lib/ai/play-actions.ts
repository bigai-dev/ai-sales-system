"use server";

import { eq } from "drizzle-orm";
import { revalidatePath, revalidateTag } from "next/cache";
import { db } from "@/db/client";
import { plays } from "@/db/schema";
import type { Result } from "@/lib/types";

export async function togglePinPlay(playId: string): Promise<Result<{ pinned: boolean }>> {
  const [row] = await db.select({ pinned: plays.pinned }).from(plays).where(eq(plays.id, playId));
  if (!row) return { ok: false, error: "Play not found." };
  const next = !row.pinned;
  await db.update(plays).set({ pinned: next }).where(eq(plays.id, playId));
  revalidateTag("plays", "default");
  revalidatePath("/training/playbook");
  revalidatePath(`/training/playbook/${playId}`);
  revalidatePath("/training");
  return { ok: true, data: { pinned: next } };
}

export async function toggleHidePlay(playId: string): Promise<Result<{ hidden: boolean }>> {
  const [row] = await db.select({ hidden: plays.hidden }).from(plays).where(eq(plays.id, playId));
  if (!row) return { ok: false, error: "Play not found." };
  const next = !row.hidden;
  await db.update(plays).set({ hidden: next }).where(eq(plays.id, playId));
  revalidateTag("plays", "default");
  revalidatePath("/training/playbook");
  revalidatePath(`/training/playbook/${playId}`);
  return { ok: true, data: { hidden: next } };
}
