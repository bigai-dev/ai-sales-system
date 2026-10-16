import { Flame } from "lucide-react";
import DealsBoard from "@/app/(dashboard)/deals/DealsBoard";
import AddDealDialog, { type ClientOption } from "../AddDealDialog";
import type { KanbanColumn } from "@/lib/types/ui";
import { routes } from "@/lib/constants/routes";
import { PAGE } from "@/lib/constants/copy";
import { ButtonLink, PageHeader } from "@/components/ui";

export default function DealsView({
  board,
  clients,
  hotOnly,
}: {
  board: KanbanColumn[];
  clients: ClientOption[];
  hotOnly: boolean;
}) {
  const totalShown = board.reduce((s, c) => s + c.deals.length, 0);
  return (
    <section>
      <PageHeader
        title={PAGE.deals.title}
        description={
          hotOnly
            ? `Showing ${totalShown} hot deal${totalShown === 1 ? "" : "s"}.`
            : PAGE.deals.description
        }
        actions={
          <>
            <ButtonLink
              href={routes.deals({ hot: !hotOnly })}
              scroll={false}
              variant={hotOnly ? "primary" : "ghost"}
              icon={<Flame size={14} aria-hidden />}
            >
              {hotOnly ? "Hot only · show all" : "Hot only"}
            </ButtonLink>
            <AddDealDialog clients={clients} />
          </>
        }
      />
      <DealsBoard initialBoard={board} />
    </section>
  );
}
