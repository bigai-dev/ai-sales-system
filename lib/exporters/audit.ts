import type { LatestHealthCheck } from "@/lib/queries/health";
import { READINESS_STATUS_LABEL, type ReadinessStatus } from "@/lib/constants/labels";

export function buildAuditMarkdown(audit: LatestHealthCheck): string {
  const lines: string[] = [];
  const date = new Date(audit.generatedAt).toLocaleDateString("en-MY", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  lines.push(`# Readiness check — ${audit.client}`);
  lines.push(`_Generated ${date}_`);
  if (audit.meta) lines.push(`_${audit.meta}_`);
  lines.push(``);

  lines.push(
    `## Overall: ${audit.overall.score}/100 — ${READINESS_STATUS_LABEL[audit.overall.status as ReadinessStatus] ?? audit.overall.status}`,
  );
  lines.push(audit.summary);
  lines.push(``);

  if (audit.callouts.length > 0) {
    lines.push(`**Top-line callouts:** ` + audit.callouts.map((c) => c.value).join(" · "));
    lines.push(``);
  }

  lines.push(`## By area`);
  for (const d of audit.dimensions) {
    lines.push(
      `### ${d.name} — ${d.score}/100 (${READINESS_STATUS_LABEL[d.status as ReadinessStatus] ?? d.status})`,
    );
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
    lines.push(`## Risks`);
    for (const r of audit.risks) {
      lines.push(`### [${r.tag}] ${r.title}`);
      lines.push(r.detail);
      lines.push(``);
    }
  }

  if (audit.actions.length > 0) {
    lines.push(`## Next steps`);
    for (const a of audit.actions) {
      lines.push(`### ${a.title} _(${a.impact})_`);
      lines.push(a.detail);
      lines.push(``);
    }
  }

  return lines.join("\n").trimEnd() + "\n";
}
