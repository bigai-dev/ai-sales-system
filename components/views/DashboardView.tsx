import KpiCard from "../KpiCard";
import DateRangeTabs from "../DateRangeTabs";
import PipelineByStage from "../PipelineByStage";
import CallActivityChart from "../CallActivityChart";
import CoachingPanel from "../CoachingPanel";
import { rangeLabel, type Range } from "@/lib/quarter";
import type { Kpi, Stage } from "@/lib/data";
import type { CoachingPanelData } from "@/lib/queries/coaching";

type Props = {
  kpis: Kpi[];
  stages: Stage[];
  coaching: CoachingPanelData;
  range: Range;
};

export default function DashboardView({ kpis, stages, coaching, range }: Props) {
  return (
    <section>
      <div className="flex items-end justify-between mb-6">
        <div>
          <div className="text-xs text-muted uppercase tracking-wider">My pipeline</div>
          <h1 className="text-2xl font-bold mt-1">
            Workshops booked — <span className="text-accent">{rangeLabel(range)}</span>
          </h1>
        </div>
        <DateRangeTabs active={range} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {kpis.map((k) => (
          <KpiCard key={k.label} kpi={k} />
        ))}
      </div>

      <div className="grid grid-cols-12 gap-4 mb-6">
        <PipelineByStage stages={stages} />
        <div className="panel p-5 col-span-12 lg:col-span-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="font-semibold">Discovery activity</div>
              <div className="text-xs text-muted">Last 8 weeks</div>
            </div>
            <div className="flex gap-3 text-xs text-muted">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#a8a39a" }} />
                Calls made
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#d6cfc4" }} />
                Picked up
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                Conversations
              </span>
            </div>
          </div>
          <CallActivityChart />
        </div>
      </div>

      <CoachingPanel data={coaching} />
    </section>
  );
}
