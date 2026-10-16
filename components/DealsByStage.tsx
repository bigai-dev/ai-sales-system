import Link from "next/link";
import type { Stage } from "@/lib/types/ui";
import { routes } from "@/lib/constants/routes";
import { Panel } from "@/components/ui";

/** Deals grouped by stage: how many, how much, and what that's worth weighted by chance. */
export default function DealsByStage({ stages }: { stages: Stage[] }) {
  return (
    <Panel
      className="col-span-12 lg:col-span-7"
      title="Deals by stage"
      aside={
        <Link href={routes.deals()} className="text-xs text-muted underline underline-offset-2">
          Open board
        </Link>
      }
    >
      <ul className="space-y-2">
        {stages.map((s) => (
          <li key={s.name}>
            <Link
              href={routes.deals()}
              className="funnel-stage row-hover flex items-center justify-between gap-4 px-4 py-3"
            >
              <div className="flex w-1/3 items-center gap-3">
                <div className="h-8 w-2 shrink-0 rounded" style={{ background: s.color }} />
                <div className="min-w-0">
                  <div className="text-sm font-semibold">{s.name}</div>
                  <div className="text-xs text-muted">
                    {s.count} deal{s.count === 1 ? "" : "s"}
                  </div>
                </div>
              </div>
              <div className="mx-2 max-w-md flex-1">
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: `${s.pct}%`, background: s.color }} />
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold tabular-nums">{s.value}</div>
                <div className="text-xs tabular-nums text-muted">weighted {s.weighted}</div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </Panel>
  );
}
