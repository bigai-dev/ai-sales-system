import { notFound } from "next/navigation";
import DrillForm from "@/components/training/DrillForm";
import { getRecentDrills } from "@/lib/queries/drills";
import { getCurrentBest } from "@/lib/ai/scenario-generator";
import { DRILL_BUCKETS, DRILL_BUCKET_HELP, type DrillBucket } from "@/lib/schemas/drill";
import { TOPIC_LABEL } from "@/lib/constants/labels";
import { routes } from "@/lib/constants/routes";
import { PageHeader, Panel } from "@/components/ui";

function isBucket(s: string): s is DrillBucket {
  return (DRILL_BUCKETS as readonly string[]).includes(s);
}

export async function generateMetadata({ params }: { params: Promise<{ bucket: string }> }) {
  const { bucket } = await params;
  return { title: isBucket(bucket) ? `Role play · ${TOPIC_LABEL[bucket]}` : "Role play" };
}

export default async function RolePlayTopicPage({
  params,
}: {
  params: Promise<{ bucket: string }>;
}) {
  const { bucket: raw } = await params;
  if (!isBucket(raw)) notFound();
  const bucket = raw;

  const [best, recent] = await Promise.all([getCurrentBest(bucket), getRecentDrills(bucket, 5)]);

  return (
    <div className="space-y-6">
      <PageHeader
        back={{ href: routes.rolePlay(), label: "Role play" }}
        title={`Role play · ${TOPIC_LABEL[bucket]}`}
        description={DRILL_BUCKET_HELP[bucket]}
      />

      <DrillForm bucket={bucket} initialBest={best} />

      {recent.length > 0 && (
        <Panel title="Recent role plays on this topic">
          <ul className="divide-y divide-border-subtle">
            {recent.map((d) => (
              <li key={d.id} className="py-3 first:pt-0 last:pb-0">
                <div className="flex items-baseline justify-between gap-3">
                  <div className="font-semibold tabular-nums">{d.grade}</div>
                  <div className="text-xs text-muted">
                    {new Date(d.createdAt).toLocaleString("en-MY")}
                  </div>
                </div>
                <div className="mt-1 line-clamp-2 text-xs text-muted">{d.repResponse}</div>
                <div className="mt-1 text-xs italic">{d.feedback}</div>
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </div>
  );
}
