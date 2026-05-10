import Link from "next/link";
import { formatMoneyExact } from "@/db/lib/money";
import { VENUE_LABEL } from "@/lib/schemas/proposal";
import { getProposalsByClient } from "@/lib/queries/proposals";
import { timeAgo } from "@/lib/format/time";
import ViewProposalButton from "./ViewProposalButton";

function safeFilename(client: string): string {
  const safe = client.replace(/[^a-z0-9]+/gi, "_").replace(/^_|_$/g, "");
  return `proposal-${safe || "client"}.pdf`;
}

export default async function ProposalsList({
  clientId,
  clientName,
}: {
  clientId: string;
  clientName: string;
}) {
  const rows = await getProposalsByClient(clientId);

  return (
    <div className="panel p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="font-semibold">Proposals</div>
        <div className="text-[11px] uppercase tracking-wider text-muted">
          {rows.length} saved
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="text-sm text-muted">
          No proposals yet.{" "}
          <Link
            href={`/clients/${clientId}/health-check`}
            className="text-accent hover:underline"
          >
            Generate one from the readiness audit →
          </Link>
        </div>
      ) : (
        <div className="divide-y divide-border-subtle">
          {rows.map((p) => (
            <div
              key={p.id}
              className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 items-center py-3 first:pt-0 last:pb-0"
            >
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">
                  {p.cohortSize} pax · {VENUE_LABEL[p.venue]}
                </div>
                <div className="text-[11px] text-muted mt-0.5">
                  {timeAgo(p.generatedAt)}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold tabular-nums">
                  {formatMoneyExact(p.totalCents)}
                </div>
                <div className="text-[10px] uppercase tracking-wider text-muted mt-0.5">
                  invoiced
                </div>
              </div>
              <div className="col-span-2 flex items-center justify-end gap-1 -mt-1">
                <a
                  href={`/api/proposal/pdf?id=${encodeURIComponent(p.id)}`}
                  download={safeFilename(clientName)}
                  className="btn-text"
                  title="Download without opening"
                >
                  Download
                </a>
                <ViewProposalButton
                  id={p.id}
                  clientName={clientName}
                  generatedAt={p.generatedAt}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
