import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });
import { db, libsql } from "../db/client";
import { clients } from "../db/schema";
import { sql } from "drizzle-orm";

async function main() {
  const allClients = await db
    .select({ name: clients.name, stage: clients.stage, arrCents: clients.arrCents })
    .from(clients);
  console.log("CLIENTS by stage:");
  for (const c of allClients) {
    console.log(`  ${c.stage.padEnd(12)} ${c.name.padEnd(28)} RM ${c.arrCents / 100}`);
  }

  const grouped = await db
    .select({
      stage: clients.stage,
      count: sql<number>`count(*)`,
      sum: sql<number>`coalesce(sum(${clients.arrCents}),0)`,
    })
    .from(clients)
    .groupBy(clients.stage);
  console.log("\nGROUPED by stage:");
  for (const g of grouped) {
    console.log(`  ${String(g.stage).padEnd(12)} count=${g.count} sum=RM ${Number(g.sum) / 100}`);
  }
  libsql.close();
}
main();
