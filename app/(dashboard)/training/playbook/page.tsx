import Link from "next/link";
import { getAllPlays, type PlayListItem } from "@/lib/queries/plays";
import PlayCard from "@/components/training/PlayCard";
import { DRILL_BUCKETS } from "@/lib/schemas/drill";
import { TOPIC_LABEL } from "@/lib/constants/labels";
import { PAGE } from "@/lib/constants/copy";
import { routes } from "@/lib/constants/routes";
import { ButtonLink, EmptyState, PageHeader } from "@/components/ui";

export const metadata = { title: PAGE.playbook.title };

const TOPICS: PlayListItem["bucket"][] = [...DRILL_BUCKETS, "other"];

type SearchParams = { bucket?: string; show?: string };

export default async function PlaybookPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const all = await getAllPlays();
  const showHidden = sp.show === "all";
  const topicFilter = sp.bucket as PlayListItem["bucket"] | undefined;

  const filtered = all
    .filter((p) => (showHidden ? true : !p.hidden))
    .filter((p) => (topicFilter ? p.bucket === topicFilter : true));

  const counts = new Map<PlayListItem["bucket"], number>();
  for (const p of all) {
    if (p.hidden && !showHidden) continue;
    counts.set(p.bucket, (counts.get(p.bucket) ?? 0) + 1);
  }

  const hiddenCount = all.filter((p) => p.hidden).length;

  return (
    <div className="space-y-6">
      <PageHeader
        back={{ href: routes.training(), label: "Training" }}
        title={PAGE.playbook.title}
        description={`${PAGE.playbook.description} Pin the ones to keep; hide the rest.`}
        actions={
          hiddenCount > 0 ? (
            <ButtonLink
              href={showHidden ? routes.playbook() : `${routes.playbook()}?show=all`}
              variant="ghost"
              size="sm"
            >
              {showHidden ? "Hide hidden plays" : `Show ${hiddenCount} hidden`}
            </ButtonLink>
          ) : null
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <FilterChip href={routes.playbook()} active={!topicFilter} label="All" count={filtered.length} />
        {TOPICS.map((b) => (
          <FilterChip
            key={b}
            href={`${routes.playbook()}?bucket=${b}${showHidden ? "&show=all" : ""}`}
            active={topicFilter === b}
            label={labelOf(b)}
            count={counts.get(b) ?? 0}
          />
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No plays yet."
          hint={
            <>
              Plays are collected for you when: a call review flags something you handled
              well; a line you practised in role play shows up on a real call; or you win a
              deal (every objection you handled is saved).
            </>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
      className={`rounded-full border px-3 py-1 text-xs ${
        active
          ? "border-accent bg-accent text-accent-foreground"
          : "border-border-subtle text-muted hover:text-foreground"
      }`}
    >
      {label} <span className="opacity-70">({count})</span>
    </Link>
  );
}

function labelOf(b: PlayListItem["bucket"]): string {
  return b === "other" ? "Other" : TOPIC_LABEL[b];
}
