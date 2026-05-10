import { unstable_cache } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { clients, deals } from "@/db/schema";
import { formatMoney } from "@/db/lib/money";
import type { KanbanColumn, Deal as DealCard } from "@/lib/types/ui";
import { DAY_MS } from "@/lib/format/time";

const STAGE_META: { code: "S" | "P" | "A" | "N" | "C" | "O"; name: string; description: string }[] = [
  { code: "S", name: "Suspect", description: "Identified target, not yet contacted" },
  { code: "P", name: "Prospect", description: "Replied / showed interest, no meeting yet" },
  { code: "A", name: "Analysis", description: "Discovery call done — headcount + AI level + budget captured" },
  { code: "N", name: "Negotiation", description: "Proposal sent — content / venue / dates being aligned" },
  { code: "C", name: "Conclusion", description: "Verbal yes — awaiting payment to lock the date" },
  { code: "O", name: "Order", description: "Invoice paid · workshop date locked" },
];

function daysSince(ts: number): number {
  return Math.max(0, Math.floor((Date.now() - ts) / DAY_MS));
}

export const getPipelineBoard = unstable_cache(
  async (): Promise<KanbanColumn[]> => {
    const rows = await db
      .select({
        deal: deals,
        client: clients,
      })
      .from(deals)
      .innerJoin(clients, eq(deals.clientId, clients.id));

    const byStage = new Map<string, { totalCents: number; deals: DealCard[]; }>();
    for (const code of STAGE_META.map((s) => s.code)) {
      byStage.set(code, { totalCents: 0, deals: [] });
    }

    for (const { deal, client } of rows) {
      const bucket = byStage.get(deal.stage);
      if (!bucket) continue;
      bucket.totalCents += deal.valueCents;
      bucket.deals.push({
        id: deal.id,
        initials: client.initials,
        company: client.name,
        contact: client.contactName,
        role: client.contactRole ?? "—",
        value: formatMoney(deal.valueCents),
        daysInStage: daysSince(deal.daysInStageStartsAt),
        lastActivity: deal.lastActivity ?? "—",
        insight: deal.insight ?? "",
        tags: ((deal.tags as string[] | null) ?? ["—", "—"]).slice(0, 2) as [string, string],
        next: deal.nextStep ?? "—",
        hot: !!deal.hot,
        headcount: deal.headcount ?? undefined,
      });
    }

    return STAGE_META.map((m) => {
      const b = byStage.get(m.code)!;
      // Sort within column: hot first, then days in stage descending
      b.deals.sort((a, z) => Number(z.hot) - Number(a.hot) || z.daysInStage - a.daysInStage);
      return {
        code: m.code,
        name: m.name,
        description: m.description,
        count: b.deals.length,
        total: formatMoney(b.totalCents),
        deals: b.deals,
      };
    });
  },
  ["pipeline-board"],
  { tags: ["pipeline"], revalidate: 300 },
);

