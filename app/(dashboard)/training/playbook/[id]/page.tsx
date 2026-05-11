import Link from "next/link";
import { notFound } from "next/navigation";
import { getPlayById } from "@/lib/queries/plays";
import { SOURCE_LABEL, SOURCE_TONE } from "@/lib/schemas/play";
import PlayCard from "@/components/training/PlayCard";

export const metadata = {
  title: "Play",
};

export default async function PlayDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const play = await getPlayById(id);
  if (!play) notFound();

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs text-muted">
          <Link href="/training" className="underline underline-offset-2">
            Training
          </Link>
          <span className="mx-1">/</span>
          <Link href="/training/playbook" className="underline underline-offset-2">
            Playbook
          </Link>
          <span className="mx-1">/</span> Play
        </div>
        <h1 className="text-2xl font-semibold mt-1">Play detail</h1>
      </div>

      <PlayCard play={play} />

      <div className="panel p-5">
        <div className="text-xs uppercase tracking-wider text-muted">Source</div>
        <div className="mt-1 flex items-center gap-2">
          <span className={`chip chip-${SOURCE_TONE[play.source]}`}>
            {SOURCE_LABEL[play.source]}
          </span>
          <span className="text-xs text-muted">
            Auto-extracted on {new Date(play.createdAt).toLocaleString()}
          </span>
        </div>
        <div className="mt-4 text-sm">
          <span className="text-muted">From the call:</span>{" "}
          <Link href={`/calls/${play.callId}`} className="underline underline-offset-2">
            {play.callTitle ?? "Open call"}
          </Link>{" "}
          {play.callDate !== null && (
            <span className="text-muted">
              · {new Date(play.callDate).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
