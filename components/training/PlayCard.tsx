"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { togglePinPlay, toggleHidePlay } from "@/lib/ai/play-actions";
import { TOPIC_LABEL } from "@/lib/constants/labels";
import { SOURCE_LABEL, SOURCE_TONE, type PlayListItem } from "@/lib/schemas/play";
import { Button, Panel, SectionLabel, StatusChip } from "@/components/ui";
import { routes } from "@/lib/constants/routes";

const BUCKET_LABEL: Record<PlayListItem["bucket"], string> = {
  ...TOPIC_LABEL,
  other: "Other",
};

export default function PlayCard({ play }: { play: PlayListItem }) {
  const [pinned, setPinned] = useState(play.pinned);
  const [hidden, setHidden] = useState(play.hidden);
  const [pending, startTransition] = useTransition();

  function togglePin() {
    startTransition(async () => {
      const r = await togglePinPlay(play.id);
      if (r.ok) setPinned(r.data.pinned);
    });
  }
  function toggleHide() {
    startTransition(async () => {
      const r = await toggleHidePlay(play.id);
      if (r.ok) setHidden(r.data.hidden);
    });
  }

  return (
    <Panel className={`${pinned ? "border-accent" : ""} ${hidden ? "opacity-60" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <StatusChip tone="warn">{BUCKET_LABEL[play.bucket]}</StatusChip>
          <span className="text-xs text-muted">{SOURCE_LABEL[play.source]}</span>
          {pinned && <StatusChip tone="good">Pinned</StatusChip>}
          {hidden && <StatusChip>Hidden</StatusChip>}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button variant="text" size="sm" onClick={togglePin} disabled={pending}>
            {pinned ? "Unpin" : "Pin"}
          </Button>
          <Button variant="text" size="sm" onClick={toggleHide} disabled={pending}>
            {hidden ? "Show" : "Hide"}
          </Button>
        </div>
      </div>

      <Link href={routes.playbook(play.id)} className="mt-3 block">
        <SectionLabel>Client said</SectionLabel>
        <div className="mt-1 text-sm italic">&ldquo;{play.scenario}&rdquo;</div>
        <SectionLabel className="mt-3">You replied</SectionLabel>
        <div className="mt-1 line-clamp-3 text-sm">{play.repResponseExcerpt}</div>
      </Link>

      <div className="mt-3 flex items-center justify-between border-t border-border-subtle pt-2 text-xs text-muted">
        <span>
          {play.clientName ? `Call with ${play.clientName}` : "From a call"} ·{" "}
          {new Date(play.createdAt).toLocaleDateString("en-MY")}
        </span>
        <span className="sr-only">Tone: {SOURCE_TONE[play.source]}</span>
      </div>
    </Panel>
  );
}
