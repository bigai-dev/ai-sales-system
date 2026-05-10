"use server";
import { generateText, Output } from "ai";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { chat } from "./deepseek";
import { scrub, scrubObject } from "./scrub";
import { extractDiscovery, DISCOVERY_PRIMER } from "./client-discovery";
import { db } from "@/db/client";
import { clients, calls, deals } from "@/db/schema";
import {
  callDebriefSchema,
  type CallDebrief,
} from "@/lib/schemas/call-debrief";
import type { Result } from "@/lib/types";

const SYSTEM_PROMPT = `You are analyzing a sales-call debrief written by a
Malaysian solo founder selling 2-day vibe-coding workshops (RM 3,500/pax + 8% SST).

You will be given:
- the client's metadata + current SPANCO stage
- the rep's raw notes from the call (free-form text, may be terse)

Extract structured data from the notes. Be conservative: do NOT invent things
the rep didn't write. If the notes say nothing about budget, leave commitments
empty and don't speculate.

Outcome rules:
- "no_answer" / "voicemail" → use ONLY if the rep explicitly says they didn't reach the prospect
- "rescheduled" → call moved to a future date
- "follow_up" → conversation happened but more steps needed
- "closed_won" → invoice agreed / dates locked
- "closed_lost" → prospect declined
- "connected" → conversation happened with no clear next-step categorization

Objection categorization (content / budget / venue / time / other):
- content = teaching curriculum concerns
- budget = pricing or PO process
- venue = on-site vs remote logistics
- time = scheduling, duration, day of week

For suggestedStage, take the client's current stage as input and recommend
either same stage (no movement) or the next forward stage (S→P→A→N→C→O). Do not
recommend skipping stages.

For coachingNote, find ONE specific behavior to call out — a strength to repeat
or a gap to fix. Be concrete (reference what the rep wrote), not generic.

When extracting commitments and assessing the call, cross-reference the
"discovery" object — if the rep mentioned something that maps to a known goal
or pain point, surface that explicitly.

If a "briefing" object is present in the context, it was the AI's pre-call plan
for this exact conversation. Evaluate the call against it explicitly:
- Did the rep land the briefing's nextStageMove? If not, suggestedStage should
  reflect what was actually achieved (often same stage, sometimes regression).
- Did any of the briefing's expectedObjections actually surface? If they did,
  list them in objectionsRaised. If a major one did NOT surface, mention this
  in coachingNote ("budget never came up — must address before proposal").
- Did the rep get answers to the briefing's discoveryQuestions? If a critical
  one was missed, the coachingNote should call it out.

${DISCOVERY_PRIMER}

Respond ONLY with JSON conforming to the schema. No code fences.`;

async function loadDebriefContext(callId: string) {
  const [call] = await db.select().from(calls).where(eq(calls.id, callId));
  if (!call) throw new Error("Call not found");
  if (!call.notes || call.notes.trim().length < 10) {
    throw new Error("Notes are too short to analyze (need at least 10 chars)");
  }
  if (!call.clientId) throw new Error("Call is not scoped to a client");

  const [client] = await db.select().from(clients).where(eq(clients.id, call.clientId));
  if (!client) throw new Error("Client not found");

  const clientDeals = await db
    .select({
      stage: deals.stage,
      headcount: deals.headcount,
      lastActivityAt: deals.lastActivityAt,
    })
    .from(deals)
    .where(eq(deals.clientId, call.clientId));
  const openDeal = clientDeals
    .filter((d) => d.stage !== "O")
    .sort((a, b) => (b.lastActivityAt ?? 0) - (a.lastActivityAt ?? 0))[0];

  // Strip names+ids from the briefing before sending — preserve only the planning
  // signal (stage move, objections, questions) so the AI evaluates against intent.
  const briefingForContext = call.briefing
    ? {
        context: call.briefing.context,
        nextStageMove: call.briefing.nextStageMove,
        discoveryQuestions: call.briefing.discoveryQuestions.map((q) => q.question),
        expectedObjections: call.briefing.expectedObjections.map((o) => ({
          category: o.category,
          objection: o.objection,
        })),
        watchouts: call.briefing.watchouts,
      }
    : null;

  return {
    clientId: call.clientId,
    context: scrubObject({
      client: {
        name: client.name,
        industry: client.industry,
        size: client.size,
        employees: client.employees,
        devCount: client.devCount,
        currentStage: client.stage,
      },
      discovery: extractDiscovery(client),
      briefing: briefingForContext,
      openDealStage: openDeal?.stage ?? null,
      openDealHeadcount: openDeal?.headcount ?? null,
      today: new Date().toISOString().slice(0, 10),
    }),
    notes: scrub(call.notes),
  };
}

export async function analyzeCallDebrief(callId: string): Promise<Result<CallDebrief>> {
  let context: Awaited<ReturnType<typeof loadDebriefContext>>;
  try {
    context = await loadDebriefContext(callId);
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }

  let debrief: CallDebrief;
  try {
    const result = await generateText({
      model: chat,
      output: Output.object({ schema: callDebriefSchema }),
      system: SYSTEM_PROMPT,
      prompt: `Context:\n${JSON.stringify(context.context, null, 2)}\n\nRep notes:\n"""\n${context.notes}\n"""\n\nProduce the debrief.`,
      maxOutputTokens: 1500,
    });
    debrief = result.output as CallDebrief;
  } catch (e) {
    return { ok: false, error: `LLM call failed: ${(e as Error).message}` };
  }

  await db
    .update(calls)
    .set({
      debrief,
      outcome: debrief.outcome,
      nextStep: debrief.nextStep,
      suggestedStage: debrief.suggestedStage,
      summary: debrief.summary,
      analyzedAt: Date.now(),
      status: "completed",
      endedAt: Date.now(),
    })
    .where(eq(calls.id, callId));
  revalidatePath(`/calls/${callId}`);
  revalidatePath("/calls");
  revalidatePath(`/clients/${context.clientId}`);
  revalidatePath("/today");
  revalidatePath("/");
  return { ok: true, data: debrief };
}

export async function saveCallNotes(
  callId: string,
  notes: string,
): Promise<Result> {
  const trimmed = notes.trimEnd();
  await db.update(calls).set({ notes: trimmed }).where(eq(calls.id, callId));
  revalidatePath(`/calls/${callId}`);
  return { ok: true };
}
