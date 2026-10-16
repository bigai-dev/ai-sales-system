import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import type { LatestHealthCheck } from "@/lib/queries/health";
import { buildAuditMarkdown } from "@/lib/exporters/audit";
import GenerateHealthCheckButton from "../GenerateHealthCheckButton";
import GenerateProposalButton from "../GenerateProposalButton";
import CopyMarkdownButton from "../CopyMarkdownButton";
import { PageHeader, Panel, SectionLabel, StatusChip } from "@/components/ui";
import {
  READINESS_STATUS_LABEL,
  READINESS_STATUS_TONE,
  type ReadinessStatus,
  type Tone,
} from "@/lib/constants/labels";
import { BTN } from "@/lib/constants/copy";
import { routes } from "@/lib/constants/routes";

const BAR: Record<ReadinessStatus, string> = {
  Healthy: "var(--success)",
  "At risk": "var(--warning)",
  Critical: "var(--danger)",
};

function statusOf(s: string): ReadinessStatus {
  return (s in READINESS_STATUS_LABEL ? s : "At risk") as ReadinessStatus;
}

function Trend({ trend }: { trend: "up" | "down" | "flat" }) {
  if (trend === "up") return <TrendingUp size={12} className="text-success" aria-label="up" />;
  if (trend === "down") return <TrendingDown size={12} className="text-warning" aria-label="down" />;
  return <Minus size={12} className="text-muted" aria-label="flat" />;
}

/** The full readiness check for one client. */
export default function ReadinessView({
  data,
  clientId,
}: {
  data: LatestHealthCheck;
  clientId: string;
}) {
  const markdown = buildAuditMarkdown(data);
  const overall = statusOf(data.overall.status);

  return (
    <section>
      <PageHeader
        back={{ href: routes.client(clientId), label: data.client }}
        title="Readiness check"
        description={data.meta}
        actions={
          <>
            <GenerateHealthCheckButton clientId={clientId} variant="ghost" label={BTN.runAgain} />
            <CopyMarkdownButton
              markdown={markdown}
              label={BTN.copy}
              copiedLabel="Copied"
              variant="primary"
            />
          </>
        }
      />

      <Panel className="mb-4">
        <div className="flex flex-col gap-5 md:flex-row md:items-start">
          <div className="flex shrink-0 items-center gap-4">
            <div
              className="flex h-24 w-24 items-center justify-center rounded-full"
              style={{
                background: `conic-gradient(var(--accent) ${data.overall.score}%, var(--surface-elevated) 0)`,
              }}
            >
              <div className="flex h-20 w-20 flex-col items-center justify-center rounded-full bg-surface">
                <div className="text-2xl font-semibold tabular-nums">{data.overall.score}</div>
                <div className="text-xs text-muted">of 100</div>
              </div>
            </div>
            <div className="space-y-1">
              <StatusChip tone={READINESS_STATUS_TONE[overall]}>
                {READINESS_STATUS_LABEL[overall]}
              </StatusChip>
              <div className="text-xs text-muted">Industry average: {data.overall.peers}</div>
              <div className="text-xs text-muted">{data.overall.delta}</div>
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <SectionLabel>Summary</SectionLabel>
            <p className="mt-1 text-sm leading-relaxed text-foreground">{data.summary}</p>
            {data.callouts.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {data.callouts.map((c) => (
                  <StatusChip key={c.value} tone={c.tone as Tone}>
                    {c.value}
                  </StatusChip>
                ))}
              </div>
            )}
          </div>
        </div>
      </Panel>

      <SectionLabel className="mb-2">By area</SectionLabel>
      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
        {data.dimensions.map((d) => {
          const s = statusOf(d.status);
          return (
            <Panel key={d.name} padding="sm">
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm font-semibold">{d.name}</div>
                <div className="text-lg font-semibold tabular-nums">{d.score}</div>
              </div>
              <div className="bar-track mt-2">
                <div
                  className="h-full rounded"
                  style={{ width: `${d.score}%`, background: BAR[s] }}
                />
              </div>
              <p className="mt-2 text-xs leading-snug text-muted">{d.summary}</p>
              {d.metrics.length > 0 && (
                <div className="mt-3 space-y-1">
                  {d.metrics.map((m) => (
                    <div key={m.label} className="flex items-center justify-between gap-2 text-xs">
                      <span className="text-muted">{m.label}</span>
                      <span className="inline-flex items-center gap-1 font-medium tabular-nums">
                        {m.value}
                        <Trend trend={m.trend} />
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Panel>
          );
        })}
      </div>

      {data.risks.length > 0 && (
        <Panel title="Risks" className="mb-4" padding="sm">
          <ul className="divide-y divide-border-subtle">
            {data.risks.map((r) => (
              <li key={r.title} className="flex items-start gap-3 py-2.5">
                <StatusChip tone={r.tone as Tone} className="mt-0.5 shrink-0">
                  {r.tag}
                </StatusChip>
                <div className="min-w-0">
                  <div className="text-sm font-medium">{r.title}</div>
                  <div className="mt-0.5 text-xs text-muted">{r.detail}</div>
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      )}

      {data.actions.length > 0 && (
        <Panel
          title="Next steps"
          aside={<GenerateProposalButton clientId={clientId} />}
        >
          <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {data.actions.slice(0, 6).map((a) => (
              <li key={a.title} className="rounded-lg border border-border-subtle p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="text-sm font-medium">{a.title}</div>
                  <span className="shrink-0 text-xs text-muted">{a.impact}</span>
                </div>
                <div className="mt-1 text-xs leading-snug text-muted">{a.detail}</div>
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </section>
  );
}
