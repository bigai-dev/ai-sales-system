import { getRecentCalls } from "@/lib/queries/calls";
import CallRow from "@/components/calls/CallRow";
import { EmptyState, PageHeader, Panel } from "@/components/ui";
import { PAGE } from "@/lib/constants/copy";

export const metadata = { title: PAGE.calls.title };

function formatWhen(ms: number): string {
  const diff = ms - Date.now();
  const future = diff > 0;
  const absMs = Math.abs(diff);
  const m = Math.floor(absMs / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return future ? `in ${m}m` : `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return future ? `in ${h}h` : `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return future ? `in ${d}d` : `${d}d ago`;
  if (d < 30) return future ? `in ${Math.floor(d / 7)}w` : `${Math.floor(d / 7)}w ago`;
  return new Date(ms).toLocaleDateString("en-MY", { year: "numeric", month: "short", day: "numeric" });
}

export default async function CallsPage() {
  const calls = await getRecentCalls(50);

  // Planned: soonest first. Calls without a time fall to the bottom.
  const planned = calls
    .filter((c) => c.status === "planned" || c.status === "scheduled")
    .sort(
      (a, b) =>
        (a.scheduledAt ?? Number.POSITIVE_INFINITY) - (b.scheduledAt ?? Number.POSITIVE_INFINITY),
    );
  // Completed: most recent first.
  const completed = calls
    .filter((c) => c.status === "completed" || c.status === "ended")
    .sort((a, b) => (b.endedAt ?? b.startedAt) - (a.endedAt ?? a.startedAt));

  return (
    <section className="space-y-4">
      <PageHeader
        title={PAGE.calls.title}
        description={`${planned.length} planned · ${completed.length} completed. Plan a new call from a client's page.`}
      />

      {calls.length === 0 && (
        <EmptyState
          title="No calls yet."
          hint="Open a client and press Plan call to start one."
        />
      )}

      {planned.length > 0 && (
        <Panel title="Planned" padding="sm">
          <div className="divide-y divide-border-subtle">
            {planned.map((c) => (
              <CallRow key={c.id} call={c} when={formatWhen(c.scheduledAt ?? c.startedAt)} />
            ))}
          </div>
        </Panel>
      )}

      {completed.length > 0 && (
        <Panel title="Completed" padding="sm">
          <div className="divide-y divide-border-subtle">
            {completed.map((c) => (
              <CallRow key={c.id} call={c} when={formatWhen(c.endedAt ?? c.startedAt)} />
            ))}
          </div>
        </Panel>
      )}
    </section>
  );
}
