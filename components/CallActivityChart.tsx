"use client";
import { useEffect, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";
import type { WeeklyCalls } from "@/lib/queries/calls";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

type Colors = {
  surface: string;
  border: string;
  grid: string;
  foreground: string;
  muted: string;
  accent: string;
};

/** Chart.js can't read CSS variables, so read the theme once mounted and
 *  again whenever light/dark flips. */
function readColors(): Colors {
  const css = getComputedStyle(document.documentElement);
  const v = (name: string) => css.getPropertyValue(name).trim();
  return {
    surface: v("--surface-elevated"),
    border: v("--border"),
    grid: `color-mix(in oklch, ${v("--border-subtle")} 60%, transparent)`,
    foreground: v("--foreground"),
    muted: v("--muted"),
    accent: v("--accent"),
  };
}

export default function CallActivityChart({ weeks }: { weeks: WeeklyCalls[] }) {
  const [colors, setColors] = useState<Colors | null>(null);

  useEffect(() => {
    setColors(readColors());
    const obs = new MutationObserver(() => setColors(readColors()));
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  if (!colors) return <div style={{ height: 240 }} className="skeleton" />;

  const data = {
    labels: weeks.map((w) => w.label),
    datasets: [
      {
        label: "Planned",
        data: weeks.map((w) => w.planned),
        borderColor: colors.muted,
        backgroundColor: `color-mix(in oklch, ${colors.muted} 12%, transparent)`,
        tension: 0.4,
        fill: true,
        pointRadius: 2,
        borderWidth: 1.5,
      },
      {
        label: "Completed",
        data: weeks.map((w) => w.completed),
        borderColor: colors.accent,
        backgroundColor: `color-mix(in oklch, ${colors.accent} 15%, transparent)`,
        tension: 0.4,
        fill: true,
        pointRadius: 2,
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: "top" as const,
        align: "end" as const,
        labels: { color: colors.muted, boxWidth: 8, boxHeight: 8, usePointStyle: true, font: { size: 11 } },
      },
      tooltip: {
        backgroundColor: colors.surface,
        borderColor: colors.border,
        borderWidth: 1,
        titleColor: colors.foreground,
        bodyColor: colors.muted,
      },
    },
    scales: {
      x: { grid: { color: colors.grid }, ticks: { color: colors.muted, font: { size: 11 } } },
      y: {
        beginAtZero: true,
        grid: { color: colors.grid },
        ticks: { color: colors.muted, font: { size: 11 }, precision: 0 },
      },
    },
  };

  return (
    <div style={{ height: 240 }}>
      <Line data={data} options={options} />
    </div>
  );
}
