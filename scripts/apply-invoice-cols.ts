import "dotenv/config";
import { createClient } from "@libsql/client";

const STMTS = [
  "ALTER TABLE deals ADD COLUMN invoice_number text",
  "ALTER TABLE deals ADD COLUMN invoice_issued_at integer",
];

async function main() {
  const c = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
  });
  for (const s of STMTS) {
    try {
      await c.execute(s);
      console.log("OK:", s.slice(0, 70));
    } catch (e) {
      const msg = (e as Error).message;
      if (msg.includes("duplicate column name")) console.log("SKIP (exists):", s.slice(0, 60));
      else console.log("FAIL:", s.slice(0, 60), "→", msg);
    }
  }
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
