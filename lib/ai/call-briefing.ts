"use server";
import { generateText, Output } from "ai";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { chat } from "./deepseek";
import { scrubObject } from "./scrub";
import { extractDiscovery, DISCOVERY_PRIMER } from "./client-discovery";
import { db } from "@/db/client";
import { clients, deals, calls } from "@/db/schema";
import { getLatestHealthCheck } from "@/lib/queries/health";
import {
  callBriefingSchema,
  type CallBriefing,
} from "@/lib/schemas/call-briefing";
import type { Result } from "@/lib/types";

const SYSTEM_PROMPT = `You are prepping a Malaysian solo founder for a sales call
about a 2-day vibe-coding workshop (RM 3,500/pax + 8% SST).

Workshop SOP — the rep MUST cover three discovery questions:
1. How many people will attend?
2. What is their AI knowledge level?
3. What is their budget?

SPANCO stages: S=Suspect, P=Prospect (interested), A=Analysis (discovery captured),
N=Negotiation (proposal sent), C=Conclusion (verbal yes), O=Order (paid).

Common objections fall into four buckets: content, budget, venue, time.

Given the client's metadata, latest readiness audit (if any), and current open
deal context, produce a tight pre-call briefing. The rep has ~2 minutes to read
this before dialling — be specific and short, no filler.

Tailor the discovery questions to THIS client (e.g. if employees=200 and
devCount=15, ask about expansion to non-engineers; if audit shows low Adoption,
probe whether they want intensive Day-1 weighting).

If callSchedule.hoursUntilCall is small (under 24), favor watchouts about
short-notice risks (decision-makers may not be on the call, prep time limited
for the prospect, etc.). If it's large, more strategic watchouts apply.

For expectedObjections, predict 1-3 most likely from the audit + stage:
- Stage S/P → mostly content/time objections
- Stage A → mostly budget objections
- Stage N → mostly venue/time logistics

The nextStageMove must be one stage ahead of the client's current SPANCO stage
(or same stage if it's stuck). 'what' is the verbatim commitment to extract.

${DISCOVERY_PRIMER}

Respond ONLY with JSON conforming to the schema. No code fences. No commentary.`;

async function loadCallContext(callId: string) {
  const [call] = await db.select().from(calls).where(eq(calls.id, callId));
  if (!call) throw new Error("Call not found");
  if (!call.clientId) throw new Error("Call is not scoped to a client");

  const [client] = await db.select().from(clients).where(eq(clients.id, call.clientId));
  if (!client) throw new Error("Client not found");

  const audit = await getLatestHealthCheck(call.clientId);

  const clientDeals = await db
    .select()
    .from(deals)
    .where(eq(deals.clientId, call.clientId));
  const openDeal = clientDeals
    .filter((d) => d.stage !== "O")
    .sort((a, b) => (b.lastActivityAt ?? 0) - (a.lastActivityAt ?? 0))[0];

  // Most recent prior debrief on this client, for continuity.
  const priorCalls = await db
    .select({
      summary: calls.summary,
      debrief: calls.debrief,
      outcome: calls.outcome,
      analyzedAt: calls.analyzedAt,
    })
    .from(calls)
    .where(eq(calls.clientId, call.clientId))
    .orderBy(desc(calls.analyzedAt))
    .limit(3);

  return {
    clientId: call.clientId,
    context: scrubObject({
      client: {
        name: client.name,
        industry: client.industry,
        size: client.size,
        employees: client.employees,
        devCount: client.devCount,
        stage: client.stage,
      },
      discovery: extractDiscovery(client),
      callSchedule: {
        scheduledAt: call.scheduledAt
          ? new Date(call.scheduledAt).toISOString()
          : null,
        hoursUntilCall: call.scheduledAt
          ? Math.round((call.scheduledAt - Date.now()) / 3_600_000)
          : null,
      },
      audit: audit
        ? {
            overallScore: audit.overall.score,
            status: audit.overall.status,
            summary: audit.summary,
            dimensions: audit.dimensions.map((d) => ({
              name: d.name,
              score: d.score,
              status: d.status,
            })),
            topRisks: audit.risks.slice(0, 3).map((r) => r.title),
          }
        : null,
      openDeal: openDeal
        ? {
            stage: openDeal.stage,
            headcount: openDeal.headcount,
            tags: openDeal.tags,
            nextStep: openDeal.nextStep,
            lastActivity: openDeal.lastActivity,
          }
        : null,
      priorCalls: priorCalls
        .filter((c) => c.analyzedAt !== null)
        .map((c) => ({
          outcome: c.outcome,
          summary: c.debrief?.summary ?? c.summary,
          nextStep: c.debrief?.nextStep,
        })),
      today: new Date().toISOString().slice(0, 10),
    }),
  };
}

export async function generateCallBriefing(callId: string): Promise<Result<CallBriefing>> {
  let context: Awaited<ReturnType<typeof loadCallContext>>;
  try {
    context = await loadCallContext(callId);
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }

  let briefing: CallBriefing;
  try {
    const result = await generateText({
      model: chat,
      output: Output.object({ schema: callBriefingSchema }),
      system: SYSTEM_PROMPT,
      prompt: `Client + audit + open deal + prior calls:\n${JSON.stringify(context.context, null, 2)}\n\nProduce the briefing now.`,
      maxOutputTokens: 1500,
    });
    briefing = callBriefingSchema.parse(result.output);
  } catch (e) {
    return { ok: false, error: `LLM call failed: ${(e as Error).message}` };
  }

  await db.update(calls).set({ briefing }).where(eq(calls.id, callId));
  revalidatePath(`/calls/${callId}`);
  revalidatePath("/today");
  // Briefing presence affects the take_call task's suggestion ("no briefing —
  // generate one first") and the timeline on the client page.
  if (context.clientId) revalidatePath(`/clients/${context.clientId}`);
  return { ok: true, data: briefing };
}
