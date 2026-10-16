import { PAGE } from "@/lib/constants/copy";
import DealsView from "@/components/views/DealsView";
import { getPipelineBoard } from "@/lib/queries/pipeline";
import { db } from "@/db/client";
import { clients as clientsTable } from "@/db/schema";

type SearchParams = { hot?: string };

export const metadata = { title: PAGE.deals.title };

export default async function DealsPage({
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
  return <DealsView board={filteredBoard} clients={clientRows} hotOnly={hotOnly} />;
}
