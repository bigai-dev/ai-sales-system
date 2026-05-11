import Link from "next/link";
import { getAllPlays, type PlayListItem } from "@/lib/queries/plays";
import PlayCard from "@/components/training/PlayCard";
import { DRILL_BUCKETS } from "@/lib/schemas/drill";

export const metadata = {
  title: "Playbook",
};

const BUCKETS: PlayListItem["bucket"][] = [...DRILL_BUCKETS, "other"];

type SearchParams = { bucket?: string; show?: string };

export default async function PlaybookPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const all = await getAllPlays();
  const showHidden = sp.show === "all";
  const bucketFilter = sp.bucket as PlayListItem["bucket"] | undefined;

  const filtered = all
    .filter((p) => (showHidden ? true : !p.hidden))
    .filter((p) => (bucketFilter ? p.bucket === bucketFilter : true));

  const counts = new Map<PlayListItem["bucket"], number>();
  for (const p of all) {
    if (p.hidden && !showHidden) continue;
    counts.set(p.bucket, (counts.get(p.bucket) ?? 0) + 1);
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs text-muted">
          <Link href="/training" className="underline underline-offset-2">
            Training
          </Link>
          <span className="mx-1">/</span> Playbook
        </div>
        <h1 className="text-2xl font-semibold mt-1">Playbook</h1>
        <div className="text-sm text-muted mt-1 max-w-2xl">
          Auto-extracted from your real calls. Each play anchors a winning move to a specific
          moment with a specific client. Pin the keepers; hide the noise.
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <FilterChip href="/training/playbook" active={!bucketFilter} label="All" count={filtered.length} />
        {BUCKETS.map((b) => (
          <FilterChip
            key={b}
            href={`/training/playbook?bucket=${b}${showHidden ? "&show=all" : ""}`}
            active={bucketFilter === b}
            label={labelOf(b)}
            count={counts.get(b) ?? 0}
          />
        ))}
        <span className="ml-auto text-xs">
          {showHidden ? (
            <Link href="/training/playbook" className="underline underline-offset-2">
              Hide hidden plays
            </Link>
          ) : (
            <Link href="/training/playbook?show=all" className="underline underline-offset-2">
              Show hidden plays
            </Link>
          )}
        </span>
      </div>

      {filtered.length === 0 ? (
        <div className="panel p-8 text-center">
          <div className="text-sm text-muted">
            No plays yet. Plays auto-extract when:
          </div>
          <ul className="text-sm text-muted mt-3 inline-block text-left list-disc pl-5 space-y-1">
            <li>You debrief a call where the AI flagged your handling as a strength.</li>
            <li>A drill best-response shows up live in your call notes.</li>
            <li>You close a deal — every objection raised gets extracted.</li>
          </ul>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((p) => (
            <PlayCard key={p.id} play={p} />
          ))}
        </div>
      )}
    </div>
  );
}

function FilterChip({
  href,
  active,
  label,
  count,
}: {
  href: string;
  active: boolean;
  label: string;
  count: number;
}) {
  return (
    <Link
      href={href}
      className={`text-xs px-3 py-1 rounded-full border ${
        active
          ? "bg-accent text-accent-foreground border-accent"
          : "border-border-subtle text-muted hover:text-foreground"
      }`}
    >
      {label} <span className="opacity-70">({count})</span>
    </Link>
  );
}

function labelOf(b: PlayListItem["bucket"]): string {
  return b[0].toUpperCase() + b.slice(1);
}
