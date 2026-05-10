import type { Stage } from "@/lib/data";

export default function PipelineByStage({ stages }: { stages: Stage[] }) {
  return (
    <div className="panel p-5 col-span-12 lg:col-span-7">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="font-semibold">Pipeline by stage</div>
          <div className="text-xs text-muted">
            Opportunities × value · click a stage to drill in
          </div>
        </div>
        <div className="flex gap-2">
          <span className="chip">All reps</span>
          <span className="chip chip-info">Weighted</span>
        </div>
      </div>
      <div className="space-y-2">
        {stages.map((s) => (
          <div
            key={s.name}
            className="funnel-stage flex items-center justify-between px-4 py-3 row-hover cursor-pointer"
          >
            <div className="flex items-center gap-3 w-1/3">
              <div className="w-2 h-8 rounded" style={{ background: s.color }} />
              <div>
                <div className="font-semibold text-sm">{s.name}</div>
                <div className="text-[11px] text-muted">{s.count} opportunities</div>
              </div>
            </div>
            <div className="flex-1 mx-4 max-w-md">
              <div className="bar-track">
                <div
                  className="bar-fill"
                  style={{ width: `${s.pct}%`, background: s.color }}
                />
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-semibold">{s.value}</div>
              <div className="text-[11px] text-muted">weighted {s.weighted}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
