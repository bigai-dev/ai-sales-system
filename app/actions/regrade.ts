"use server";
import { revalidatePath } from "next/cache";
import { gradeRecentClosingCalls } from "@/lib/ai/grade-calls";

export async function regradeCalls() {
  const r = await gradeRecentClosingCalls(20);
  if (r.ok) revalidatePath("/", "layout");
  return r;
}
