import { unstable_cache } from "next/cache";
import { sql } from "drizzle-orm";
import { db } from "@/db/client";
import { deals } from "@/db/schema";
import { formatMoney } from "@/db/lib/money";
import type { Stage } from "@/lib/types/ui";
import { STAGE, STAGE_CODES, type StageCode } from "@/lib/constants/labels";

// Bar colour per stage: quiet grey → full accent as the deal progresses.
// Expressed with theme tokens so light and dark both look right.
const STAGE_COLOR: Record<StageCode, string> = {
  S: "var(--quiet)",
  P: "var(--muted)",
  A: "color-mix(in oklch, var(--accent) 40%, var(--muted))",
  N: "color-mix(in oklch, var(--accent) 60%, var(--muted))",
  C: "color-mix(in oklch, var(--accent) 80%, var(--muted))",
  O: "var(--accent)",
};

/** Deals grouped by stage, with plain and chance-weighted totals. */
export const getDashboardFunnel = unstable_cache(
  async (): Promise<Stage[]> => {
    const rows = await db
      .select({
        stage: deals.stage,
        count: sql<number>`count(*)`,
        valueCents: sql<number>`coalesce(sum(${deals.valueCents}),0)`,
      })
      .from(deals)
      .groupBy(deals.stage);

    const byStage = new Map(rows.map((r) => [r.stage, r]));
    const counts = STAGE_CODES.map((c) => Number(byStage.get(c)?.count ?? 0));
    const max = Math.max(1, ...counts);

    return STAGE_CODES.map((code, i) => {
      const r = byStage.get(code);
      const count = Number(r?.count ?? 0);
      const valueCents = Number(r?.valueCents ?? 0);
      const weighted = Math.round((valueCents * STAGE[code].chance) / 100);
      return {
        name: STAGE[code].label,
        count,
        pct: Math.round((counts[i] / max) * 100),
        color: STAGE_COLOR[code],
        value: formatMoney(valueCents),
        weighted: formatMoney(weighted),
      };
    });
  },
  ["dashboard-funnel"],
  { tags: ["dashboard-kpis", "pipeline"], revalidate: 300 },
);
