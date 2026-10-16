import dynamic from "next/dynamic";
import KpiCard from "../KpiCard";
import DateRangeTabs from "../DateRangeTabs";
import DealsByStage from "../DealsByStage";
import CoachingPanel from "../CoachingPanel";
import { rangeLabel, type Range } from "@/lib/quarter";
import type { Kpi, Stage } from "@/lib/types/ui";
import type { CoachingPanelData } from "@/lib/queries/coaching";
import type { WeeklyCalls } from "@/lib/queries/calls";
import { PAGE } from "@/lib/constants/copy";
import { PageHeader, Panel } from "@/components/ui";

// chart.js is ~85KB gzipped; keep it in its own chunk that loads when the
// chart mounts rather than in the first dashboard payload.
const CallActivityChart = dynamic(() => import("../CallActivityChart"));

type Props = {
  kpis: Kpi[];
  stages: Stage[];
  coaching: CoachingPanelData;
  weeks: WeeklyCalls[];
  range: Range;
};

export default function DashboardView({ kpis, stages, coaching, weeks, range }: Props) {
  return (
    <section>
      <PageHeader
        title={PAGE.dashboard.title}
        description={rangeLabel(range)}
        actions={<DateRangeTabs active={range} />}
      />

      <div data-tour="kpi-row" className="mb-4 grid grid-cols-2 gap-4 md:grid-cols-4">
        {kpis.map((k) => (
          <KpiCard key={k.label} kpi={k} />
        ))}
      </div>

      <div className="mb-4 grid grid-cols-12 gap-4">
        <DealsByStage stages={stages} />
        <Panel className="col-span-12 lg:col-span-5" title="Calls per week" aside={<span className="text-xs text-muted">Last 8 weeks</span>}>
          <CallActivityChart weeks={weeks} />
        </Panel>
      </div>

      <CoachingPanel data={coaching} />
    </section>
  );
}
