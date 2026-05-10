import Link from "next/link";
import type { Range } from "@/lib/quarter";

const RANGES: { value: Range; label: string }[] = [
  { value: "week", label: "This week" },
  { value: "month", label: "This month" },
  { value: "quarter", label: "This quarter" },
];

export default function DateRangeTabs({ active }: { active: Range }) {
  return (
    <div className="flex gap-2">
      {RANGES.map((r) => (
        <Link
          key={r.value}
          href={r.value === "quarter" ? "/" : `/?range=${r.value}`}
          scroll={false}
          className={active === r.value ? "btn" : "btn-ghost"}
        >
          {r.label}
        </Link>
      ))}
    </div>
  );
}
