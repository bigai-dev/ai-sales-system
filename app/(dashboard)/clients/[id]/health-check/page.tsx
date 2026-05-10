import Link from "next/link";
import { notFound } from "next/navigation";
import HealthCheckView from "@/components/views/HealthCheckView";
import GenerateHealthCheckButton from "@/components/GenerateHealthCheckButton";
import ProposalsList from "@/components/ProposalsList";
import { getClientById } from "@/lib/queries/clients";
import { getLatestHealthCheck } from "@/lib/queries/health";

type Params = { id: string };

export default async function ClientHealthCheckPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { id } = await params;
  const client = await getClientById(id);
  if (!client) notFound();

  const data = await getLatestHealthCheck(id);

  if (!data) {
    const dimensions = [
      { name: "Tooling", hint: "Editor + agent stack maturity (Cursor, Claude Code, MCP)" },
      { name: "Practices", hint: "PR review, prompt hygiene, agent guardrails" },
      { name: "Culture", hint: "Leadership posture toward AI, blast-radius tolerance" },
      { name: "Velocity", hint: "Cycle time, PRs/dev/wk, deploy frequency" },
      { name: "Adoption", hint: "% of engineers using AI tools daily, license utilization" },
      { name: "Outcomes", hint: "Defect rate, time-to-feature, dev satisfaction" },
    ];
    return (
      <section>
        <Link href={`/clients/${id}`} className="text-xs text-muted hover:text-foreground">
          ← Back to client
        </Link>
        <div className="mt-4 panel p-8">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 mb-8">
            <div className="max-w-xl">
              <div className="text-xs text-muted uppercase tracking-wider">
                Engineering readiness audit
              </div>
              <h1 className="text-2xl font-semibold tracking-tight mt-1">
                No audit yet for <span className="text-accent">{client.name}</span>
              </h1>
              <p className="text-sm text-muted mt-3 leading-relaxed">
                DeepSeek will grade {client.name} on the six dimensions below, then
                recommend cohort size, content split, and follow-ups for the 2-day
                workshop. Takes ~10–20 seconds.
              </p>
            </div>
            <div className="shrink-0">
              <GenerateHealthCheckButton clientId={id} />
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {dimensions.map((d, i) => (
              <div
                key={d.name}
                className="rounded-lg border border-border-subtle bg-surface-elevated/40 px-4 py-3"
              >
                <div className="flex items-center justify-between">
                  <div className="font-medium text-sm">{d.name}</div>
                  <div className="font-mono text-xs text-muted tabular-nums">
                    {String(i + 1).padStart(2, "0")}
                  </div>
                </div>
                <div className="text-[11px] text-muted mt-1 leading-snug">{d.hint}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
      <Link href={`/clients/${id}`} className="text-xs text-muted hover:text-foreground">
        ← Back to client
      </Link>
      <div className="mt-4 space-y-4">
        <HealthCheckView data={data} clientId={id} />
        <ProposalsList clientId={id} clientName={client.name} />
      </div>
    </>
  );
}
