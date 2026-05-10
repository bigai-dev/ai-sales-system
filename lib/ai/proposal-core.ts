import { generateText, Output } from "ai";
import { desc, eq } from "drizzle-orm";
import { revalidatePath, revalidateTag } from "next/cache";
import { chat } from "./deepseek";
import { scrubObject } from "./scrub";
import { extractDiscovery, DISCOVERY_PRIMER } from "./client-discovery";
import { DAY_MS } from "@/lib/format/time";
import { db } from "@/db/client";
import { clients, deals, proposals } from "@/db/schema";
import { proposalSchema, type ProposalOutput } from "@/lib/schemas/proposal";
import {
  buildProposalMarkdown,
  computePricing,
  type ProposalDoc,
} from "@/lib/exporters/proposal";
import { getLatestHealthCheck } from "@/lib/queries/health";
import type { Result } from "@/lib/types";

const SYSTEM_PROMPT = `You are scoping a 2-day vibe-coding workshop for an
engineering team. Workshop is priced at RM 3,500/pax + 8% SST. Cohorts cap at
~35 attendees; larger teams phase across multiple cohorts.

Day 1 covers: tool stack (Cursor / Claude Code / Copilot / MCP), prompt
fluency, shared rule files, secrets handling.
Day 2 covers: PR review with AI, agentic dev workflows, guardrails, code-gen
discipline, definition-of-done updates for AI-assisted code.

You will be given:
- the client's metadata (industry, size, headcount, engineers, current stage)
- the most recent engineering AI-coding readiness audit (6 dimensions, scores,
  risks, recommended actions)
- (optional) the open deal context (proposed cohort headcount, delivery date)

Produce a structured proposal that ties EVERY module to a specific audit
finding. Do not invent generic "AI workshop" content — cohort size, content
split, venue, and follow-ups should be defensible from the audit data.

Cohort size rules:
- If supplied deal headcount is realistic (≤35), use that.
- Otherwise propose a cohort size that fits within 35, framed as cohort 1 of N
  in the rationale for larger teams.

Day-1 vs Day-2 weighting:
- Tooling/Adoption scores low → heavier Day 1.
- Practices/Outcomes scores low → heavier Day 2.

Venue:
- Distributed/remote-first culture → remote.
- Security-sensitive (compliance/healthtech/fintech) → on-site.
- Hybrid only when culture clearly mixed.

Dates: 1-3 plain-English options 4-8 weeks out from today; assume today is the
date of generation.

Discovery overrides defaults:
- If currentStack is provided, draw examples and tooling references from THAT
  stack, not generic Python/JavaScript defaults.
- If goals are stated, the proposal's outcomes section must explicitly answer them.
- If painPoints are listed, the modules covering each pain point must be named
  in the rationale.
- If timelineSignal is set, prefer date options that align with it.
- If budgetSignal is set, frame cohort sizing to land near that band.

If a "priorProposal" object is present, this is a regeneration — the previous
version evidently didn't land. Meaningfully differentiate this version:
- Adjust cohortSize (smaller phased cohorts often unlock budget objections;
  larger may be acceptable if the prior was conservative)
- Reconsider venue (if prior was on_site, try hybrid; if remote, try on_site)
- Adjust day1Theme / day2Theme weighting if their pain has shifted
- Address the differentiation explicitly in cohortRecommendation.rationale
  ("Refined from the X-pax / Y proposal sent N days ago to better fit Z signal")
Do NOT regenerate the same proposal with cosmetic changes.

${DISCOVERY_PRIMER}

Respond ONLY with JSON conforming to the requested schema. No code fences. No
commentary.`;

