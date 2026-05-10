/**
 * Parse a short money string like "RM 132K", "RM2.84M", or legacy "$132K"
 * into integer sen (1/100 RM). Accepts both prefixes so old form inputs
 * keep working.
 */
export function parseMoney(s: string): number {
  const m = s.replace(/[$,\s]|RM/gi, "").match(/^(-?[\d.]+)([KMB])?$/i);
  if (!m) return 0;
  const n = parseFloat(m[1]);
  const mult = { K: 1_000, M: 1_000_000, B: 1_000_000_000 }[m[2]?.toUpperCase() ?? ""] ?? 1;
  return Math.round(n * mult * 100);
}

export function formatMoney(cents: number): string {
  const v = cents / 100;
  if (v >= 1_000_000) return `RM ${(v / 1_000_000).toFixed(2).replace(/\.?0+$/, "")}M`;
  if (v >= 1_000) return `RM ${Math.round(v / 1_000)}K`;
  return `RM ${v.toFixed(0)}`;
}

const SST_RATE = 0.08;

export function sstSen(cents: number): number {
  return Math.round(cents * SST_RATE);
}

export function formatMoneyExact(cents: number): string {
  const v = cents / 100;
  return `RM ${v.toLocaleString("en-MY", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}
