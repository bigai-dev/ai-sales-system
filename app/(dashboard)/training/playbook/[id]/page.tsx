import Link from "next/link";
import { notFound } from "next/navigation";
import { getPlayById } from "@/lib/queries/plays";
import { SOURCE_LABEL, SOURCE_TONE } from "@/lib/schemas/play";
import PlayCard from "@/components/training/PlayCard";
import { PageHeader, Panel, StatusChip } from "@/components/ui";
import { routes } from "@/lib/constants/routes";

export const metadata = { title: "Play" };

export default async function PlayDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const play = await getPlayById(id);
  if (!play) notFound();

  return (
    <div className="space-y-6">
      <PageHeader back={{ href: routes.playbook(), label: "Playbook" }} title="Play" />

      <PlayCard play={play} />

      <Panel title="Where it came from">
        <div className="flex flex-wrap items-center gap-2">
          <StatusChip tone={SOURCE_TONE[play.source]}>{SOURCE_LABEL[play.source]}</StatusChip>
          <span className="text-xs text-muted">
            Saved {new Date(play.createdAt).toLocaleString("en-MY")}
          </span>
        </div>
        <div className="mt-4 text-sm">
          <span className="text-muted">From the call:</span>{" "}
          <Link href={routes.call(play.callId)} className="underline underline-offset-2">
            {play.callTitle ?? "Open call"}
          </Link>{" "}
          {play.callDate !== null && (
            <span className="text-muted">· {new Date(play.callDate).toLocaleDateString("en-MY")}</span>
          )}
        </div>
      </Panel>
    </div>
  );
}
