import Link from "next/link";
import { desc } from "drizzle-orm";
import { db } from "@/db/client";
import { clients, healthChecks } from "@/db/schema";

const STATUS_CHIP: Record<"Healthy" | "At risk" | "Critical", string> = {
  Healthy: "chip-good",
  "At risk": "chip-warn",
  Critical: "chip-bad",
};

// Lower number = more leverage to audit before sending the next sales touch.
const STAGE_PRIORITY: Record<string, number> = {
  Negotiation: 0,
  Proposal: 1,
  Discovery: 2,
  Qualified: 3,
  Lead: 4,
  "Closed-won": 5,
};

function timeAgo(ms: number): string {
  const d = Math.floor((Date.now() - ms) / 86_400_000);
  if (d <= 0) return "today";
  if (d === 1) return "yesterday";
  if (d < 7) return `${d}d ago`;
  if (d < 30) return `${Math.floor(d / 7)}w ago`;
  return `${Math.floor(d / 30)}mo ago`;
}

export default async function ReadinessIndexPage() {
  const [clientList, allChecks] = await Promise.all([
    db.select().from(clients).orderBy(desc(clients.lastActivityAt)),
    db.select().from(healthChecks).orderBy(desc(healthChecks.generatedAt)),
  ]);

  const latestByClient = new Map<string, (typeof allChecks)[number]>();
  for (const hc of allChecks) {
    if (!latestByClient.has(hc.clientId)) latestByClient.set(hc.clientId, hc);
  }

  // Sort: pending audits first (high-leverage stages float up), then audited.
  const sorted = [...clientList].sort((a, b) => {
    const aHasAudit = latestByClient.has(a.id) ? 1 : 0;
    const bHasAudit = latestByClient.has(b.id) ? 1 : 0;
    if (aHasAudit !== bHasAudit) return aHasAudit - bHasAudit;
    const ap = STAGE_PRIORITY[a.stage] ?? 9;
    const bp = STAGE_PRIORITY[b.stage] ?? 9;
    return ap - bp;
  });

  const audited = latestByClient.size;
  const total = clientList.length;
  const pending = total - audited;

  return (
    <section>
      <div className="flex items-end justify-between mb-6 gap-4 flex-wrap">
        <div>
          <div className="text-xs text-muted uppercase tracking-wider">Readiness</div>
          <h1 className="text-2xl font-semibold mt-1 tracking-tight">
            Engineering AI-coding readiness audits
          </h1>
          <p className="text-xs text-muted mt-2 max-w-2xl leading-relaxed">
            Run an audit before scoping a workshop. Each grades the team across
            Tooling, Practices, Culture, Velocity, Adoption, and Outcomes — so
            the cohort, Day-1/Day-2 split, and follow-ups land where they move
            the needle.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <span className="chip">{total} clients</span>
          <span className="chip chip-good">{audited} audited</span>
          {pending > 0 && <span className="chip chip-warn">{pending} pending</span>}
        </div>
      </div>

      <div className="panel p-1.5">
        <div className="space-y-0.5">
          {sorted.map((c) => {
            const hc = latestByClient.get(c.id);
            const statusKey = (hc?.status ?? "Healthy") as keyof typeof STATUS_CHIP;
            const isHighLeverage =
              !hc && (c.stage === "Negotiation" || c.stage === "Proposal");
            return (
              <Link
                key={c.id}
                href={`/clients/${c.id}/health-check`}
                className="group row-hover rounded-lg px-4 py-3 flex items-center gap-4"
              >
                <div className="w-9 h-9 rounded bg-surface-elevated text-accent flex items-center justify-center font-mono text-[12px] font-medium shrink-0">
                  {c.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="font-medium text-sm truncate">{c.name}</div>
                    <span className="chip">{c.stage}</span>
                    {isHighLeverage && (
                      <span className="chip chip-warn">audit before next touch</span>
                    )}
                  </div>
                  <div className="text-[11px] text-muted mt-0.5 truncate">
                    {c.industry ?? "—"}
                    {c.size ? ` · ${c.size}` : ""}
                    {c.devCount ? ` · ${c.devCount} engineers` : ""}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    {hc ? (
                      <span className={`chip ${STATUS_CHIP[statusKey]}`}>
                        <span className="font-mono tabular-nums font-semibold">
                          {hc.overallScore}
                        </span>
                        <span className="opacity-50 mx-1.5">·</span>
                        {hc.status}
                      </span>
                    ) : (
                      <span className="chip">Not generated</span>
                    )}
                    <div className="text-[11px] text-muted mt-1">
                      {hc
                        ? timeAgo(hc.generatedAt)
                        : c.lastActivityAt
                          ? `Active ${timeAgo(c.lastActivityAt)}`
                          : "No activity yet"}
                    </div>
                  </div>
                  <ChevronRight />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function ChevronRight() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-muted group-hover:text-accent transition-colors shrink-0"
      aria-hidden
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}
