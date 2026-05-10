import PipelineView from "@/components/views/PipelineView";
import { getPipelineBoard } from "@/lib/queries/pipeline";
import { db } from "@/db/client";
import { clients as clientsTable } from "@/db/schema";

type SearchParams = { hot?: string };

export default async function PipelinePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const hotOnly = sp.hot === "1";
  const [board, clientRows] = await Promise.all([
    getPipelineBoard(),
    db.select({ id: clientsTable.id, name: clientsTable.name }).from(clientsTable),
  ]);
  clientRows.sort((a, b) => a.name.localeCompare(b.name));
  const filteredBoard = hotOnly
    ? board.map((col) => {
        const deals = col.deals.filter((d) => d.hot);
        return { ...col, deals, count: deals.length };
      })
    : board;
  return <PipelineView board={filteredBoard} clients={clientRows} hotOnly={hotOnly} />;
}
