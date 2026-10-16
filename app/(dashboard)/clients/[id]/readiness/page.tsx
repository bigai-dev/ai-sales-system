import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ReadinessView from "@/components/views/ReadinessView";
import GenerateHealthCheckButton from "@/components/GenerateHealthCheckButton";
import ProposalsList from "@/components/ProposalsList";
import { PageHeader, Panel } from "@/components/ui";
import { getClientById } from "@/lib/queries/clients";
import { getLatestHealthCheck } from "@/lib/queries/health";
import { AREA_LABEL } from "@/lib/constants/labels";
import { PAGE } from "@/lib/constants/copy";
import { routes } from "@/lib/constants/routes";

type Params = { id: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { id } = await params;
  const client = await getClientById(id);
  return { title: client ? `${PAGE.readiness.title} · ${client.name}` : PAGE.readiness.title };
}

const AREA_HINT: Record<keyof typeof AREA_LABEL, string> = {
  tooling: "Which AI coding tools the team already uses",
  practices: "Code review habits, prompt hygiene, safety rails",
  culture: "How leadership feels about AI and risk",
  velocity: "How fast work moves today",
  adoption: "How many engineers use AI tools daily",
  outcomes: "Quality, speed to feature, team satisfaction",
};

export default async function ClientReadinessPage({ params }: { params: Promise<Params> }) {
  const { id } = await params;
  const client = await getClientById(id);
  if (!client) notFound();

  const data = await getLatestHealthCheck(id);

  if (!data) {
    return (
      <section>
        <PageHeader
          back={{ href: routes.client(id), label: client.name }}
          title={PAGE.readiness.title}
          description={`No readiness check yet for ${client.name}.`}
          actions={<GenerateHealthCheckButton clientId={id} />}
        />
        <Panel>
          <p className="max-w-xl text-sm leading-relaxed text-muted">
            The AI scores {client.name}&apos;s team on the six areas below, then suggests
            cohort size, content split and follow-ups for the 2-day workshop. Takes about
            15 seconds.
          </p>
          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
            {(Object.keys(AREA_LABEL) as (keyof typeof AREA_LABEL)[]).map((k) => (
              <div key={k} className="rounded-lg border border-border-subtle px-4 py-3">
                <div className="text-sm font-medium">{AREA_LABEL[k]}</div>
                <div className="mt-1 text-xs leading-snug text-muted">{AREA_HINT[k]}</div>
              </div>
            ))}
          </div>
        </Panel>
      </section>
    );
  }

  return (
    <div className="space-y-4">
      <ReadinessView data={data} clientId={id} />
      <ProposalsList clientId={id} clientName={client.name} />
    </div>
  );
}
