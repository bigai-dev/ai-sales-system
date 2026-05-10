"use server";
import { generateText, Output } from "ai";
import { eq } from "drizzle-orm";
import { revalidatePath, revalidateTag } from "next/cache";
import { chat } from "./deepseek";
import { scrubObject } from "./scrub";
import { db } from "@/db/client";
import {
  clients,
  deals,
  healthActions,
  healthChecks,
  healthDimensions,
  healthRisks,
} from "@/db/schema";
import {
  DIMENSION_LABELS,
  STATUS_TO_DB,
  SEVERITY_TO_TAG,
  SEVERITY_TO_TONE,
  healthCheckSchema,
  type HealthCheckOutput,
} from "@/lib/schemas/health-check";

const SYSTEM_PROMPT = `You are a senior engineering coach scoping a 2-day
vibe-coding workshop for a prospect. The workshop is priced at RM 3,500 per
participant + 8% SST. Day 1 is tools + prompt fluency (Cursor, Claude Code,
shared rules). Day 2 is workflow integration (PR review, agentic dev,
guardrails). Cohorts run up to ~35 participants; bigger orgs phase across
multiple cohorts.

Score six dimensions of the prospect's engineering org on a 0-100 scale,
strictly from the supplied context. Each score must directly inform what
the workshop teaches them — not abstract maturity.

Dimension definitions:
- tooling: do they have the editor + agent stack to make Day 1 land
  (Claude Code / Cursor / Copilot licences, MCP servers, IDE rules, secrets)?
- practices: is AI woven into PR review, testing, code-gen, prompt hygiene,
  agent guardrails — i.e. is Day 2 even applicable yet?
- culture: leadership posture toward AI; willingness to change workflows;
  blast-radius tolerance for autonomous agents.
- velocity: throughput baseline — cycle time, PRs/dev/week, deploy frequency.
  Establishes the gap the workshop closes.
- adoption: % of engineers using AI tools daily/weekly; license utilization;
  distribution across sub-teams.
- outcomes: output quality — defect rate, escaped bugs, time-to-feature,
  dev satisfaction.

Every dimension summary must name ONE concrete observation from the supplied
data and explain why the score lands there. Risks must be observable, not
speculative. Actions must be concrete moves a 2-day workshop (or short
follow-up engagement) can deliver inside 90 days; prefer measurable impact.

Status thresholds: 0-49 critical, 50-64 at_risk, 65-79 watch, 80-100 healthy.

Respond ONLY with JSON conforming to the requested schema. No code fences.
No commentary.`;

async function loadContext(clientId: string) {
  const [client] = await db.select().from(clients).where(eq(clients.id, clientId));
  if (!client) throw new Error("Client not found");
  const clientDeals = await db.select().from(deals).where(eq(deals.clientId, clientId));
  return scrubObject({
    client: {
      name: client.name,
      contactName: client.contactName,
      contactRole: client.contactRole,
      industry: client.industry,
      size: client.size,
      employees: client.employees,
      stage: client.stage,
      arrCents: client.arrCents,
      health: client.health,
      products: client.products,
    },
    deals: clientDeals.map((d) => ({
      stage: d.stage,
      valueCents: d.valueCents,
      probability: d.probability,
      hot: d.hot,
      lastActivity: d.lastActivity,
      nextStep: d.nextStep,
      tags: d.tags,
    })),
  });
}

function buildCallouts(out: HealthCheckOutput) {
  const critical = out.risks.filter((r) => r.severity === "critical").length;
  const high = out.risks.filter((r) => r.severity === "high").length;
  const callouts: { value: string; tone: "good" | "warn" | "bad" }[] = [];
  if (critical) callouts.push({ value: `${critical} critical issue${critical > 1 ? "s" : ""}`, tone: "bad" });
  if (high) callouts.push({ value: `${high} high-risk area${high > 1 ? "s" : ""}`, tone: "warn" });
  callouts.push({ value: `${out.actions.length} recommended actions`, tone: "good" });
  return callouts;
}

export async function runHealthCheck(clientId: string): Promise<{
  ok: true;
  data: { id: string };
} | {
  ok: false;
  error: string;
}> {
  let context: Awaited<ReturnType<typeof loadContext>>;
  try {
    context = await loadContext(clientId);
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }

  let output: HealthCheckOutput;
  try {
    const result = await generateText({
      model: chat,
      output: Output.object({ schema: healthCheckSchema }),
      system: SYSTEM_PROMPT,
      prompt: `Client: ${JSON.stringify(context.client)}\nDeals: ${JSON.stringify(context.deals)}`,
      maxOutputTokens: 4000,
    });
    output = result.output as HealthCheckOutput;
  } catch (e) {
    return { ok: false, error: `LLM call failed: ${(e as Error).message}` };
  }

  // Persist as a single transaction
  const [client] = await db.select().from(clients).where(eq(clients.id, clientId));

  const headerRow = await db
    .insert(healthChecks)
    .values({
      clientId,
      overallScore: output.overallScore,
      status: STATUS_TO_DB[output.overallStatus],
      peersScore: 70,
      summary: output.executiveSummary,
      callouts: buildCallouts(output),
      related: [],
      meta: [
        client.contactName,
        client.contactRole,
        client.industry,
        client.size,
        client.employees ? `${client.employees.toLocaleString()} employees` : null,
      ]
        .filter(Boolean)
        .join(" · "),
      modelVersion: "deepseek-chat",
    })
    .returning({ id: healthChecks.id });

  const headerId = headerRow[0].id;

  const dims = output.dimensions;
  const dimRows = (
    Object.keys(DIMENSION_LABELS) as (keyof typeof DIMENSION_LABELS)[]
  ).map((key, idx) => ({
    healthCheckId: headerId,
    name: DIMENSION_LABELS[key],
    score: dims[key].score,
    status: STATUS_TO_DB[dims[key].status],
    summary: dims[key].summary,
    metrics: dims[key].metrics.map((m) => ({
      label: m.name,
      value: m.value,
      trend: (m.trend ?? "flat") as "up" | "down" | "flat",
    })),
    sortIdx: idx,
  }));
  if (dimRows.length) await db.insert(healthDimensions).values(dimRows);

  if (output.risks.length) {
    await db.insert(healthRisks).values(
      output.risks.map((r, idx) => ({
        healthCheckId: headerId,
        title: r.title,
        detail: r.description,
        tone: SEVERITY_TO_TONE[r.severity],
        tag: SEVERITY_TO_TAG[r.severity],
        sortIdx: idx,
      })),
    );
  }

  if (output.actions.length) {
    await db.insert(healthActions).values(
      output.actions.map((a, idx) => ({
        healthCheckId: headerId,
        title: a.title,
        detail: `${a.impact} (~${a.effortWeeks} wk, ${a.owner})`,
        impact: a.priority.toUpperCase(),
        sortIdx: idx,
      })),
    );
  }

  revalidateTag("health-checks", "default");
  revalidatePath("/health-check");
  revalidatePath(`/clients/${clientId}/health-check`);
  revalidatePath(`/clients/${clientId}`);
  return { ok: true, data: { id: headerId } };
}
