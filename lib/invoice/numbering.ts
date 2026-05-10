import { sql } from "drizzle-orm";
import { db } from "@/db/client";
import { invoiceCounters } from "@/db/schema";

/**
 * Generates the next sequential invoice number in the format `INV-{YYYY}-0001`.
 *
 * Per-year counter, restarts at 0001 every Jan 1. Atomic via libSQL's
 * `INSERT … ON CONFLICT DO UPDATE … RETURNING` — two concurrent calls cannot
 * be assigned the same number even on the same DB connection. Replaces the
 * older scan-and-increment approach which had a TOCTOU race.
 */
export async function nextInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const rows = await db
    .insert(invoiceCounters)
    .values({ year, lastSeq: 1 })
    .onConflictDoUpdate({
      target: invoiceCounters.year,
      set: { lastSeq: sql`${invoiceCounters.lastSeq} + 1` },
    })
    .returning({ lastSeq: invoiceCounters.lastSeq });
  const seq = rows[0]?.lastSeq ?? 1;
  return `INV-${year}-${String(seq).padStart(4, "0")}`;
}
