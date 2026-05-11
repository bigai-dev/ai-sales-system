import Link from "next/link";
import { notFound } from "next/navigation";
import DrillForm from "@/components/training/DrillForm";
import { getRecentDrills } from "@/lib/queries/drills";
import { getCurrentBest } from "@/lib/ai/scenario-generator";
import {
  DRILL_BUCKETS,
  DRILL_BUCKET_HELP,
  DRILL_BUCKET_LABEL,
  type DrillBucket,
} from "@/lib/schemas/drill";

export const metadata = {
  title: "Drill",
};

function isBucket(s: string): s is DrillBucket {
  return (DRILL_BUCKETS as readonly string[]).includes(s);
}

export default async function DrillBucketPage({
  params,
}: {
  params: Promise<{ bucket: string }>;
}) {
  const { bucket: rawBucket } = await params;
  if (!isBucket(rawBucket)) {
    notFound();
  }
  const bucket = rawBucket;

  const [best, recent] = await Promise.all([
    getCurrentBest(bucket),
    getRecentDrills(bucket, 5),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs text-muted">
          <Link href="/training" className="underline underline-offset-2">
            Training
          </Link>
          <span className="mx-1">/</span>
          <Link href="/training/drills" className="underline underline-offset-2">
            Drills
          </Link>
          <span className="mx-1">/</span>
          {DRILL_BUCKET_LABEL[bucket]}
        </div>
        <h1 className="text-2xl font-semibold mt-1">{DRILL_BUCKET_LABEL[bucket]}</h1>
        <div className="text-sm text-muted mt-1 max-w-2xl">{DRILL_BUCKET_HELP[bucket]}</div>
      </div>

      <DrillForm bucket={bucket} initialBest={best} />

      {recent.length > 0 && (
        <div className="panel p-5">
          <div className="text-xs uppercase tracking-wider text-muted mb-3">Recent drills</div>
          <div className="space-y-3">
            {recent.map((d) => (
              <div key={d.id} className="border-t first:border-t-0 border-border-subtle pt-3 first:pt-0">
                <div className="flex items-baseline justify-between gap-3">
                  <div className="font-semibold">{d.grade}</div>
                  <div className="text-[11px] text-muted">
                    {new Date(d.createdAt).toLocaleString()}
                  </div>
                </div>
                <div className="text-xs text-muted mt-1 line-clamp-2">{d.repResponse}</div>
                <div className="text-[11px] mt-1 italic">{d.feedback}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
