import type { clients } from "@/db/schema";

type ClientRow = typeof clients.$inferSelect;
type DecisionMaker = {
  name: string;
  role: string;
  stance: "champion" | "neutral" | "blocker";
};

/**
 * Extracts the founder's discovery profile for a client into a compact AI context
 * block. Skips fields that are null/empty so the LLM doesn't waste attention on
 * "goals: null". Returns null entirely if the founder hasn't filled anything in.
 *
 * Used by call-briefing, call-debrief, draft-email, and proposal-core so all AI
 * outputs reference the same shared understanding of what the prospect wants.
 */
export type DiscoveryContext = {
  goals?: string;
  painPoints?: string;
  currentStack?: string[];
  decisionMakers?: DecisionMaker[];
  budgetSignal?: string;
  timelineSignal?: string;
  source?: string;
  notes?: string;
};

export function extractDiscovery(client: ClientRow): DiscoveryContext | null {
  const ctx: DiscoveryContext = {};
  if (client.goals?.trim()) ctx.goals = client.goals.trim();
  if (client.painPoints?.trim()) ctx.painPoints = client.painPoints.trim();

  const stack = (client.currentStack as string[] | null) ?? [];
  if (stack.length > 0) ctx.currentStack = stack;

  const dms = (client.decisionMakers as DecisionMaker[] | null) ?? [];
  if (dms.length > 0) ctx.decisionMakers = dms;

  if (client.budgetSignal?.trim()) ctx.budgetSignal = client.budgetSignal.trim();
  if (client.timelineSignal?.trim())
    ctx.timelineSignal = client.timelineSignal.trim();
  if (client.source) ctx.source = client.source;
  if (client.notes?.trim()) ctx.notes = client.notes.trim();

  return Object.keys(ctx).length > 0 ? ctx : null;
}

/**
 * One-line guidance the LLM can use to weigh discovery fields. Embed in system
 * prompts so each AI feature treats discovery facts as the highest-trust signal
 * (founder-curated) above audit/inferred data.
 */
export const DISCOVERY_PRIMER = `When a "discovery" object is present in the context, it is the founder's
own hand-curated notes about what the prospect wants. Treat these as ground truth — they outweigh
inferred signals from audits or call summaries. Specifically:
- "goals" tells you why they're talking to us; reflect this back in any output.
- "painPoints" are the problems to solve; address them explicitly.
- "currentStack" tells you which examples and tools to reach for; pick from this list, not generic ones.
- "decisionMakers" lists key people. Champions help you close; blockers must be neutralized; neutrals must be converted. Reference them by name when relevant.
- "budgetSignal" / "timelineSignal" are soft anchors. Don't pretend they're firm commitments, but use them to calibrate proposals and pacing.
- "source" tells you the relationship temperature (referral = warmer than cold_inbound).
- "notes" is freeform context the founder thought worth remembering — read it, use it.`;
