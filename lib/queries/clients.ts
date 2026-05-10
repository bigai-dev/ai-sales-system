import { unstable_cache } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { clients } from "@/db/schema";
import { formatMoney } from "@/db/lib/money";
import type { Client } from "@/lib/types/ui";
import { DAY_MS } from "@/lib/format/time";

export const getClientList = unstable_cache(
  async (): Promise<Client[]> => {
    const rows = await db.select().from(clients);
    rows.sort((a, b) => b.arrCents - a.arrCents);
    return rows.map((c) => ({
      id: c.id,
      initials: c.initials,
      name: c.name,
      contact: c.contactName,
      stage: c.stage,
      industry: c.industry ?? "—",
      size: c.size ?? "Mid-market",
      employees: c.employees ?? 0,
      devCount: c.devCount ?? undefined,
      arr: formatMoney(c.arrCents),
      health: c.health,
      products: (c.products as string[] | null) ?? [],
      lastActivity: c.lastActivityAt
        ? formatRelativeDays(c.lastActivityAt)
        : "—",
      gradient: c.gradient ?? "",
    }));
  },
  ["clients-list"],
  // Self-heal every 5 minutes even if no tag fires — covers writes from
  // scripts/maintenance that don't go through server actions.
  { tags: ["clients"], revalidate: 300 },
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
