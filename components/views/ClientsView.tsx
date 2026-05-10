"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import type { Client } from "@/lib/types/ui";
import AddClientDialog from "../AddClientDialog";

const STAGES = ["All", "Lead", "Qualified", "Discovery", "Proposal", "Negotiation", "Closed-won"];
const INDUSTRIES = [
  "All",
  "SaaS",
  "Fintech",
  "Healthtech",
  "E-commerce",
  "Media",
  "DevTools",
  "AI / ML",
  "Cybersecurity",
  "Logistics",
  "Marketplace",
  "Public sector",
];
const SIZES = ["All", "SMB", "Mid-market", "Enterprise"];
const SORTS = ["value", "name", "stage", "industry", "size", "health", "engineers"] as const;

function healthTone(h: number) {
  if (h >= 75) return "chip-good";
  if (h >= 60) return "chip-warn";
  return "chip-bad";
}

export default function ClientsView({ clientList }: { clientList: Client[] }) {
  const [view, setView] = useState<"Grid" | "Table">("Grid");
  const [stage, setStage] = useState("All");
  const [industry, setIndustry] = useState("All");
  const [size, setSize] = useState("All");
  const [sort, setSort] = useState<(typeof SORTS)[number]>("value");

  const filtered = useMemo(() => {
    let list = [...clientList];
    if (stage !== "All") list = list.filter((c) => c.stage === stage);
    if (industry !== "All") list = list.filter((c) => c.industry === industry);
    if (size !== "All") list = list.filter((c) => c.size === size);
    list.sort((a, b) => {
      switch (sort) {
        case "name":
          return a.name.localeCompare(b.name);
        case "stage":
          return a.stage.localeCompare(b.stage);
        case "industry":
          return a.industry.localeCompare(b.industry);
        case "size":
          return a.size.localeCompare(b.size);
        case "health":
          return b.health - a.health;
        case "engineers":
          return (b.devCount ?? 0) - (a.devCount ?? 0);
        case "value":
        default:
          return parseInt(b.arr.replace(/[^0-9]/g, "")) - parseInt(a.arr.replace(/[^0-9]/g, ""));
      }
    });
    return list;
  }, [clientList, stage, industry, size, sort]);

  const totalK = filtered.reduce(
    (s, c) => s + parseInt(c.arr.replace(/[^0-9]/g, "")),
    0,
  );

  return (
    <section>
      <div className="flex items-end justify-between mb-6">
        <div>
          <div className="text-xs text-muted uppercase tracking-wider">Clients</div>
          <h1 className="text-2xl font-bold mt-1">
            {filtered.length} clients ·{" "}
            <span className="text-accent">RM {totalK}K total workshop value</span>
          </h1>
        </div>
        <div className="flex gap-2">
          <div className="switch">
            <button onClick={() => setView("Grid")} className={view === "Grid" ? "on" : ""}>
              Grid
            </button>
            <button onClick={() => setView("Table")} className={view === "Table" ? "on" : ""}>
              Table
            </button>
          </div>
          <AddClientDialog />
        </div>
      </div>

      <div className="panel p-4 mb-6 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
        <Filter label="Stage" value={stage} onChange={setStage} options={STAGES} />
        <Filter label="Industry" value={industry} onChange={setIndustry} options={INDUSTRIES} />
        <Filter label="Size" value={size} onChange={setSize} options={SIZES} />
        <Filter
          label="Sort by"
          value={sort}
          onChange={(v) => setSort(v as (typeof SORTS)[number])}
          options={[...SORTS]}
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyClients hasFilters={stage !== "All" || industry !== "All" || size !== "All"} />
      ) : view === "Grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c) => (
            <Link
              key={c.name}
              href={c.id ? `/clients/${c.id}` : "#"}
              className="panel p-4 block hover:border-accent transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div
                    className={"w-9 h-9 rounded-lg bg-surface-elevated text-accent flex items-center justify-center font-semibold text-xs"}
                  >
                    {c.initials}
                  </div>
                  <div>
                    <div className="font-semibold">{c.name}</div>
                    <div className="text-[11px] text-muted">{c.contact}</div>
                  </div>
                </div>
                <span className="chip">{c.stage}</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-1 text-[11px] text-muted">
                <span className="chip">{c.industry}</span>
                <span className="chip">{c.size}</span>
                {typeof c.devCount === "number" && (
                  <span className="chip chip-info">{c.devCount} engineers</span>
                )}
                <span className="chip">{c.employees.toLocaleString()} emp</span>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <div>
                  <div className="text-[11px] text-muted uppercase tracking-wider">
                    Workshop value
                  </div>
                  <div className="text-xl font-bold">{c.arr}</div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] text-muted uppercase tracking-wider">
                    Readiness
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-xl font-bold">{c.health}</div>
                    <span className={`chip ${healthTone(c.health)}`}>
                      {c.health >= 75 ? "good" : c.health >= 60 ? "watch" : "risk"}
                    </span>
                  </div>
                </div>
              </div>
              <div className="bar-track mt-3">
                <div
                  className="bar-fill"
                  style={{
                    width: `${c.health}%`,
                    background:
                      undefined,  // accent-only health bar in theme
                  }}
                />
              </div>
              <div className="text-[11px] text-muted mt-3">
                Last activity · {c.lastActivity}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="panel p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-[11px] uppercase tracking-wider text-muted">
              <tr>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Stage</th>
                <th className="px-4 py-3">Industry</th>
                <th className="px-4 py-3">Size</th>
                <th className="px-4 py-3">Engineers</th>
                <th className="px-4 py-3">Workshop $</th>
                <th className="px-4 py-3">Readiness</th>
                <th className="px-4 py-3">Last activity</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.name} className="border-t border-border-subtle row-hover">
                  <td className="px-4 py-3 font-medium">{c.name}</td>
                  <td className="px-4 py-3 text-muted">{c.stage}</td>
                  <td className="px-4 py-3 text-muted">{c.industry}</td>
                  <td className="px-4 py-3 text-muted">{c.size}</td>
                  <td className="px-4 py-3 text-muted">{c.devCount ?? "—"}</td>
                  <td className="px-4 py-3 font-semibold">{c.arr}</td>
                  <td className="px-4 py-3">
                    <span className={`chip ${healthTone(c.health)}`}>{c.health}</span>
                  </td>
                  <td className="px-4 py-3 text-muted">{c.lastActivity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function EmptyClients({ hasFilters }: { hasFilters: boolean }) {
  if (hasFilters) {
    return (
      <div className="panel p-8 text-center">
        <div className="text-sm text-foreground">No clients match these filters.</div>
        <div className="text-xs text-muted mt-1">
          Try widening the Stage, Industry, or Size filters above.
        </div>
      </div>
    );
  }
  return (
    <div className="panel p-8 text-center">
      <div className="text-sm text-foreground">No clients yet.</div>
      <div className="text-xs text-muted mt-1 max-w-md mx-auto">
        Click <strong className="text-foreground">+ Add client</strong> to start
        tracking a prospect. You'll be able to plan calls, generate readiness
        audits, and create proposals from each client's page.
      </div>
    </div>
  );
}

function Filter({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] uppercase tracking-wider text-muted">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-surface-elevated border border-border-subtle rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/40"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}
