import { getCallsByClient } from "@/lib/queries/calls";
import { timeAgo } from "@/lib/format/time";
import CallRow from "./calls/CallRow";
import { Panel } from "@/components/ui";

/** The calls panel on a client's page. */
export default async function CallsList({ clientId }: { clientId: string }) {
  const rows = await getCallsByClient(clientId);

  return (
    <Panel title="Calls" aside={<span className="text-xs text-muted">{rows.length} on record</span>}>
      {rows.length === 0 ? (
        <p className="text-sm text-muted">
          No calls yet. Press <strong>Plan call</strong> above to start one.
        </p>
      ) : (
        <div className="divide-y divide-border-subtle">
          {rows.map((c) => (
            <CallRow key={c.id} call={c} when={timeAgo(c.scheduledAt ?? c.startedAt)} showClient={false} />
          ))}
        </div>
      )}
    </Panel>
  );
}
