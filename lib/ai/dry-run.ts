"use server";

import { generateText } from "ai";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { createId } from "@paralleldrive/cuid2";
import { chat } from "./deepseek";
import { generateDryRunPack } from "./scenario-generator";
import { gradeDryRunMoment } from "./response-grader";
import { db } from "@/db/client";
import { calls, clients } from "@/db/schema";
import {
  callDryRunSchema,
  type CallDryRun,
  type DryRunMoment,
} from "@/lib/schemas/dry-run";
import type { DrillBucket } from "@/lib/schemas/drill";
import type { Result } from "@/lib/types";

// Step 1: Generate the 3-moment pack and persist a "draft" dryRun on the
// call so the modal can be re-opened mid-flow without losing work.
export async function startDryRun(callId: string): Promise<Result<CallDryRun>> {
  const [call] = await db
    .select({ briefing: calls.briefing, clientId: calls.clientId })
    .from(calls)
    .where(eq(calls.id, callId));
  if (!call) return { ok: false, error: "Call not found." };
  if (!call.briefing) {
    return { ok: false, error: "Generate a briefing first — Dry Run reads from it." };
  }
  if (!call.clientId) return { ok: false, error: "Call is not scoped to a client." };

  const [client] = await db
    .select({
      name: clients.name,
      industry: clients.industry,
      size: clients.size,
      employees: clients.employees,
      devCount: clients.devCount,
    })
    .from(clients)
    .where(eq(clients.id, call.clientId));
  if (!client) return { ok: false, error: "Client not found." };

  const pack = await generateDryRunPack({
    briefing: call.briefing,
    clientName: client.name,
    industry: client.industry,
    size: client.size,
    employees: client.employees,
    devCount: client.devCount,
  });
  if (!pack.ok) return pack;

  const dryRun: CallDryRun = {
    generatedAt: Date.now(),
    takeaway: "",
    moments: pack.data.moments.map((m) => ({
      momentId: createId(),
      bucket: m.bucket,
      prompt: m.prompt,
      rubric: m.rubric,
      repResponse: "",
      grade: null,
      feedback: "",
    })),
  };

  await db.update(calls).set({ dryRun }).where(eq(calls.id, callId));
  revalidatePath(`/calls/${callId}`);
  return { ok: true, data: dryRun };
}

// Step 2: User has filled in the 3 textareas. Grade all 3 in parallel,
// compute a 1-line takeaway, persist, and return the graded pack.
export async function gradeDryRun(args: {
  callId: string;
  responses: { momentId: string; repResponse: string }[];
}): Promise<Result<CallDryRun>> {
  const { callId, responses } = args;
  const [call] = await db
    .select({ dryRun: calls.dryRun })
    .from(calls)
    .where(eq(calls.id, callId));
  if (!call?.dryRun) return { ok: false, error: "No dry run in progress." };

  const draft = call.dryRun;
  const responseByMoment = new Map(responses.map((r) => [r.momentId, r.repResponse.trim()]));

  // Grade all 3 in parallel.
  const graded = await Promise.all(
    draft.moments.map(async (m) => {
      const rep = responseByMoment.get(m.momentId) ?? m.repResponse;
      if (!rep) {
        return {
          ...m,
          repResponse: "",
          grade: 0,
          feedback: "No response written.",
        };
      }
      const result = await gradeDryRunMoment({
        bucket: m.bucket as DrillBucket,
        scenarioPrompt: m.prompt,
        rubric: m.rubric,
        repResponse: rep,
      });
      if (!result.ok) {
        return { ...m, repResponse: rep, grade: 0, feedback: result.error };
      }
      return {
        ...m,
        repResponse: rep,
        grade: result.data.grade,
        feedback: result.data.feedback,
      };
    }),
  );

  const takeaway = await summarizeDryRun(graded);
  const finalPack: CallDryRun = {
    ...draft,
    moments: graded,
    takeaway,
  };
  // Validate before writing — guards against schema drift.
  callDryRunSchema.parse(finalPack);

  await db.update(calls).set({ dryRun: finalPack }).where(eq(calls.id, callId));
  revalidatePath(`/calls/${callId}`);
  return { ok: true, data: finalPack };
}

async function summarizeDryRun(moments: DryRunMoment[]): Promise<string> {
  const lowest = [...moments].sort((a, b) => (a.grade ?? 0) - (b.grade ?? 0))[0];
  const others = moments.filter((m) => m.momentId !== lowest.momentId);
  try {
    const res = await generateText({
      model: chat,
      system:
        "Write a single sentence (max 240 chars) reminding the rep what to remember when they dial in. Reference the WEAKEST moment. No fluff, no greeting.",
      prompt: `Weakest moment (${lowest.bucket}, grade ${lowest.grade}): "${lowest.prompt}"
Rep's response: "${lowest.repResponse.slice(0, 220)}"
Feedback: ${lowest.feedback}
Other moments graded ${others.map((o) => o.grade).join(", ")}.

Write the takeaway sentence:`,
      maxOutputTokens: 100,
    });
    return res.text.trim().slice(0, 280);
  } catch {
    return `Watch the ${lowest.bucket} moment — that was your weakest at ${lowest.grade}.`;
  }
}
