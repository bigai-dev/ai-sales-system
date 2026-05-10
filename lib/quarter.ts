export type Range = "week" | "month" | "quarter";

export function parseRange(v: string | string[] | undefined): Range {
  const s = Array.isArray(v) ? v[0] : v;
  return s === "week" || s === "month" ? s : "quarter";
}

export function rangeStartMs(range: Range, d = new Date()): number {
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth();
  const day = d.getUTCDate();
  switch (range) {
    case "week": {
      // ISO week: Monday as first day
      const dow = d.getUTCDay();
      const monday = day - ((dow + 6) % 7);
      return Date.UTC(y, m, monday);
    }
    case "month":
      return Date.UTC(y, m, 1);
    case "quarter":
      return Date.UTC(y, Math.floor(m / 3) * 3, 1);
  }
}

export function rangeLabel(range: Range, d = new Date()): string {
  switch (range) {
    case "week":
      return `week of ${d.toLocaleDateString("en-MY", { month: "short", day: "numeric" })}`;
    case "month":
      return d.toLocaleDateString("en-MY", { month: "long", year: "numeric" });
    case "quarter":
      return `Q${Math.floor(d.getUTCMonth() / 3) + 1} ${d.getUTCFullYear()}`;
  }
}

export function rangeCaption(range: Range): string {
  return `this ${range}`;
}

// Quarterly pipeline target in sen (1/100 RM). RM 1,000,000.
// Only meaningful when the active range is "quarter".
export const QUARTER_TARGET_CENTS = 1_000_000_00;
