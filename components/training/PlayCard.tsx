"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { togglePinPlay, toggleHidePlay } from "@/lib/ai/play-actions";
import { DRILL_BUCKET_LABEL } from "@/lib/schemas/drill";
import {
  SOURCE_LABEL,
  SOURCE_TONE,
  type PlayListItem,
} from "@/lib/schemas/play";

const BUCKET_LABEL: Record<PlayListItem["bucket"], string> = {
  ...DRILL_BUCKET_LABEL,
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
    <div
      className={`panel p-5 ${pinned ? "border-accent" : ""} ${hidden ? "opacity-60" : ""}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="chip chip-warn">{BUCKET_LABEL[play.bucket]}</span>
          <span className={`chip chip-${SOURCE_TONE[play.source]}`}>
            {SOURCE_LABEL[play.source]}
          </span>
          {pinned && <span className="chip chip-good">Pinned</span>}
          {hidden && <span className="chip">Hidden</span>}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={togglePin}
            disabled={pending}
            title={pinned ? "Unpin" : "Pin to top"}
            className="text-xs text-muted hover:text-foreground"
          >
            {pinned ? "Unpin" : "Pin"}
          </button>
          <button
            type="button"
            onClick={toggleHide}
            disabled={pending}
            title={hidden ? "Show again" : "Hide from list"}
            className="text-xs text-muted hover:text-foreground"
          >
            {hidden ? "Show" : "Hide"}
          </button>
        </div>
      </div>

      <Link href={`/training/playbook/${play.id}`} className="block mt-3">
        <div className="text-xs uppercase tracking-wider text-muted">Prospect said</div>
        <div className="mt-1 italic text-sm">&ldquo;{play.scenario}&rdquo;</div>
        <div className="mt-3 text-xs uppercase tracking-wider text-muted">You replied</div>
        <div className="mt-1 text-sm line-clamp-3">{play.repResponseExcerpt}</div>
      </Link>

      <div className="mt-3 text-[11px] text-muted border-t border-border-subtle pt-2 flex items-center justify-between">
        <span>
          {play.clientName ? `From call with ${play.clientName}` : "From a call"} ·{" "}
          {new Date(play.createdAt).toLocaleDateString()}
        </span>
        <span>Outcome: {play.outcome}</span>
      </div>
    </div>
  );
}
