import type { LatestHealthCheck } from "@/lib/queries/health";

export function buildAuditMarkdown(audit: LatestHealthCheck): string {
  const lines: string[] = [];
  const date = new Date(audit.generatedAt).toLocaleDateString("en-MY", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  lines.push(`# Engineering readiness audit — ${audit.client}`);
  lines.push(`_Generated ${date}_`);
  if (audit.meta) lines.push(`_${audit.meta}_`);
  lines.push(``);

  lines.push(`## Overall: ${audit.overall.score}/100 — ${audit.overall.status}`);
  lines.push(audit.summary);
  lines.push(``);

  if (audit.callouts.length > 0) {
    lines.push(`**Top-line callouts:** ` + audit.callouts.map((c) => c.value).join(" · "));
    lines.push(``);
  }

  lines.push(`## Health by dimension`);
  for (const d of audit.dimensions) {
    lines.push(`### ${d.name} — ${d.score}/100 (${d.status})`);
    lines.push(d.summary);
    if (d.metrics.length > 0) {
      lines.push(``);
      for (const m of d.metrics) {
        const trendArrow = m.trend === "up" ? "▲" : m.trend === "down" ? "▼" : "—";
        lines.push(`- ${m.label}: **${m.value}** ${trendArrow}`);
      }
    }
    lines.push(``);
  }

  if (audit.risks.length > 0) {
    lines.push(`## Risks & issues`);
    for (const r of audit.risks) {
      lines.push(`### [${r.tag}] ${r.title}`);
      lines.push(r.detail);
      lines.push(``);
    }
  }

  if (audit.actions.length > 0) {
    lines.push(`## Recommended actions`);
    for (const a of audit.actions) {
      lines.push(`### ${a.title} _(${a.impact})_`);
      lines.push(a.detail);
      lines.push(``);
    }
  }

  return lines.join("\n").trimEnd() + "\n";
}
