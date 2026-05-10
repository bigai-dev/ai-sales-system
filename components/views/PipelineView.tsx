import Link from "next/link";
import PipelineBoard from "@/app/(dashboard)/pipeline/PipelineBoard";
import AddDealDialog, { type ClientOption } from "../AddDealDialog";
import type { KanbanColumn } from "@/lib/data";

export default function PipelineView({
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
      <div className="flex items-end justify-between mb-6">
        <div>
          <div className="text-xs text-muted uppercase tracking-wider">
            Pipeline · SPANCO method
          </div>
          <h1 className="text-2xl font-bold mt-1">
            {hotOnly
              ? `${totalShown} hot deal${totalShown === 1 ? "" : "s"} across stages`
              : "Drag deals to move them through stages"}
          </h1>
        </div>
        <div className="flex gap-2">
          <Link
            href={hotOnly ? "/pipeline" : "/pipeline?hot=1"}
            scroll={false}
            className={hotOnly ? "btn" : "btn-ghost"}
            title={hotOnly ? "Click to show all deals" : "Show only deals marked hot"}
          >
            {hotOnly ? "🔥 Hot only · clear" : "Filter"}
          </Link>
          <button
            className="btn-ghost opacity-50 cursor-not-allowed"
            disabled
            title="Available with a team plan — currently you're the only rep"
          >
            Group by rep
          </button>
          <AddDealDialog clients={clients} />
        </div>
      </div>
      <PipelineBoard initialBoard={board} />
    </section>
  );
}
