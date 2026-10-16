import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { clients, deals } from "@/db/schema";
import { formatMoney, sstSen } from "@/db/lib/money";
import ProposalsList from "@/components/ProposalsList";
import CallsList from "@/components/CallsList";
import ClientTimeline from "@/components/ClientTimeline";
import InvoiceButton from "@/components/InvoiceButton";
import AddDealDialog from "@/components/AddDealDialog";
import DealRowActions from "@/components/clients/DealRowActions";
import ClientDiscoveryPanel, { type Discovery } from "@/components/ClientDiscoveryPanel";
import PlanCallButton from "@/components/PlanCallButton";
import {
  READINESS_STATUS_LABEL,
  READINESS_STATUS_TONE,
  deriveClientStage,
  readinessStatusFromScore,
  stageLabel,
  type StageCode,
} from "@/lib/constants/labels";
import { BTN } from "@/lib/constants/copy";
import { routes } from "@/lib/constants/routes";
import { ButtonLink, PageHeader, Panel, StatusChip } from "@/components/ui";

type Params = { id: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { id } = await params;
  const [client] = await db.select({ name: clients.name }).from(clients).where(eq(clients.id, id));
  return { title: client?.name ?? "Client" };
}

export default async function ClientDetailPage({ params }: { params: Promise<Params> }) {
  const { id } = await params;
  const [client] = await db.select().from(clients).where(eq(clients.id, id));
  if (!client) notFound();

  const clientDeals = await db.select().from(deals).where(eq(deals.clientId, id));
  const clientStage = stageLabel(deriveClientStage(clientDeals));
  const readiness = readinessStatusFromScore(client.health);

  const description = [
    client.contactName,
    client.contactRole,
    client.industry,
    client.size,
    client.employees ? `${client.employees.toLocaleString()} staff` : null,
    client.devCount ? `${client.devCount} engineers` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <section>
      <PageHeader
        back={{ href: routes.clients(), label: "Clients" }}
        title={client.name}
        description={description}
        actions={
          <>
            <PlanCallButton clientId={id} />
            <ButtonLink href={routes.readiness(id)}>{BTN.runReadiness}</ButtonLink>
          </>
        }
      />

      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="panel kpi">
          <div className="l">Workshop value</div>
          <div className="v mt-1">{formatMoney(client.arrCents)}</div>
        </div>
        <div className="panel kpi">
          <div className="l">Stage</div>
          <div className="v mt-1 text-base">{clientStage}</div>
        </div>
        <div className="panel kpi">
          <div className="l">Readiness score</div>
          <div className="mt-1 flex items-baseline gap-2">
            <div className="v">{client.health}</div>
            <StatusChip tone={READINESS_STATUS_TONE[readiness]}>
              {READINESS_STATUS_LABEL[readiness]}
            </StatusChip>
          </div>
          <div className="bar-track mt-3">
            <div className="bar-fill" style={{ width: `${client.health}%` }} />
          </div>
        </div>
      </div>

      <div data-tour="client-discovery" className="mb-4">
        <ClientDiscoveryPanel
          clientId={id}
          initial={{
            goals: client.goals ?? null,
            painPoints: client.painPoints ?? null,
            currentStack: (client.currentStack as string[] | null) ?? [],
            decisionMakers: (client.decisionMakers as Discovery["decisionMakers"]) ?? [],
            budgetSignal: client.budgetSignal ?? null,
            timelineSignal: client.timelineSignal ?? null,
            source: client.source ?? null,
            notes: client.notes ?? null,
          }}
        />
      </div>

      <Panel
        data-tour="deals-panel"
        title="Deals"
        aside={<AddDealDialog clients={[{ id, name: client.name }]} />}
        className="mb-4"
      >
        {clientDeals.length === 0 ? (
          <p className="text-sm text-muted">No deals yet for this client.</p>
        ) : (
          <ul className="divide-y divide-border-subtle">
            {clientDeals.map((d) => {
              const won = d.stage === "O";
              return (
                <li
                  key={d.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-medium tabular-nums">{formatMoney(d.valueCents)}</div>
                    <div className="mt-0.5 text-xs text-muted">
                      {won
                        ? `Total incl. 8% SST ${formatMoney(d.valueCents + sstSen(d.valueCents))}`
                        : `${d.probability}% chance`}
                      {d.lastActivity ? ` · ${d.lastActivity}` : ""}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {won && <InvoiceButton dealId={d.id} invoiceNumber={d.invoiceNumber} />}
                    <DealRowActions dealId={d.id} stage={d.stage as StageCode} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>

      <div className="mb-4">
        <ClientTimeline clientId={id} />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <CallsList clientId={id} />
        <ProposalsList clientId={id} clientName={client.name} />
      </div>
    </section>
  );
}
