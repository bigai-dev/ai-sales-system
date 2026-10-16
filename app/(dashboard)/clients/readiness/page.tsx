import Link from "next/link";
import { desc } from "drizzle-orm";
import { ChevronRight } from "lucide-react";
import { db } from "@/db/client";
import { clients, healthChecks } from "@/db/schema";
import { DAY_MS } from "@/lib/format/time";
import {
  READINESS_STATUS_LABEL,
  READINESS_STATUS_TONE,
  stageLabel,
  type ReadinessStatus,
  type StageCode,
} from "@/lib/constants/labels";
import { getClientStageMap } from "@/lib/queries/clients";
import { PAGE } from "@/lib/constants/copy";
import { routes } from "@/lib/constants/routes";
import { PageHeader, Panel, StatusChip } from "@/components/ui";

export const metadata = { title: PAGE.readinessIndex.title };

// Lower number = more useful to check before the next conversation.
const STAGE_PRIORITY: Record<StageCode, number> = { C: 0, N: 1, A: 2, P: 3, S: 4, O: 5 };

function timeAgo(ms: number): string {
  const d = Math.floor((Date.now() - ms) / DAY_MS);
  if (d <= 0) return "today";
  if (d === 1) return "yesterday";
  if (d < 7) return `${d}d ago`;
  if (d < 30) return `${Math.floor(d / 7)}w ago`;
  return `${Math.floor(d / 30)}mo ago`;
}

export default async function ReadinessIndexPage() {
  const [clientRows, allChecks, stageMap] = await Promise.all([
    db.select().from(clients).orderBy(desc(clients.lastActivityAt)),
    db.select().from(healthChecks).orderBy(desc(healthChecks.generatedAt)),
    getClientStageMap(),
  ]);
  const clientList = clientRows.map((c) => ({
    ...c,
    stageCode: stageMap.get(c.id) ?? ("S" as StageCode),
  }));

  const latestByClient = new Map<string, (typeof allChecks)[number]>();
  for (const hc of allChecks) {
    if (!latestByClient.has(hc.clientId)) latestByClient.set(hc.clientId, hc);
  }

  // Unchecked clients first (late-stage ones at the top), then checked.
  const sorted = [...clientList].sort((a, b) => {
    const aHas = latestByClient.has(a.id) ? 1 : 0;
    const bHas = latestByClient.has(b.id) ? 1 : 0;
    if (aHas !== bHas) return aHas - bHas;
    return (STAGE_PRIORITY[a.stageCode] ?? 9) - (STAGE_PRIORITY[b.stageCode] ?? 9);
  });

  const checked = latestByClient.size;
  const pending = clientList.length - checked;

  return (
    <section>
      <PageHeader
        back={{ href: routes.clients(), label: "Clients" }}
        title={PAGE.readinessIndex.title}
        description={`${checked} checked · ${pending} not yet checked. ${PAGE.readinessIndex.description}`}
      />

      <Panel padding="none">
        <ul className="divide-y divide-border-subtle">
          {sorted.map((c) => {
            const hc = latestByClient.get(c.id);
            const status = (hc?.status ?? "Healthy") as ReadinessStatus;
            const checkSoon = !hc && (c.stageCode === "N" || c.stageCode === "C");
            return (
              <li key={c.id}>
                <Link
                  href={routes.readiness(c.id)}
                  className="row-hover flex items-center gap-4 px-4 py-3"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded bg-surface-elevated font-mono text-xs font-medium text-accent">
                    {c.initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="truncate text-sm font-medium">{c.name}</div>
                      <span className="text-xs text-muted">{stageLabel(c.stageCode)}</span>
                      {checkSoon && <StatusChip tone="warn">Check before next call</StatusChip>}
                    </div>
                    <div className="mt-0.5 truncate text-xs text-muted">
                      {c.industry ?? "—"}
                      {c.size ? ` · ${c.size}` : ""}
                      {c.devCount ? ` · ${c.devCount} engineers` : ""}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <div className="text-right">
                      {hc ? (
                        <StatusChip tone={READINESS_STATUS_TONE[status]}>
                          <span className="font-mono font-semibold tabular-nums">{hc.overallScore}</span>
                          <span className="opacity-60">·</span>
                          {READINESS_STATUS_LABEL[status]}
                        </StatusChip>
                      ) : (
                        <StatusChip>Not checked yet</StatusChip>
                      )}
                      <div className="mt-1 text-xs text-muted">
                        {hc
                          ? timeAgo(hc.generatedAt)
                          : c.lastActivityAt
                            ? `Active ${timeAgo(c.lastActivityAt)}`
                            : "No activity yet"}
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-quiet" aria-hidden />
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </Panel>
    </section>
  );
}
