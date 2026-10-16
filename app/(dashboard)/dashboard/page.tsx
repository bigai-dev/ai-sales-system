import { PAGE } from "@/lib/constants/copy";
import DashboardView from "@/components/views/DashboardView";
import { getDashboardKpis } from "@/lib/kpis";
import { getDashboardFunnel } from "@/lib/queries/funnel";
import { getCoachingPanel } from "@/lib/queries/coaching";
import { getCallsPerWeek } from "@/lib/queries/calls";
import { parseRange } from "@/lib/quarter";

type SearchParams = { range?: string };

export const metadata = { title: PAGE.dashboard.title };

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const range = parseRange(sp.range);
  const [kpis, stages, coaching, weeks] = await Promise.all([
    getDashboardKpis(range),
    getDashboardFunnel(),
    getCoachingPanel(),
    getCallsPerWeek(8),
  ]);
  return <DashboardView kpis={kpis} stages={stages} coaching={coaching} weeks={weeks} range={range} />;
}
