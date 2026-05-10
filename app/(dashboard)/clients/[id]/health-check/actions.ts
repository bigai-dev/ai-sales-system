"use server";
import { revalidatePath } from "next/cache";
import { runHealthCheck } from "@/lib/ai/health-check";
import type { Result } from "@/lib/types";

export async function generateHealthCheck(clientId: string): Promise<Result<{ id: string }>> {
  const res = await runHealthCheck(clientId);
  if (res.ok) {
    revalidatePath(`/clients/${clientId}/health-check`);
    revalidatePath(`/clients/${clientId}`);
    revalidatePath("/health-check");
  }
  return res;
}
