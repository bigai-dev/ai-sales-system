"use server";
import { generateText, Output } from "ai";
import { desc, eq } from "drizzle-orm";
import { chat } from "./deepseek";
import { scrubObject } from "./scrub";
import { extractDiscovery, DISCOVERY_PRIMER } from "./client-discovery";
import { db } from "@/db/client";
import { calls, clients, proposals } from "@/db/schema";
import { formatMoneyExact } from "@/db/lib/money";
import { VENUE_LABEL } from "@/lib/schemas/proposal";
import { emailDraftSchema, type EmailDraft } from "@/lib/schemas/email-draft";
import type { Result } from "@/lib/types";

const SYSTEM_PROMPT = `You are drafting a sales follow-up email on behalf of a
Malaysian solo founder selling 2-day vibe-coding workshops (RM 3,500/pax + 8% SST).

You will be given:
- the call's debrief (outcome, summary, objections raised, commitments, next-step, suggested SPANCO move)
- the client's metadata + current SPANCO stage
- the latest proposal for this client (if one exists)
- short summaries of recent prior calls for continuity

Write ONE email that the rep will copy-paste into Gmail.

Hard rules:
- No "Hope this finds you well" or similar empty openers.
- No marketing language ("synergize", "leverage", "world-class").
- British / Malaysian English spelling.
- Reference 1-2 specific things from the debrief — use the prospect's wording
  where it reads naturally. This proves the rep listened.
- Restate the next-step commitment from the debrief verbatim, with timing if
  known (e.g. "by end of this week", "by Friday").
- If a proposal exists for this client, mention it's attached and reference
  cohort size + total. Set attachmentNote to a one-line description.
- If no proposal exists, do not mention attachments. Set attachmentNote to "".
- End with a clear single ask (e.g. "Could you confirm by Wednesday?").
- Address the prospect by their first name (extract from contactName).
- Sign off as the rep (no signature block — the rep will append their own).
- Subject is concise: workshop reference + company name + the action.

Plain text only — no HTML, no markdown formatting (no **bold**, no headers, no lists with
- characters). Use blank lines between paragraphs.

Anchor the opening to call recency naturally based on callTiming.daysSinceCall:
- 0 days → "thanks for the call earlier" / "thanks for hopping on today"
- 1 day → "thanks for the call yesterday"
- 2-6 days → "thanks for the call last [Mon|Tue|...]" or "earlier this week"
- 7-13 days → "thanks for the call last week"
- 14+ days → drop the time anchor; lead with re-establishing context ("circling
  back on our conversation about X")
Don't force a temporal opener if it reads stilted.

When the discovery profile names a champion, you MAY address them specifically
("Hi Jane — sharing this so you can forward to the team"). When it names a
blocker, address their concern directly in the body. When goals or pain points
are listed, ground the email's value statement in those exact words.

${DISCOVERY_PRIMER}

Respond ONLY with JSON conforming to the schema. No code fences, no commentary.`;

async function loadEmailContext(callId: string) {
  const [call] = await db.select().from(calls).where(eq(calls.id, callId));
  if (!call) throw new Error("Call not found");
  if (!call.debrief) throw new Error("Call has not been debriefed yet");
  if (!call.clientId) throw new Error("Call is not scoped to a client");

  const [client] = await db
    .select()
    .from(clients)
    .where(eq(clients.id, call.clientId));
  if (!client) throw new Error("Client not found");

  const [latestProposal] = await db
    .select({
      id: proposals.id,
      cohortSize: proposals.cohortSize,
      totalCents: proposals.totalCents,
      venue: proposals.venue,
      generatedAt: proposals.generatedAt,
    })
    .from(proposals)
    .where(eq(proposals.clientId, call.clientId))
    .orderBy(desc(proposals.generatedAt))
    .limit(1);

  const priorCalls = await db
    .select({
      summary: calls.summary,
      outcome: calls.outcome,
      analyzedAt: calls.analyzedAt,
    })
    .from(calls)
    .where(eq(calls.clientId, call.clientId))
    .orderBy(desc(calls.analyzedAt))
    .limit(4);

  const callAt = call.startedAt ?? call.analyzedAt ?? Date.now();
  const daysSinceCall = Math.floor((Date.now() - callAt) / 86_400_000);

  return scrubObject({
    client: {
      name: client.name,
      contactName: client.contactName,
      contactRole: client.contactRole,
      currentStage: client.stage,
    },
    discovery: extractDiscovery(client),
    callTiming: {
      callDate: new Date(callAt).toISOString().slice(0, 10),
      daysSinceCall,
    },
    debrief: call.debrief,
    latestProposal: latestProposal
      ? {
          cohortSize: latestProposal.cohortSize,
          totalInvoiced: formatMoneyExact(latestProposal.totalCents),
          venue: VENUE_LABEL[latestProposal.venue],
        }
      : null,
    priorCalls: priorCalls
      .filter((c) => c.analyzedAt && c.analyzedAt !== call.analyzedAt)
      .slice(0, 3)
      .map((c) => ({ outcome: c.outcome, summary: c.summary })),
    today: new Date().toISOString().slice(0, 10),
  });
}

export async function draftFollowupEmail(
  callId: string,
): Promise<Result<EmailDraft>> {
  let context: Awaited<ReturnType<typeof loadEmailContext>>;
  try {
    context = await loadEmailContext(callId);
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }

  try {
    const result = await generateText({
      model: chat,
      output: Output.object({ schema: emailDraftSchema }),
      system: SYSTEM_PROMPT,
      prompt: `Context:\n${JSON.stringify(context, null, 2)}\n\nDraft the follow-up email now.`,
      maxOutputTokens: 1500,
    });
    return { ok: true, data: result.output as EmailDraft };
  } catch (e) {
    return { ok: false, error: `LLM call failed: ${(e as Error).message}` };
  }
}
