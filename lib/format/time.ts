const DAY_MS = 86_400_000;

/**
 * Compact relative time. Always reads naturally regardless of magnitude.
 * "just now" → "5m ago" → "3h ago" → "2d ago" → "3w ago" → "5mo ago" → "Mar 2, 2026".
 *
 * For ages over a year, falls back to a localized en-MY date so the UI stops
 * pretending old things are still "recent."
 */
export function timeAgo(ms: number): string {
  const diff = Date.now() - ms;
  if (diff < 0) return "just now"; // future timestamps clamp to "just now"
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  if (d < 30) return `${Math.floor(d / 7)}w ago`;
  if (d < 365) return `${Math.floor(d / 30)}mo ago`;
  return new Date(ms).toLocaleDateString("en-MY", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Bidirectional relative time — handles past AND future timestamps.
 * "in 3d" / "2h ago" / "just now". Used by /today which shows both
 * upcoming briefings and overdue debriefs.
 */
export function relativeTime(eventAt: number, now: number = Date.now()): string {
  const delta = eventAt - now;
  const abs = Math.abs(delta);
  const direction = delta >= 0 ? "in" : "ago";
  if (abs < 60_000) return "now";
  const m = Math.floor(abs / 60_000);
  let label: string;
  if (m < 60) label = `${m}m`;
  else if (m < 60 * 24) label = `${Math.floor(m / 60)}h`;
  else if (m < 60 * 24 * 7) label = `${Math.floor(m / (60 * 24))}d`;
  else if (m < 60 * 24 * 30) label = `${Math.floor(m / (60 * 24 * 7))}w`;
  else if (m < 60 * 24 * 365) label = `${Math.floor(m / (60 * 24 * 30))}mo`;
  else label = `${Math.floor(m / (60 * 24 * 365))}y`;
  return direction === "in" ? `in ${label}` : `${label} ago`;
}

/**
 * Calendar-style time for upcoming events: "Tue 10:00am", "May 14 10:00am".
 */
export function calendarTime(eventAt: number, now: number = Date.now()): string {
  const d = new Date(eventAt);
  let hours = d.getHours();
  const mins = d.getMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "pm" : "am";
  hours = hours % 12 || 12;
  const time = `${hours}:${mins}${ampm}`;
  const daysOut = (eventAt - now) / 86_400_000;
  if (daysOut >= 0 && daysOut <= 7) {
    const today = new Date(now);
    const sameDay =
      d.getFullYear() === today.getFullYear() &&
      d.getMonth() === today.getMonth() &&
      d.getDate() === today.getDate();
    if (sameDay) return `Today ${time}`;
    const weekday = d.toLocaleDateString("en-US", { weekday: "short" });
    return `${weekday} ${time}`;
  }
  const md = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `${md} ${time}`;
}
