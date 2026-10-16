// One-off: run the play collector over every reviewed call that has no
// plays yet. Normally this runs the moment a call is reviewed in the app;
// calls inserted by the sample-data scripts skipped it.
//
//   npm run plays:collect
//
// Safe to repeat: calls that already have plays are left alone.
import { isNotNull, sql } from "drizzle-orm";
import { db } from "../db/client";
import { calls, plays } from "../db/schema";
import { extractPlays } from "../lib/ai/extract-plays";

async function main() {
  const reviewed = await db
    .select({ id: calls.id, briefing: calls.briefing, debrief: calls.debrief, notes: calls.notes })
    .from(calls)
    .where(isNotNull(calls.debrief));

  const withPlays = new Set(
    (await db.select({ callId: plays.callId }).from(plays)).map((r) => r.callId),
  );

  let added = 0;
  let skipped = 0;
  for (const c of reviewed) {
    if (!c.debrief || withPlays.has(c.id)) {
      skipped += 1;
      continue;
    }
    try {
      added += await extractPlays({
        callId: c.id,
        briefing: c.briefing ?? null,
        debrief: c.debrief,
        notes: c.notes ?? null,
      });
    } catch (e) {
      // The collector ends by refreshing Next's page cache, which only works
      // inside the running app. Outside it that last step throws after the
      // plays are already saved, so count what landed.
      const [{ n }] = await db
        .select({ n: sql<number>`count(*)` })
        .from(plays)
        .where(sql`${plays.callId} = ${c.id}`);
      if (Number(n) > 0) added += Number(n);
      else console.warn(`Call ${c.id}: ${(e as Error).message}`);
    }
  }
  const [{ total }] = await db.select({ total: sql<number>`count(*)` }).from(plays);
  console.log(`Looked at ${reviewed.length} reviewed calls · ${skipped} already had plays · ${added} plays added · ${total} plays in total.`);
}

main().then(() => process.exit(0));
