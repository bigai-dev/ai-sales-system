import Link from "next/link";
import { notFound } from "next/navigation";
import BriefingPanel from "@/components/calls/BriefingPanel";
import NotesEditor from "@/components/calls/NotesEditor";
import DebriefPanel from "@/components/calls/DebriefPanel";
import { getCallById } from "@/lib/queries/calls";
import { STATUS_LABEL, type CallStatus } from "@/lib/constants/labels";

type Params = { id: string };

export default async function CallDetailPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { id } = await params;
  const call = await getCallById(id);
  if (!call) notFound();

  const startedStr = call.scheduledAt
    ? `Planned for ${new Date(call.scheduledAt).toLocaleString("en-MY", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}`
    : `Started ${new Date(call.startedAt).toLocaleString("en-MY", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}`;

  return (
    <section className="space-y-4">
      {call.clientId ? (
        <Link
          href={`/clients/${call.clientId}`}
          className="text-xs text-muted hover:text-foreground"
        >
          ← Back to {call.clientName ?? "client"}
        </Link>
      ) : (
        <Link href="/calls" className="text-xs text-muted hover:text-foreground">
          ← Back to calls
        </Link>
      )}

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-xs text-muted uppercase tracking-wider">
            Call session
          </div>
          <h1 className="text-2xl font-bold mt-1">
            <span className="text-accent">{call.clientName ?? "—"}</span>
          </h1>
          <div className="text-xs text-muted mt-1">
            {STATUS_LABEL[call.status as CallStatus] ?? call.status} · {startedStr}
          </div>
        </div>
      </div>

      <BriefingPanel
        callId={call.id}
        briefing={call.briefing ?? null}
        dryRun={call.dryRun ?? null}
      />
      <NotesEditor
        callId={call.id}
        initialNotes={call.notes ?? ""}
        hasDebrief={!!call.debrief}
      />
      <DebriefPanel
        callId={call.id}
        debrief={call.debrief ?? null}
        analyzedAt={call.analyzedAt}
      />
    </section>
  );
}
