"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { taskDismissals, scratchNotes } from "@/db/schema";

import { DAY_MS } from "@/lib/format/time";

const SNOOZE_PRESETS: Record<string, number> = {
  "4h": 4 * 60 * 60 * 1000,
  "1d": DAY_MS,
  "3d": 3 * DAY_MS,
  "1w": 7 * DAY_MS,
};

export async function snoozeTask(formData: FormData) {
  const taskId = String(formData.get("taskId") ?? "").trim();
  const preset = String(formData.get("preset") ?? "1d");
  if (!taskId) return;
  const ms = SNOOZE_PRESETS[preset] ?? DAY_MS;
  await db.insert(taskDismissals).values({
    taskId,
    snoozedUntil: Date.now() + ms,
    reason: preset,
  });
  revalidatePath("/today");
}

export async function captureScratch(formData: FormData) {
  const body = String(formData.get("body") ?? "").trim();
  if (!body) return;
  const dueAtStr = String(formData.get("dueAt") ?? "").trim();
  const dueAt = dueAtStr ? new Date(dueAtStr).getTime() : null;
  await db.insert(scratchNotes).values({
    body,
    dueAt: dueAt ?? null,
  });
  revalidatePath("/today");
}

export async function completeScratch(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;
  await db.update(scratchNotes).set({ doneAt: Date.now() }).where(eq(scratchNotes.id, id));
  revalidatePath("/today");
}
