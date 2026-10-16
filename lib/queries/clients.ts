import { unstable_cache } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { clients, deals } from "@/db/schema";
import { formatMoney } from "@/db/lib/money";
import type { Client } from "@/lib/types/ui";
import { DAY_MS } from "@/lib/format/time";
import { deriveClientStage, stageLabel, type StageCode } from "@/lib/constants/labels";

/**
 * Stage per client, worked out from its deals (most advanced open deal; else
 * Won; else New lead). The `clients.stage` column is no longer read anywhere.
 */
export async function getClientStageMap(): Promise<Map<string, StageCode>> {
  const rows = await db.select({ clientId: deals.clientId, stage: deals.stage }).from(deals);
  const byClient = new Map<string, { stage: string }[]>();
  for (const r of rows) {
    const list = byClient.get(r.clientId) ?? [];
    list.push({ stage: r.stage });
    byClient.set(r.clientId, list);
  }
  const out = new Map<string, StageCode>();
  for (const [id, list] of byClient) out.set(id, deriveClientStage(list));
  return out;
}

export async function getClientStage(clientId: string): Promise<StageCode> {
  const rows = await db
    .select({ stage: deals.stage })
    .from(deals)
    .where(eq(deals.clientId, clientId));
  return deriveClientStage(rows);
}

export const getClientList = unstable_cache(
  async (): Promise<Client[]> => {
    const [rows, stageMap] = await Promise.all([db.select().from(clients), getClientStageMap()]);
    rows.sort((a, b) => b.arrCents - a.arrCents);
    return rows.map((c) => {
      const stageCode = stageMap.get(c.id) ?? "S";
      return {
        id: c.id,
        initials: c.initials,
        name: c.name,
        contact: c.contactName,
        stage: stageLabel(stageCode),
        stageCode,
        industry: c.industry ?? "—",
        size: c.size ?? "Mid-market",
        employees: c.employees ?? 0,
        devCount: c.devCount ?? undefined,
        arr: formatMoney(c.arrCents),
        health: c.health,
        products: (c.products as string[] | null) ?? [],
        lastActivity: c.lastActivityAt ? formatRelativeDays(c.lastActivityAt) : "—",
        gradient: c.gradient ?? "",
      };
    });
  },
  ["clients-list"],
  // Self-heal every 5 minutes even if no tag fires — covers writes from
  // scripts/maintenance that don't go through server actions.
  { tags: ["clients", "pipeline"], revalidate: 300 },
);

export async function getClientById(id: string) {
  const rows = await db.select().from(clients).where(eq(clients.id, id));
  return rows[0];
}

function formatRelativeDays(ts: number): string {
  const days = Math.floor((Date.now() - ts) / DAY_MS);
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}
