import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });

import { db, libsql } from "../db/client";
import {
  coachingOpportunities,
  coachingScores,
  coachingWins,
} from "../db/schema";

async function main() {
  const before = await Promise.all([
    db.select().from(coachingScores),
    db.select().from(coachingOpportunities),
    db.select().from(coachingWins),
  ]);

  await Promise.all([
    db.delete(coachingScores),
    db.delete(coachingOpportunities),
    db.delete(coachingWins),
  ]);

  console.log(
    `cleared coaching rows · scores=${before[0].length} opportunities=${before[1].length} wins=${before[2].length}`,
  );
  console.log(
    "↳ getCoachingPanel will now fall back to the static seed (content/budget/venue/time copy).",
  );
  console.log("↳ run `npm run dev:clean` (or restart dev) to bust unstable_cache.");

  libsql.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
