import type { MetricSeries } from "@/lib/queries/training-metrics";
import { Panel, SectionLabel, StatusChip } from "@/components/ui";

const W = 220;
const H = 56;
const PAD = 4;

// Server-rendered sparkline: maps point.value (0-100) to Y, point.ts to X
// across the full window. The y-axis is fixed 0-100 so different stats
// compare visually at a glance.
function buildPath(points: { ts: number; value: number }[]): string {
  if (points.length === 0) return "";
  const minTs = points[0].ts;
  const maxTs = points[points.length - 1].ts;
  const span = Math.max(1, maxTs - minTs);

  const xy = points.map((p) => {
    const x = PAD + ((p.ts - minTs) / span) * (W - PAD * 2);
    const y = H - PAD - (p.value / 100) * (H - PAD * 2);
    return [x, y] as const;
  });

  if (xy.length === 1) {
    const [x, y] = xy[0];
    // Draw a 2px horizontal segment so a single point is still visible.
    return `M ${x - 1} ${y} L ${x + 1} ${y}`;
  }
  return xy.map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
}

/**
 * Colour of the change figure. "Higher is better" stats: up = green, down =
 * red. "Band" stats (talk balance): a move is good if it ends inside the band,
 * otherwise neutral — a drop into the target range is not a bad thing.
 */
function deltaClass(series: MetricSeries): string {
  const d = series.delta30;
  if (d === null || d === 0) return "text-muted";
  if (series.scale === "band" && series.band) {
    const inBand =
      series.current !== null && series.current >= series.band.min && series.current <= series.band.max;
    return inBand ? "delta-up" : "text-muted";
  }
  return d > 0 ? "delta-up" : "delta-down";
}

function bandRectY(min: number, max: number) {
  const yMax = H - PAD - (min / 100) * (H - PAD * 2);
  const yMin = H - PAD - (max / 100) * (H - PAD * 2);
  return { y: yMin, height: yMax - yMin };
}

export default function MetricSparkline({ series }: { series: MetricSeries }) {
  const path = buildPath(series.points);
  const inBand =
    series.scale === "band" &&
    series.band &&
    series.current !== null &&
    series.current >= series.band.min &&
    series.current <= series.band.max;

  return (
    <Panel padding="sm">
      <SectionLabel>{series.label}</SectionLabel>
      <div className="mt-1 flex flex-wrap items-baseline gap-2">
        <div className="text-2xl font-semibold tabular-nums">
          {series.current === null ? "—" : `${series.current}%`}
        </div>
        {series.delta30 !== null && (
          <div className={`text-xs ${deltaClass(series)}`}>
            {series.delta30 > 0 ? "+" : ""}
            {series.delta30} points in 30 days
          </div>
        )}
        {series.scale === "band" && series.band && (
          <StatusChip tone={inBand ? "good" : "warn"}>
            Aim for {series.band.min}–{series.band.max}%
          </StatusChip>
        )}
      </div>
      <svg
        width="100%"
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className="mt-3 block"
        aria-label={`${series.label}, last 30 days`}
      >
        <line
          x1={PAD}
          y1={H - PAD}
          x2={W - PAD}
          y2={H - PAD}
          stroke="currentColor"
          strokeOpacity="0.1"
          strokeWidth="1"
        />
        {series.scale === "band" &&
          series.band &&
          (() => {
            const { y, height } = bandRectY(series.band.min, series.band.max);
            return (
              <rect x={PAD} y={y} width={W - PAD * 2} height={height} fill="currentColor" fillOpacity="0.06" />
            );
          })()}
        {path ? (
          <path
            d={path}
            fill="none"
            stroke="currentColor"
            strokeOpacity="0.85"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : (
          <text x={W / 2} y={H / 2 + 4} textAnchor="middle" fontSize="11" fill="currentColor" fillOpacity="0.4">
            No data yet
          </text>
        )}
      </svg>
      <p className="mt-2 text-xs text-muted">{series.shortHelp}</p>
    </Panel>
  );
}
