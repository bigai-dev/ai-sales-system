import { unstable_cache } from "next/cache";
import { and, eq, gte, inArray, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { calls, deals } from "@/db/schema";
import {
  QUARTER_TARGET_CENTS,
  rangeCaption,
  rangeStartMs,
  type Range,
} from "./quarter";
import { formatMoney } from "@/db/lib/money";
import type { Kpi } from "./types/ui";

const OPEN_STAGES = ["S", "P", "A", "N", "C"] as const satisfies readonly ("S" | "P" | "A" | "N" | "C" | "O")[];

export const getAvgDealSize = unstable_cache(
  async (range: Range) => {
    const start = rangeStartMs(range);
    const rows = await db
      .select({ avgCents: sql<number | null>`avg(${deals.valueCents})` })
      .from(deals)
      .where(and(eq(deals.stage, "O"), gte(deals.closedAt, start)));
    return { cents: Number(rows[0]?.avgCents ?? 0) };
  },
  ["kpi-avg-deal"],
  { tags: ["dashboard-kpis"], revalidate: 300 },
);

export const getPipelineValue = unstable_cache(
  async () => {
    const rows = await db
      .select({ sumCents: sql<number>`coalesce(sum(${deals.valueCents}),0)` })
      .from(deals)
      .where(inArray(deals.stage, [...OPEN_STAGES]));
    const cents = Number(rows[0]?.sumCents ?? 0);
    return {
      cents,
      pctOfTarget: Math.min(100, Math.round((cents / QUARTER_TARGET_CENTS) * 100)),
    };
  },
  ["kpi-pipeline"],
  { tags: ["dashboard-kpis"], revalidate: 300 },
);

export const getDealsClosed = unstable_cache(
  async (range: Range) => {
    const start = rangeStartMs(range);
    const rows = await db
      .select({
        n: sql<number>`count(*)`,
        wonCents: sql<number>`coalesce(sum(${deals.valueCents}),0)`,
      })
      .from(deals)
      .where(and(eq(deals.stage, "O"), gte(deals.closedAt, start)));
    return {
      count: Number(rows[0]?.n ?? 0),
      wonCents: Number(rows[0]?.wonCents ?? 0),
    };
  },
  ["kpi-closed"],
  { tags: ["dashboard-kpis"], revalidate: 300 },
);

export const getCallsInRange = unstable_cache(
  async (range: Range) => {
    const start = rangeStartMs(range);
    const rows = await db
      .select({ n: sql<number>`count(*)` })
      .from(calls)
      .where(gte(calls.startedAt, start));
    return { count: Number(rows[0]?.n ?? 0) };
  },
  ["kpi-calls"],
  { tags: ["dashboard-kpis"], revalidate: 300 },
);

export async function getDashboardKpis(range: Range): Promise<Kpi[]> {
  const [pipe, closed, callCount, avg] = await Promise.all([
    getPipelineValue(),
    getDealsClosed(range),
    getCallsInRange(range),
    getAvgDealSize(range),
  ]);

  const closedFormatted = formatMoney(closed.wonCents);
  const caption = rangeCaption(range);
  const isQuarter = range === "quarter";
  const chipText = range === "week" ? "this wk" : range === "month" ? "this mo" : "this Q";

  return [
    {
      label: "Workshops in pipeline",
      value: formatMoney(pipe.cents),
      delta: isQuarter && pipe.pctOfTarget >= 70 ? { text: `▲ ${pipe.pctOfTarget}%`, up: true } : undefined,
      bar: isQuarter ? pipe.pctOfTarget : undefined,
      caption: isQuarter
        ? `${pipe.pctOfTarget}% of ${formatMoney(QUARTER_TARGET_CENTS)} quarterly target`
        : `Open across all SPANCO stages`,
    },
    {
      label: "Workshops booked",
      value: String(closed.count),
      delta: closed.count > 0 ? { text: `▲ ${closed.count}`, up: true } : undefined,
      caption: `${closedFormatted} won ${caption}`,
    },
    {
      label: "Discovery calls",
      value: callCount.count.toLocaleString(),
      caption: `${callCount.count} calls ${caption}`,
    },
    avg.cents > 0
      ? {
          label: "Avg workshop value",
          value: formatMoney(avg.cents),
          chip: { text: chipText, tone: "info" },
          caption: "Average TCV per booked workshop",
        }
      : {
          label: "Avg workshop value",
          value: "—",
          caption: `No workshops booked yet ${caption}`,
        },
  ];
}
