import Link from "next/link";
import { notFound } from "next/navigation";
import { eq, desc } from "drizzle-orm";
import { db } from "@/db/client";
import { clients, deals, calls } from "@/db/schema";
import { formatMoney, sstSen } from "@/db/lib/money";
import ProposalsList from "@/components/ProposalsList";
import CallsList from "@/components/CallsList";
import ClientTimeline from "@/components/ClientTimeline";
import InvoiceButton from "@/components/InvoiceButton";
import ClientDiscoveryPanel, { type Discovery } from "@/components/ClientDiscoveryPanel";
import { createCallForClient } from "@/app/(dashboard)/calls/actions";
import { OUTCOME_LABEL, OUTCOME_TONE } from "@/lib/schemas/call-debrief";
import { SOURCE_LABEL, STAGE_NAME } from "@/lib/constants/labels";

const TONE_CHIP: Record<"good" | "warn" | "bad" | "info", string> = {
  good: "chip-good",
  warn: "chip-warn",
  bad: "chip-bad",
  info: "chip-info",
};

type Params = { id: string };

export default async function ClientDetailPage({ params }: { params: Promise<Params> }) {
  const { id } = await params;
  const [client] = await db.select().from(clients).where(eq(clients.id, id));
  if (!client) notFound();

  const clientDeals = await db.select().from(deals).where(eq(deals.clientId, id));
  const totalCents = clientDeals.reduce((s, d) => s + d.valueCents, 0);

  return (
    <section>
      <Link href="/clients" className="text-xs text-muted hover:text-foreground">
        ← Back to clients
      </Link>
      <div className="flex items-end justify-between mt-2 mb-6">
        <div>
          <div className="text-xs text-muted uppercase tracking-wider">Client</div>
          <h1 className="text-2xl font-bold mt-1">
            <span className="text-accent">{client.name}</span>
          </h1>
          <div className="text-xs text-muted mt-1">
            {client.contactName}
            {client.contactRole ? ` · ${client.contactRole}` : ""}
            {client.industry ? ` · ${client.industry}` : ""}
            {client.size ? ` · ${client.size}` : ""}
            {client.employees ? ` · ${client.employees.toLocaleString()} emp` : ""}
            {client.devCount ? ` · ${client.devCount} engineers` : ""}
          </div>
          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            {client.source && (
              <span className="chip chip-info text-[10px]">
                {SOURCE_LABEL[client.source as keyof typeof SOURCE_LABEL] ?? client.source}
              </span>
            )}
            {client.budgetSignal && (
              <span className="chip text-[10px]" title="Budget signal">
                💰 {client.budgetSignal}
              </span>
            )}
            {client.timelineSignal && (
              <span className="chip text-[10px]" title="Timeline signal">
                📅 {client.timelineSignal}
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <form action={createCallForClient}>
            <input type="hidden" name="clientId" value={id} />
            <button type="submit" className="btn-ghost">
              Plan call
            </button>
          </form>
          <Link href={`/clients/${id}/health-check`} className="btn">
            Generate readiness audit
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="panel kpi">
          <div className="l">Workshop value</div>
          <div className="v mt-1">{formatMoney(client.arrCents)}</div>
        </div>
        <div className="panel kpi">
          <div className="l">Stage</div>
          <div className="v mt-1 text-base">{client.stage}</div>
        </div>
        <div className="panel kpi">
          <div className="l">AI readiness</div>
          <div className="v mt-1">{client.health}</div>
          <div className="bar-track mt-3">
            <div className="bar-fill" style={{ width: `${client.health}%` }} />
          </div>
        </div>
        <div className="panel kpi">
          <div className="l">Open deals</div>
          <div className="v mt-1">{clientDeals.length}</div>
          <div className="text-[11px] text-muted mt-2">{formatMoney(totalCents)} total</div>
        </div>
      </div>

      <div data-tour="client-discovery" className="mb-6">
        <ClientDiscoveryPanel
          clientId={id}
          initial={{
            goals: client.goals ?? null,
            painPoints: client.painPoints ?? null,
            currentStack: (client.currentStack as string[] | null) ?? [],
            decisionMakers:
              (client.decisionMakers as Discovery["decisionMakers"]) ?? [],
            budgetSignal: client.budgetSignal ?? null,
            timelineSignal: client.timelineSignal ?? null,
            source: client.source ?? null,
            notes: client.notes ?? null,
          }}
        />
      </div>

      <div data-tour="client-timeline" className="mb-4">
        <ClientTimeline clientId={id} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <CallsList clientId={id} />
        <ProposalsList clientId={id} clientName={client.name} />
      </div>

      <div className="grid grid-cols-12 gap-4">
        <div className="panel p-5 col-span-12 md:col-span-7">
          <div className="font-semibold mb-3">Engineering profile</div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <ProfileRow label="Industry" value={client.industry ?? "—"} />
            <ProfileRow label="Size" value={client.size ?? "—"} />
            <ProfileRow
              label="Total employees"
              value={client.employees ? client.employees.toLocaleString() : "—"}
            />
            <ProfileRow
              label="Engineers"
              value={client.devCount ? String(client.devCount) : "—"}
            />
          </div>
        </div>
        <div data-tour="deals-panel" className="panel p-5 col-span-12 md:col-span-5">
          <div className="font-semibold mb-3">Deals</div>
          {clientDeals.length === 0 && (
            <div className="text-sm text-muted">No deals yet for this client.</div>
          )}
          <div className="space-y-2">
            {clientDeals.map((d) => (
              <div
                key={d.id}
                className="rounded-xl border border-border-subtle bg-surface p-3 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="text-sm font-medium">
                    {d.stage} — {STAGE_NAME[d.stage as "S" | "P" | "A" | "N" | "C" | "O"] ?? "—"}
                  </div>
                  <div className="text-[11px] text-muted">
                    {d.lastActivity ?? "—"}
                  </div>
                </div>
                <div className="text-right shrink-0 flex flex-col items-end gap-1.5">
                  <div className="text-sm font-semibold">{formatMoney(d.valueCents)}</div>
                  {d.stage === "O" ? (
                    <>
                      <div className="text-[11px] text-muted leading-tight">
                        + 8% SST {formatMoney(sstSen(d.valueCents))}
                        <div className="text-foreground">
                          Invoiced {formatMoney(d.valueCents + sstSen(d.valueCents))}
                        </div>
                      </div>
                      <InvoiceButton
                        dealId={d.id}
                        invoiceNumber={d.invoiceNumber}
                      />
                    </>
                  ) : (
                    <div className="text-[11px] text-muted">{d.probability}% prob</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border-subtle bg-surface px-3 py-2">
      <div className="text-[10px] uppercase tracking-wider text-muted">{label}</div>
      <div className="text-sm font-medium mt-0.5">{value}</div>
    </div>
  );
}
