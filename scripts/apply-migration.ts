/*
 * Generic migration applier. Pass the migration filename as the first arg:
 *   npx tsx scripts/apply-migration.ts 0008_petite_rafael_vega.sql
 *
 * Splits on `--> statement-breakpoint` and runs each statement, tolerating
 * "already exists" / "duplicate column" so the script is idempotent.
 *
 * This exists because `drizzle-kit migrate` hangs in this environment;
 * remove once that's fixed upstream.
 */
import { libsql } from "@/db/client";
import { readFileSync } from "node:fs";
import { join } from "node:path";

async function main() {
  const fileName = process.argv[2];
  if (!fileName) {
    console.error("Usage: tsx scripts/apply-migration.ts <migration-file>");
    process.exit(1);
  }
  const sqlPath = join(process.cwd(), "db/migrations", fileName);
  const raw = readFileSync(sqlPath, "utf8");
  const statements = raw
    .split("--> statement-breakpoint")
    .map((s) => s.trim())
    .filter(Boolean);

  console.log(`Applying ${statements.length} statements from ${fileName}...`);
  for (const stmt of statements) {
    const preview = stmt.split("\n")[0]?.slice(0, 80) ?? "";
    process.stdout.write(`  ${preview} ... `);
    try {
      await libsql.execute(stmt);
      console.log("ok");
    } catch (e) {
      const msg = (e as Error).message;
      if (msg.includes("already exists") || msg.includes("duplicate column")) {
        console.log(`skip (${msg.split("\n")[0]})`);
      } else {
        console.log("FAIL");
        throw e;
      }
    }
  }
  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
