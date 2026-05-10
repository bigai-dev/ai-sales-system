import { like } from "drizzle-orm";
import { db } from "@/db/client";
import { deals } from "@/db/schema";

/**
 * Generates the next sequential invoice number in the format `INV-{YYYY}-0001`.
 *
 * Per-year counter — restarts at 0001 every Jan 1. Numbers are assigned by
 * scanning existing `deals.invoiceNumber` values prefixed with the current year
 * and taking max + 1.
 *
 * Race condition: two concurrent invoice generations could be assigned the
 * same number. Acceptable for a solo-founder system where invoice issuance
 * is a manual click. Documented limitation.
 */
export async function nextInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `INV-${year}-`;
  const rows = await db
    .select({ invoiceNumber: deals.invoiceNumber })
    .from(deals)
    .where(like(deals.invoiceNumber, `${prefix}%`));

  let max = 0;
  for (const r of rows) {
    if (!r.invoiceNumber) continue;
    const n = parseInt(r.invoiceNumber.slice(prefix.length), 10);
    if (Number.isFinite(n) && n > max) max = n;
  }
  return `${prefix}${String(max + 1).padStart(4, "0")}`;
}
