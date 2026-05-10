import { desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import {
  clients as clientsTable,
  healthActions,
  healthChecks,
  healthDimensions,
  healthRisks,
} from "@/db/schema";
import type { Dimension } from "@/lib/data";

export async function getLatestHealthCheck(clientId: string) {
  const [header] = await db
    .select()
    .from(healthChecks)
    .where(eq(healthChecks.clientId, clientId))
    .orderBy(desc(healthChecks.generatedAt))
    .limit(1);
  if (!header) return null;

  const [client] = await db
    .select()
    .from(clientsTable)
    .where(eq(clientsTable.id, clientId));

  const [dims, risks, actions] = await Promise.all([
    db
      .select()
      .from(healthDimensions)
      .where(eq(healthDimensions.healthCheckId, header.id))
      .orderBy(healthDimensions.sortIdx),
    db
      .select()
      .from(healthRisks)
      .where(eq(healthRisks.healthCheckId, header.id))
      .orderBy(healthRisks.sortIdx),
    db
      .select()
      .from(healthActions)
      .where(eq(healthActions.healthCheckId, header.id))
      .orderBy(healthActions.sortIdx),
  ]);

  return {
    id: header.id,
    client: client?.name ?? "—",
    meta: header.meta ?? "",
    related: [] as string[],
    overall: {
      score: header.overallScore,
      status: header.status,
      peers: header.peersScore ?? 70,
      delta: `${header.overallScore - (header.peersScore ?? 70)} pts vs peers`,
    },
    summary: header.summary,
    callouts: (header.callouts as { value: string; tone: "good" | "warn" | "bad" }[]) ?? [],
    dimensions: dims.map((d) => ({
      name: d.name,
      score: d.score,
      status: d.status as "Healthy" | "At risk" | "Critical",
      summary: d.summary,
      metrics: (d.metrics as Dimension["metrics"]) ?? [],
    })) satisfies Dimension[],
    risks: risks.map((r) => ({
      title: r.title,
      detail: r.detail,
      tone: r.tone as "good" | "warn" | "bad" | "info",
      tag: r.tag,
    })),
    actions: actions.map((a) => ({
      title: a.title,
      detail: a.detail,
      impact: a.impact,
    })),
    generatedAt: header.generatedAt,
  };
}

export type LatestHealthCheck = NonNullable<Awaited<ReturnType<typeof getLatestHealthCheck>>>;
