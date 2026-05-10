import DashboardView from "@/components/views/DashboardView";
import { getDashboardKpis } from "@/lib/kpis";
import { getDashboardFunnel } from "@/lib/queries/funnel";
import { getCoachingPanel } from "@/lib/queries/coaching";
import { parseRange } from "@/lib/quarter";

type SearchParams = { range?: string };

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const range = parseRange(sp.range);
  const [kpis, stages, coaching] = await Promise.all([
    getDashboardKpis(range),
    getDashboardFunnel(),
    getCoachingPanel(),
  ]);
  return <DashboardView kpis={kpis} stages={stages} coaching={coaching} range={range} />;
}
