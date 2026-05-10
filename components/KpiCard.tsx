import type { Kpi } from "@/lib/data";

export default function KpiCard({ kpi }: { kpi: Kpi }) {
  return (
    <div className="panel kpi">
      <div className="l">{kpi.label}</div>
      <div className="flex items-baseline gap-2 mt-1">
        <div className="v">{kpi.value}</div>
        {kpi.delta && (
          <div className={`text-xs ${kpi.delta.up ? "delta-up" : "delta-down"}`}>
            {kpi.delta.text}
          </div>
        )}
        {kpi.chip && <div className={`chip chip-${kpi.chip.tone} ml-2`}>{kpi.chip.text}</div>}
      </div>
      {typeof kpi.bar === "number" && (
        <div className="bar-track mt-3">
          <div className="bar-fill" style={{ width: `${kpi.bar}%` }} />
        </div>
      )}
      <div className="text-[11px] text-muted mt-2">{kpi.caption}</div>
    </div>
  );
}
