import type { CoachingPanelData } from "@/lib/queries/coaching";

export function buildCoachingMarkdown(data: CoachingPanelData): string {
  const lines: string[] = [];
  const date = new Date().toLocaleDateString("en-MY", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  lines.push(`# Closing call coaching scorecard`);
  lines.push(`_Generated ${date} · source: ${data.sourcedFrom === "db" ? "AI-graded calls" : "baseline targets"}_`);
  lines.push(``);

  lines.push(`## Score breakdown`);
  for (const s of data.scores) {
    lines.push(`- **${s.label}** — ${s.score}/100`);
  }
  lines.push(``);

  if (data.opportunities.length > 0) {
    lines.push(`## Top improvement opportunities`);
    for (const o of data.opportunities) {
      lines.push(`### ${o.title} _(${o.impact.text})_`);
      lines.push(o.detail);
      lines.push(``);
    }
  }

  if (data.wins.length > 0) {
    lines.push(`## What's working`);
    for (const [prefix, num, suffix] of data.wins) {
      const numPart = num ? ` **${num}**` : "";
      lines.push(`- ${prefix}${numPart} ${suffix}`.trim());
    }
    lines.push(``);
  }

  return lines.join("\n").trimEnd() + "\n";
}
