"use client";
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
import { callSeries } from "@/lib/data/fallbacks";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler
);

// Colors aligned with the OKLCH theme tokens (Chart.js can't read CSS vars,
// so we mirror the values here).
const COLOR = {
  background: "#27241f",       // surface-elevated
  border: "#52473d",           // border
  borderSubtle: "rgba(82,71,61,0.35)",
  foreground: "#f5f3ee",       // foreground (cream)
  muted: "#a8a39a",            // muted (warm gray)
  accent: "#f7a85d",           // accent (warm amber)
  series: {
    callsMade: "#a8a39a",      // muted gray — top of funnel, low signal
    pickedUp: "#d6cfc4",       // foreground-tinted gray — middle
    conversations: "#f7a85d",  // accent — the conversion that matters
  },
};

export default function CallActivityChart() {
  const data = {
    labels: callSeries.labels,
    datasets: [
      {
        label: "Calls made",
        data: callSeries.callsMade,
        borderColor: COLOR.series.callsMade,
        backgroundColor: COLOR.series.callsMade + "1a",
        tension: 0.4,
        fill: true,
        pointRadius: 0,
        borderWidth: 1.5,
      },
      {
        label: "Picked up",
        data: callSeries.pickedUp,
        borderColor: COLOR.series.pickedUp,
        backgroundColor: COLOR.series.pickedUp + "1a",
        tension: 0.4,
        fill: true,
        pointRadius: 0,
        borderWidth: 1.5,
      },
      {
        label: "Conversations",
        data: callSeries.conversations,
        borderColor: COLOR.series.conversations,
        backgroundColor: COLOR.series.conversations + "22",
        tension: 0.4,
        fill: true,
        pointRadius: 0,
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: COLOR.background,
        borderColor: COLOR.border,
        borderWidth: 1,
        titleColor: COLOR.foreground,
        bodyColor: COLOR.muted,
      },
    },
    scales: {
      x: {
        grid: { color: COLOR.borderSubtle },
        ticks: { color: COLOR.muted, font: { size: 11 } },
      },
      y: {
        grid: { color: COLOR.borderSubtle },
        ticks: { color: COLOR.muted, font: { size: 11 } },
      },
    },
  } as const;

  return (
    <div style={{ height: 240 }}>
      <Line data={data} options={options} />
    </div>
  );
}
