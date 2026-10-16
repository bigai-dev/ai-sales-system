import Link from "next/link";
import type { Range } from "@/lib/quarter";
import { routes } from "@/lib/constants/routes";

const RANGES: { value: Range; label: string }[] = [
  { value: "week", label: "This week" },
  { value: "month", label: "This month" },
  { value: "quarter", label: "This quarter" },
];

export default function DateRangeTabs({ active }: { active: Range }) {
  return (
    <div className="switch">
      {RANGES.map((r) => (
        <Link
          key={r.value}
          href={r.value === "quarter" ? routes.dashboard() : `${routes.dashboard()}?range=${r.value}`}
          scroll={false}
          className={`rounded px-3 py-1.5 text-xs font-medium transition ${
            active === r.value ? "bg-accent text-accent-foreground" : "text-muted hover:text-foreground"
          }`}
        >
          {r.label}
        </Link>
      ))}
    </div>
  );
}
