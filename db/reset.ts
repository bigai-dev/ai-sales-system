import { config } from "dotenv";
import { db, libsql } from "./client";
import {
  callTips,
  callTurns,
  calls,
  clients,
  coachingOpportunities,
  coachingScores,
  coachingWins,
  dealInsightCache,
  deals,
  healthActions,
  healthChecks,
  healthDimensions,
  healthRisks,
  proposals,
  reps,
  scratchNotes,
  scriptTemplates,
  taskDismissals,
} from "./schema";

config({ path: ".env.local" });
config({ path: ".env" });

async function main() {
  // Order matters because of FKs (cascades handle some, but be explicit).
  await db.delete(taskDismissals);
  await db.delete(scratchNotes);
  await db.delete(callTips);
  await db.delete(callTurns);
  await db.delete(calls);
  await db.delete(proposals);
  await db.delete(dealInsightCache);
  await db.delete(deals);
  await db.delete(healthActions);
  await db.delete(healthRisks);
  await db.delete(healthDimensions);
  await db.delete(healthChecks);
  await db.delete(coachingOpportunities);
  await db.delete(coachingScores);
  await db.delete(coachingWins);
  await db.delete(clients);
  await db.delete(scriptTemplates);
  await db.delete(reps);
  console.log("✓ all rows deleted");
  libsql.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
