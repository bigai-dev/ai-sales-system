import type { Metadata } from "next";
import { notFound } from "next/navigation";
import BriefingPanel from "@/components/calls/BriefingPanel";
import NotesEditor from "@/components/calls/NotesEditor";
import DebriefPanel from "@/components/calls/DebriefPanel";
import { getCallById } from "@/lib/queries/calls";
import { CALL_STATUS_LABEL, type CallStatus } from "@/lib/constants/labels";
import { routes } from "@/lib/constants/routes";
import { PageHeader } from "@/components/ui";

type Params = { id: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { id } = await params;
  const call = await getCallById(id);
  return { title: call?.clientName ? `Call · ${call.clientName}` : "Call" };
}

function whenLabel(call: { scheduledAt: number | null; startedAt: number }): string {
  const fmt = (ms: number) =>
    new Date(ms).toLocaleString("en-MY", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  return call.scheduledAt ? `Planned for ${fmt(call.scheduledAt)}` : `Started ${fmt(call.startedAt)}`;
}

export default async function CallDetailPage({ params }: { params: Promise<Params> }) {
  const { id } = await params;
  const call = await getCallById(id);
  if (!call) notFound();

  return (
    <section className="space-y-4">
      <PageHeader
        back={
          call.clientId
            ? { href: routes.client(call.clientId), label: call.clientName ?? "Client" }
            : { href: routes.calls(), label: "Calls" }
        }
        title={call.clientName ?? "No client"}
        description={`${CALL_STATUS_LABEL[call.status as CallStatus] ?? call.status} · ${whenLabel(call)}`}
      />

      <BriefingPanel callId={call.id} briefing={call.briefing ?? null} dryRun={call.dryRun ?? null} />
      <NotesEditor callId={call.id} initialNotes={call.notes ?? ""} hasDebrief={!!call.debrief} />
      <DebriefPanel callId={call.id} debrief={call.debrief ?? null} analyzedAt={call.analyzedAt} />
    </section>
  );
}
