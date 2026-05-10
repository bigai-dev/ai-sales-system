import { desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { clients, proposals } from "@/db/schema";
import {
  computePricing,
  type ProposalDoc,
  type ProposalPricing,
} from "@/lib/exporters/proposal";

export type ProposalListItem = {
  id: string;
  cohortSize: number;
  totalCents: number;
  venue: "on_site" | "remote" | "hybrid";
  generatedAt: number;
};

export async function getProposalsByClient(clientId: string): Promise<ProposalListItem[]> {
  const rows = await db
    .select({
      id: proposals.id,
      cohortSize: proposals.cohortSize,
      totalCents: proposals.totalCents,
      venue: proposals.venue,
      generatedAt: proposals.generatedAt,
    })
    .from(proposals)
    .where(eq(proposals.clientId, clientId))
    .orderBy(desc(proposals.generatedAt));
  return rows;
}

export async function getProposalDoc(id: string): Promise<ProposalDoc | null> {
  const [row] = await db.select().from(proposals).where(eq(proposals.id, id));
  if (!row) return null;
  const [client] = await db
    .select({ name: clients.name })
    .from(clients)
    .where(eq(clients.id, row.clientId));
  if (!client) return null;

  const pricing: ProposalPricing = {
    perPaxCents: row.perPaxCents,
    cohortSize: row.cohortSize,
    subtotalCents: row.subtotalCents,
    sstCents: row.sstCents,
    totalCents: row.totalCents,
  };
  // Defensive: recompute pricing if stored values look stale and reseed if needed.
  if (pricing.totalCents !== computePricing(row.cohortSize).totalCents) {
    Object.assign(pricing, computePricing(row.cohortSize));
  }

  return {
    client: client.name,
    generatedAt: row.generatedAt,
    output: row.output,
    pricing,
  };
}
