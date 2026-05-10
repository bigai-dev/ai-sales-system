import { unstable_cache } from "next/cache";
import { sql } from "drizzle-orm";
import { db } from "@/db/client";
import { clients } from "@/db/schema";
import { formatMoney } from "@/db/lib/money";
import type { Stage } from "@/lib/data";

// Funnel column colors: cool muted → warm accent as the deal progresses.
// Aligned with the OKLCH theme tokens (muted → accent).
const STAGE_META = [
  { name: "Lead", color: "#6b6660" },
  { name: "Qualified", color: "#8a847b" },
  { name: "Discovery", color: "#a8a39a" },
  { name: "Proposal", color: "#c8a87f" },
  { name: "Negotiation", color: "#e0a866" },
  { name: "Closed-won", color: "#f7a85d" },
] as const;

export const getDashboardFunnel = unstable_cache(
  async (): Promise<Stage[]> => {
    const rows = await db
      .select({
        stage: clients.stage,
        count: sql<number>`count(*)`,
        valueCents: sql<number>`coalesce(sum(${clients.arrCents}),0)`,
      })
      .from(clients)
      .groupBy(clients.stage);

    const byStage = new Map(rows.map((r) => [r.stage, r]));
    const counts = STAGE_META.map((m) => Number(byStage.get(m.name)?.count ?? 0));
    const max = Math.max(1, ...counts);

    return STAGE_META.map((m, i) => {
      const r = byStage.get(m.name);
      const count = Number(r?.count ?? 0);
      const valueCents = Number(r?.valueCents ?? 0);
      const weighted = Math.round(valueCents * stageProbability(m.name));
      return {
        name: m.name === "Closed-won" ? "Closing" : m.name,
        count,
        pct: Math.round((counts[i] / max) * 100),
        color: m.color,
        value: formatMoney(valueCents),
        weighted: formatMoney(weighted),
      };
    });
  },
  ["dashboard-funnel"],
  { tags: ["dashboard-kpis", "clients"] },
);

function stageProbability(s: string): number {
  switch (s) {
    case "Lead": return 0.1;
    case "Qualified": return 0.2;
    case "Discovery": return 0.3;
    case "Proposal": return 0.5;
    case "Negotiation": return 0.7;
    case "Closed-won": return 1.0;
    default: return 0.1;
  }
}
