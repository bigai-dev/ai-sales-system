import { formatMoneyExact } from "@/db/lib/money";
import { VENUE_LABEL } from "@/lib/schemas/proposal";
import { getProposalsByClient } from "@/lib/queries/proposals";
import { getLatestHealthCheck } from "@/lib/queries/health";
import { timeAgo } from "@/lib/format/time";
import { safeFilename } from "@/lib/format/filename";
import ViewProposalButton from "./ViewProposalButton";
import GenerateProposalButton from "./GenerateProposalButton";
import { Panel } from "@/components/ui";
import { ERR } from "@/lib/constants/copy";

/** Saved proposals for one client, with the button to write a new one. */
export default async function ProposalsList({
  clientId,
  clientName,
}: {
  clientId: string;
  clientName: string;
}) {
  const [rows, readiness] = await Promise.all([
    getProposalsByClient(clientId),
    getLatestHealthCheck(clientId),
  ]);
  const hasReadiness = !!readiness;

  return (
    <Panel
      title="Proposals"
      aside={
        <GenerateProposalButton
          clientId={clientId}
          disabled={!hasReadiness}
          disabledHint={ERR.needReadiness}
        />
      }
    >
      {rows.length === 0 ? (
        <p className="text-sm text-muted">
          {hasReadiness
            ? "No proposals yet. The AI writes one from the readiness check."
            : "No proposals yet. Run a readiness check first; the proposal is written from it."}
        </p>
      ) : (
        <div className="divide-y divide-border-subtle">
          {rows.map((p) => (
            <div
              key={p.id}
              className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 py-3 first:pt-0 last:pb-0"
            >
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">
                  {p.cohortSize} pax · {VENUE_LABEL[p.venue]}
                </div>
                <div className="mt-0.5 text-xs text-muted">{timeAgo(p.generatedAt)}</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold tabular-nums">
                  {formatMoneyExact(p.totalCents)}
                </div>
                <div className="mt-0.5 text-xs text-muted">incl. SST</div>
              </div>
              <div className="col-span-2 -mt-1 flex items-center justify-end gap-1">
                <a
                  href={`/api/proposal/pdf?id=${encodeURIComponent(p.id)}`}
                  download={safeFilename(clientName)}
                  className="btn-text btn-sm"
                >
                  Download
                </a>
                <ViewProposalButton id={p.id} clientName={clientName} generatedAt={p.generatedAt} />
              </div>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}
