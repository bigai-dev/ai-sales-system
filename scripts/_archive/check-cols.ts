import "dotenv/config";
import { createClient } from "@libsql/client";
async function main() {
  const client = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
  });
  const r = await client.execute("PRAGMA table_info(calls)");
  const cols = r.rows.map((r) => r.name);
  console.log("has briefing:", cols.includes("briefing"));
  console.log("has notes:", cols.includes("notes"));
  console.log("has debrief:", cols.includes("debrief"));
  console.log("has scheduled_at:", cols.includes("scheduled_at"));
  console.log("has analyzed_at:", cols.includes("analyzed_at"));
}
main().catch((e) => { console.error(e); process.exit(1); });
