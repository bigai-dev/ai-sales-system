import { config } from "dotenv";
import { createClient } from "@libsql/client";

config({ path: ".env.local" });

const STMTS = [
  // Client discovery profile fields
  "ALTER TABLE clients ADD COLUMN goals text",
  "ALTER TABLE clients ADD COLUMN pain_points text",
  "ALTER TABLE clients ADD COLUMN current_stack text DEFAULT '[]'",
  "ALTER TABLE clients ADD COLUMN decision_makers text DEFAULT '[]'",
  "ALTER TABLE clients ADD COLUMN budget_signal text",
  "ALTER TABLE clients ADD COLUMN timeline_signal text",
  "ALTER TABLE clients ADD COLUMN source text",
  "ALTER TABLE clients ADD COLUMN notes text",

  // task_dismissals — per-task snooze records
  `CREATE TABLE IF NOT EXISTS task_dismissals (
    id text PRIMARY KEY NOT NULL,
    task_id text NOT NULL,
    snoozed_until integer NOT NULL,
    reason text,
    created_at integer NOT NULL
  )`,
  "CREATE INDEX IF NOT EXISTS task_dismissals_task_idx ON task_dismissals (task_id)",

  // scratch_notes — quick-capture from /today
  `CREATE TABLE IF NOT EXISTS scratch_notes (
    id text PRIMARY KEY NOT NULL,
    body text NOT NULL,
    client_id text REFERENCES clients(id) ON DELETE SET NULL,
    due_at integer,
    done_at integer,
    created_at integer NOT NULL
  )`,
  "CREATE INDEX IF NOT EXISTS scratch_notes_done_idx ON scratch_notes (done_at)",
];

async function main() {
  const c = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
  });
  for (const s of STMTS) {
    try {
      await c.execute(s);
      console.log("OK:", s.replace(/\s+/g, " ").slice(0, 80));
    } catch (e) {
      const msg = (e as Error).message;
      if (msg.includes("duplicate column name") || msg.includes("already exists")) {
        console.log("SKIP (exists):", s.replace(/\s+/g, " ").slice(0, 70));
      } else {
        console.log("FAIL:", s.replace(/\s+/g, " ").slice(0, 70), "→", msg);
      }
    }
  }
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
