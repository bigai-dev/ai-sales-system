import { unstable_cache } from "next/cache";
import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db/client";
import { calls, clients, plays } from "@/db/schema";
import type { PlayBucket, PlayDetail, PlayListItem } from "@/lib/schemas/play";

// Re-exports for backwards compatibility with existing import sites.
// New client-side code should import directly from "@/lib/schemas/play".
export { SOURCE_LABEL, SOURCE_TONE } from "@/lib/schemas/play";
export type { PlayBucket, PlayDetail, PlayListItem, PlaySource } from "@/lib/schemas/play";

async function _fetchPlays(showHidden: boolean): Promise<PlayListItem[]> {
  const rows = await db
    .select({
      id: plays.id,
      callId: plays.callId,
      bucket: plays.bucket,
      scenario: plays.scenario,
      repResponseExcerpt: plays.repResponseExcerpt,
      outcome: plays.outcome,
      source: plays.source,
      pinned: plays.pinned,
      hidden: plays.hidden,
      createdAt: plays.createdAt,
      clientName: clients.name,
    })
    .from(plays)
    .leftJoin(calls, eq(plays.callId, calls.id))
    .leftJoin(clients, eq(calls.clientId, clients.id))
    .orderBy(desc(plays.pinned), desc(plays.createdAt));

  return showHidden ? rows : rows.filter((r) => !r.hidden);
}

export const getPlays = unstable_cache(
  async () => _fetchPlays(false),
  ["plays-visible"],
  { tags: ["plays"], revalidate: 300 },
);

export const getAllPlays = unstable_cache(
  async () => _fetchPlays(true),
  ["plays-all"],
  { tags: ["plays"], revalidate: 300 },
);

// Pinned plays for the carousel on /training landing.
export async function getPinnedPlays(limit = 6): Promise<PlayListItem[]> {
  const all = await getPlays();
  return all.filter((p) => p.pinned).slice(0, limit);
}

export async function getPlayById(id: string): Promise<PlayDetail | null> {
  const [row] = await db
    .select({
      id: plays.id,
      callId: plays.callId,
      bucket: plays.bucket,
      scenario: plays.scenario,
      repResponseExcerpt: plays.repResponseExcerpt,
      outcome: plays.outcome,
      source: plays.source,
      pinned: plays.pinned,
      hidden: plays.hidden,
      createdAt: plays.createdAt,
      clientName: clients.name,
      callTitle: calls.title,
      callDate: calls.startedAt,
    })
    .from(plays)
    .leftJoin(calls, eq(plays.callId, calls.id))
    .leftJoin(clients, eq(calls.clientId, clients.id))
    .where(eq(plays.id, id));
  if (!row) return null;
  return row;
}

// Pull pinned plays for a set of buckets — used to seed scenario-generator
// and dry-run prompts as exemplars.
export async function getPlayExemplars(
  buckets: PlayBucket[],
  limit = 2,
): Promise<{ bucket: PlayBucket; scenario: string; repResponseExcerpt: string }[]> {
  if (buckets.length === 0) return [];
  const rows = await db
    .select({
      bucket: plays.bucket,
      scenario: plays.scenario,
      repResponseExcerpt: plays.repResponseExcerpt,
      pinned: plays.pinned,
      createdAt: plays.createdAt,
    })
    .from(plays)
    .where(and(inArray(plays.bucket, buckets), eq(plays.hidden, false)))
    .orderBy(desc(plays.pinned), desc(plays.createdAt))
    .limit(limit * buckets.length);
  // Top N per bucket.
  const byBucket = new Map<PlayBucket, typeof rows>();
  for (const r of rows) {
    const b = r.bucket as PlayBucket;
    const arr = byBucket.get(b) ?? [];
    if (arr.length < limit) arr.push(r);
    byBucket.set(b, arr);
  }
  const out: {
    bucket: PlayBucket;
    scenario: string;
    repResponseExcerpt: string;
  }[] = [];
  for (const [bucket, arr] of byBucket) {
    for (const a of arr) {
      out.push({
        bucket,
        scenario: a.scenario,
        repResponseExcerpt: a.repResponseExcerpt,
      });
    }
  }
  return out;
}
