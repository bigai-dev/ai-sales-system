import type { MetricSeries } from "@/lib/queries/training-metrics";

const W = 220;
const H = 56;
const PAD = 4;

// Server-rendered sparkline: maps point.value (0-100) to Y, point.ts to X
// across the full window. The y-axis is fixed 0-100 so different metrics
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

function deltaTone(delta: number | null): "up" | "down" | "flat" {
  if (delta === null) return "flat";
  if (delta > 0) return "up";
  if (delta < 0) return "down";
  return "flat";
}

function bandRectY(min: number, max: number) {
  const yMax = H - PAD - (min / 100) * (H - PAD * 2);
  const yMin = H - PAD - (max / 100) * (H - PAD * 2);
  return { y: yMin, height: yMax - yMin };
}

export default function MetricSparkline({ series }: { series: MetricSeries }) {
  const path = buildPath(series.points);
  const tone = deltaTone(series.delta30);
  const inBand =
    series.scale === "band" &&
    series.band &&
    series.current !== null &&
    series.current >= series.band.min &&
    series.current <= series.band.max;

  return (
    <div className="panel p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs uppercase tracking-wider text-muted">{series.label}</div>
          <div className="flex items-baseline gap-2 mt-1">
            <div className="text-2xl font-semibold">
              {series.current === null ? "—" : `${series.current}%`}
            </div>
            {series.delta30 !== null && (
              <div
                className={`text-xs ${
                  tone === "up" ? "delta-up" : tone === "down" ? "delta-down" : "text-muted"
                }`}
              >
                {series.delta30 > 0 ? "+" : ""}
                {series.delta30}pp 30d
              </div>
            )}
            {series.scale === "band" && series.band && (
              <div className={`chip ${inBand ? "chip-good" : "chip-warn"} text-[10px]`}>
                Target {series.band.min}–{series.band.max}%
              </div>
            )}
          </div>
        </div>
      </div>
      <svg
        width="100%"
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className="mt-3 block"
        aria-label={`${series.label} 30-day sparkline`}
      >
        {/* baseline */}
        <line
          x1={PAD}
          y1={H - PAD}
          x2={W - PAD}
          y2={H - PAD}
          stroke="currentColor"
          strokeOpacity="0.1"
          strokeWidth="1"
        />
        {series.scale === "band" && series.band && (
          (() => {
            const { y, height } = bandRectY(series.band.min, series.band.max);
            return (
              <rect
                x={PAD}
                y={y}
                width={W - PAD * 2}
                height={height}
                fill="currentColor"
                fillOpacity="0.06"
              />
            );
          })()
        )}
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
          <text
            x={W / 2}
            y={H / 2 + 4}
            textAnchor="middle"
            fontSize="11"
            fill="currentColor"
            fillOpacity="0.4"
          >
            No data yet
          </text>
        )}
      </svg>
      <div className="text-[11px] text-muted mt-2">{series.shortHelp}</div>
    </div>
  );
}