async function loadContext(clientId: string) {
  const [client] = await db.select().from(clients).where(eq(clients.id, clientId));
  if (!client) throw new Error("Client not found");
  const audit = await getLatestHealthCheck(clientId);
  if (!audit) throw new Error("Generate a readiness audit first");
  const clientDeals = await db.select().from(deals).where(eq(deals.clientId, clientId));
  const openDeal = clientDeals
    .filter((d) => d.stage !== "O")
    .sort((a, b) => (b.lastActivityAt ?? 0) - (a.lastActivityAt ?? 0))[0];

  // Most recent prior proposal — when present, this is a regeneration. The AI
  // should meaningfully differentiate (different cohort, venue, or pacing)
  // rather than restating, since the first version evidently didn't land.
  const [priorProposal] = await db
    .select({
      cohortSize: proposals.cohortSize,
      totalCents: proposals.totalCents,
      venue: proposals.venue,
      generatedAt: proposals.generatedAt,
      output: proposals.output,
    })
    .from(proposals)
    .where(eq(proposals.clientId, clientId))
    .orderBy(desc(proposals.generatedAt))
    .limit(1);

  const prompt = scrubObject({
    client: {
      name: client.name,
      industry: client.industry,
      size: client.size,
      employees: client.employees,
      devCount: client.devCount,
      stage: client.stage,
    },
    discovery: extractDiscovery(client),
    audit: {
      overallScore: audit.overall.score,
      overallStatus: audit.overall.status,
      summary: audit.summary,
      dimensions: audit.dimensions.map((d) => ({
        name: d.name,
        score: d.score,
        status: d.status,
        summary: d.summary,
      })),
      risks: audit.risks.map((r) => ({ title: r.title, detail: r.detail, tag: r.tag })),
      actions: audit.actions.map((a) => ({ title: a.title, detail: a.detail, impact: a.impact })),
    },
    openDeal: openDeal
      ? {
          stage: openDeal.stage,
          headcount: openDeal.headcount,
          deliveryDate: openDeal.deliveryDate,
          tags: openDeal.tags,
          nextStep: openDeal.nextStep,
        }
      : null,
    priorProposal: priorProposal
      ? {
          generatedDaysAgo: Math.floor(
            (Date.now() - priorProposal.generatedAt) / DAY_MS,
          ),
          cohortSize: priorProposal.cohortSize,
          venue: priorProposal.venue,
          // Trim the prior output to just the headline structure so the AI sees
          // what was tried without echoing 3000 tokens of detail back at us.
          cohortRationale: priorProposal.output.cohortRecommendation.rationale,
          dayWeighting: {
            day1: priorProposal.output.contentSplit.day1Theme,
            day2: priorProposal.output.contentSplit.day2Theme,
          },
          venueRationale: priorProposal.output.logistics.venueRationale,
        }
      : null,
    today: new Date().toISOString().slice(0, 10),
  });

  return { auditId: audit.id, clientName: client.name, prompt };
}

export async function generateProposalCore(
  clientId: string,
  signal?: AbortSignal,
): Promise<
  Result<{
    id: string;
    doc: ProposalDoc;
    markdown: string;
    pricing: { totalCents: number; cohortSize: number };
  }>
> {
  let context: Awaited<ReturnType<typeof loadContext>>;
  try {
    context = await loadContext(clientId);
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }

  let output: ProposalOutput;
  try {
    const result = await generateText({
      model: chat,
      output: Output.object({ schema: proposalSchema }),
      system: SYSTEM_PROMPT,
      prompt: `Client + audit + open deal context:\n${JSON.stringify(context.prompt, null, 2)}\n\nProduce the proposal now.`,
      maxOutputTokens: 3000,
      abortSignal: signal,
    });
    output = proposalSchema.parse(result.output);
  } catch (e) {
    if (signal?.aborted) {
      return { ok: false, error: "Cancelled" };
    }
    return { ok: false, error: `LLM call failed: ${(e as Error).message}` };
  }

  // Bail out before writing if the user already cancelled.
  if (signal?.aborted) return { ok: false, error: "Cancelled" };

  const pricing = computePricing(output.cohortRecommendation.size);
  const generatedAt = Date.now();

  const [row] = await db
    .insert(proposals)
    .values({
      clientId,
      healthCheckId: context.auditId,
      output,
      cohortSize: pricing.cohortSize,
      perPaxCents: pricing.perPaxCents,
      subtotalCents: pricing.subtotalCents,
      sstCents: pricing.sstCents,
      totalCents: pricing.totalCents,
      venue: output.logistics.venueRecommendation,
      modelVersion: "deepseek-chat",
      generatedAt,
    })
    .returning({ id: proposals.id });

  const doc: ProposalDoc = {
    client: context.clientName,
    generatedAt,
    output,
    pricing,
  };
  const markdown = buildProposalMarkdown(doc);

  revalidateTag("proposals", "default");
  revalidateTag("pipeline", "default");
  revalidateTag("dashboard-kpis", "default");
  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/today");

  return {
    ok: true,
    data: {
      id: row.id,
      doc,
      markdown,
      pricing: { totalCents: pricing.totalCents, cohortSize: pricing.cohortSize },
    },
  };
}
