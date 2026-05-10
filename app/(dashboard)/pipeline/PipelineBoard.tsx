"use client";
import { useOptimistic, useTransition } from "react";
import {
  DndContext,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import type { KanbanColumn, Deal } from "@/lib/data";
import { moveDealStage, type SpancoCode } from "./actions";
import DealInsightButton from "@/components/DealInsightButton";

type Move = { dealId: string; from: SpancoCode; to: SpancoCode };

function applyMove(state: KanbanColumn[], move: Move): KanbanColumn[] {
  let card: Deal | undefined;
  const next = state.map((col) => {
    if (col.code !== move.from) return col;
    const nextDeals = col.deals.filter((d) => {
      if (d.id === move.dealId) {
        card = d;
        return false;
      }
      return true;
    });
    return { ...col, deals: nextDeals, count: nextDeals.length };
  });
  if (!card) return state;
  return next.map((col) => {
    if (col.code !== move.to) return col;
    return {
      ...col,
      deals: [{ ...card!, daysInStage: 0 }, ...col.deals],
      count: col.deals.length + 1,
    };
  });
}

export default function PipelineBoard({ initialBoard }: { initialBoard: KanbanColumn[] }) {
  const [board, applyOptimistic] = useOptimistic(initialBoard, applyMove);
  const [, startTransition] = useTransition();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  function onDragEnd(e: DragEndEvent) {
    const dealId = e.active.id as string;
    const to = e.over?.id as SpancoCode | undefined;
    if (!to) return;
    let from: SpancoCode | undefined;
    for (const col of board) {
      if (col.deals.some((d) => d.id === dealId)) {
        from = col.code as SpancoCode;
        break;
      }
    }
    if (!from || from === to) return;
    startTransition(async () => {
      applyOptimistic({ dealId, from: from!, to });
      await moveDealStage(dealId, from!, to);
    });
  }

  return (
    <DndContext sensors={sensors} onDragEnd={onDragEnd}>
      <div className="grid grid-flow-col auto-cols-[minmax(260px,1fr)] gap-4 overflow-x-auto pb-4">
        {board.map((col) => (
          <Column key={col.code} col={col} />
        ))}
      </div>
    </DndContext>
  );
}

function Column({ col }: { col: KanbanColumn }) {
  const { setNodeRef, isOver } = useDroppable({ id: col.code });
  return (
    <div
      ref={setNodeRef}
      className={`panel p-3 min-w-[260px] transition-colors ${isOver ? "border-accent" : ""}`}
    >
      <div className="flex items-center justify-between mb-1">
        <div className="text-sm font-semibold">
          {col.code} — {col.name}
        </div>
        <span className="chip">{col.count}</span>
      </div>
      <div className="text-[11px] text-muted mb-3">
        {col.description} · <span className="text-foreground">{col.total}</span>
      </div>
      <div className="space-y-3">
        {col.deals.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border-subtle p-4 text-[11px] text-muted text-center leading-relaxed">
            No deals here yet.
            <br />
            Drag a card from another column or add a new deal.
          </div>
        ) : (
          col.deals.map((d) => <Card key={d.id ?? d.company} deal={d} />)
        )}
      </div>
    </div>
  );
}

function Card({ deal }: { deal: Deal }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: deal.id ?? deal.company,
    disabled: !deal.id,
  });
  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`rounded-xl border border-border-subtle bg-surface p-3 hover:border-accent transition cursor-grab ${isDragging ? "opacity-50" : ""}`}
    >
      <div className="flex items-start gap-2">
        <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center font-bold text-xs">
          {deal.initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <div className="font-semibold text-sm truncate">{deal.company}</div>
            {deal.hot && <span className="text-orange-400 text-xs">🔥</span>}
          </div>
          <div className="text-[11px] text-muted truncate">
            {deal.contact} · {deal.role}
          </div>
        </div>
      </div>
      <div className="flex items-baseline justify-between mt-3">
        <div>
          <div className="text-base font-semibold">{deal.value}</div>
          {typeof deal.headcount === "number" && (
            <div className="text-[10px] text-muted">{deal.headcount} engineers</div>
          )}
        </div>
        <div className="text-[11px] text-muted">{deal.daysInStage}d in stage</div>
      </div>
      <div className="text-[11px] text-muted mt-2 flex items-center gap-1">
        📞 <span>{deal.lastActivity}</span>
      </div>
      <div className="mt-2 rounded-lg border border-border-subtle bg-background p-2">
        <div className="flex items-center justify-between mb-1">
          <div className="text-[10px] uppercase tracking-wider text-accent">AI insight</div>
          {deal.id && <DealInsightButton dealId={deal.id} hasInsight={!!deal.insight} />}
        </div>
        {deal.insight ? (
          <div className="text-[11px] text-foreground leading-snug">{deal.insight}</div>
        ) : (
          <div className="text-[11px] text-muted italic">No insight yet — generate one.</div>
        )}
      </div>
      <div className="flex flex-wrap gap-1 mt-2">
        {deal.tags.map((t) => (
          <span key={t} className="chip">
            {t}
          </span>
        ))}
      </div>
      <div className="text-[11px] text-muted mt-2 flex items-center gap-1">
        ⏰ <span>{deal.next}</span>
      </div>
    </div>
  );
}
