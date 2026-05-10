import type { LatestHealthCheck } from "@/lib/queries/health";
import { buildAuditMarkdown } from "@/lib/exporters/audit";
import GenerateHealthCheckButton from "../GenerateHealthCheckButton";
import GenerateProposalButton from "../GenerateProposalButton";
import CopyMarkdownButton from "../CopyMarkdownButton";

const dimTone: Record<string, string> = {
  Healthy: "chip-good",
  "At risk": "chip-warn",
  Critical: "chip-bad",
};

const dimBar: Record<string, string> = {
  Healthy: "var(--success)",
  "At risk": "var(--warning)",
  Critical: "var(--danger)",
};

const trendArrow: Record<string, string> = {
  up: "▲",
  down: "▼",
  flat: "—",
};

export default function HealthCheckView({
  data,
  clientId,
}: {
  data: LatestHealthCheck;
  clientId?: string;
}) {
  const markdown = buildAuditMarkdown(data);
  return (
    <section>
      <div className="flex items-end justify-between mb-6 gap-4 flex-wrap">
        <div>
          <div className="text-xs text-muted uppercase tracking-wider">
            Engineering readiness audit
          </div>
          <h1 className="text-2xl font-bold mt-1">
            Audit — <span className="text-accent">{data.client}</span>
          </h1>
          <div className="text-xs text-muted mt-1">{data.meta}</div>
        </div>
        <div className="flex gap-2">
          {clientId && (
            <GenerateHealthCheckButton clientId={clientId} variant="ghost" label="Re-run analysis" />
          )}
          <CopyMarkdownButton
            markdown={markdown}
            label="Export to client"
            copiedLabel="✓ Copied to clipboard"
            variant="primary"
          />
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4 mb-6">
        <div className="panel p-5 col-span-12 lg:col-span-4 flex items-center gap-4">
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center"
            style={{
              background:
                "conic-gradient(var(--accent) " +
                data.overall.score +
                "%, var(--surface-elevated) 0)",
            }}
          >
            <div className="w-20 h-20 rounded-full bg-surface flex flex-col items-center justify-center">
              <div className="text-2xl font-bold">{data.overall.score}</div>
              <div className="text-[10px] text-muted">/100</div>
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold">{data.overall.score}</div>
            <span className={`chip ${dimTone[data.overall.status] ?? "chip-warn"}`}>
              {data.overall.status}
            </span>
            <div className="text-[11px] text-muted mt-2">
              Industry avg: {data.overall.peers}
            </div>
            <div className="text-[11px] text-amber-400">{data.overall.delta}</div>
          </div>
        </div>

        <div className="panel p-5 col-span-12 lg:col-span-8">
          <div className="text-xs uppercase tracking-wider text-muted mb-1">
            AI executive summary
          </div>
          <p className="text-sm text-foreground leading-relaxed">{data.summary}</p>
          <div className="flex flex-wrap gap-2 mt-3">
            {data.callouts.map((c) => (
              <span key={c.value} className={`chip chip-${c.tone}`}>
                {c.value}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="text-xs uppercase tracking-wider text-muted mb-2">
        Health by dimension
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {data.dimensions.map((d) => (
          <div key={d.name} className="panel p-4">
            <div className="flex items-center justify-between">
              <div className="font-semibold">{d.name}</div>
              <span className={`chip ${dimTone[d.status] ?? "chip-warn"}`}>{d.status}</span>
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <div className="text-3xl font-bold">{d.score}</div>
              <div className="text-[11px] text-muted">/100</div>
            </div>
            <div className="bar-track mt-2">
              <div
                style={{
                  width: `${d.score}%`,
                  height: "100%",
                  background: dimBar[d.status] ?? dimBar["At risk"],
                  borderRadius: 6,
                }}
              />
            </div>
            <div className="text-[11px] text-muted mt-2 leading-snug">{d.summary}</div>
            <div className="mt-3 space-y-1">
              {d.metrics.map((m) => (
                <div key={m.label} className="flex items-center justify-between text-[12px]">
                  <span className="text-muted">{m.label}</span>
                  <span className="font-medium">
                    {m.value}{" "}
                    <span
                      className={
                        m.trend === "up"
                          ? "text-success"
                          : m.trend === "down"
                          ? "text-warning"
                          : "text-muted"
                      }
                    >
                      {trendArrow[m.trend]}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {data.risks.length > 0 && (
        <>
          <div className="text-xs uppercase tracking-wider text-muted mb-2">
            Risks &amp; issues
          </div>
          <div className="space-y-3 mb-6">
            {data.risks.map((r) => (
              <div
                key={r.title}
                className="panel p-4 flex items-start justify-between gap-4"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`chip chip-${r.tone}`}>{r.tag}</span>
                    <div className="font-semibold">{r.title}</div>
                  </div>
                  <div className="text-[12px] text-muted">{r.detail}</div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {data.actions.length > 0 && (
        <div className="panel p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-xs uppercase tracking-wider text-muted">
                Recommended actions
              </div>
              <div className="font-semibold mt-1">
                <span className="text-accent">{data.actions.length} concrete next steps</span>
              </div>
            </div>
            {clientId && <GenerateProposalButton clientId={clientId} />}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {data.actions.slice(0, 6).map((a) => (
              <div
                key={a.title}
                className="rounded-xl border border-border-subtle bg-surface p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="font-medium text-sm">{a.title}</div>
                  <span className="chip chip-good">{a.impact}</span>
                </div>
                <div className="text-[12px] text-muted mt-2 leading-snug">{a.detail}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
