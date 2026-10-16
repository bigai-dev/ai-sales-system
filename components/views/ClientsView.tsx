"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import type { Client } from "@/lib/types/ui";
import AddClientDialog from "../AddClientDialog";
import { STAGE, STAGE_CODES, readinessStatusFromScore, READINESS_STATUS_LABEL, READINESS_STATUS_TONE } from "@/lib/constants/labels";
import { routes } from "@/lib/constants/routes";
import { PAGE } from "@/lib/constants/copy";
import { ButtonLink, EmptyState, Field, PageHeader, Select, StatusChip } from "@/components/ui";

const STAGES = ["All", ...STAGE_CODES.map((c) => STAGE[c].label)];
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
const SORTS = [
  { value: "value", label: "Workshop value" },
  { value: "name", label: "Name" },
  { value: "stage", label: "Stage" },
  { value: "industry", label: "Industry" },
  { value: "size", label: "Size" },
  { value: "health", label: "Readiness" },
  { value: "engineers", label: "Engineers" },
] as const;
type SortKey = (typeof SORTS)[number]["value"];

function moneyNumber(s: string): number {
  return parseInt(s.replace(/[^0-9]/g, ""), 10) || 0;
}

export default function ClientsView({ clientList }: { clientList: Client[] }) {
  const [view, setView] = useState<"Grid" | "Table">("Grid");
  const [stage, setStage] = useState("All");
  const [industry, setIndustry] = useState("All");
  const [size, setSize] = useState("All");
  const [sort, setSort] = useState<SortKey>("value");

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
          return moneyNumber(b.arr) - moneyNumber(a.arr);
      }
    });
    return list;
  }, [clientList, stage, industry, size, sort]);

  const totalK = filtered.reduce((s, c) => s + moneyNumber(c.arr), 0);
  const hasFilters = stage !== "All" || industry !== "All" || size !== "All";

  return (
    <section>
      <PageHeader
        title={PAGE.clients.title}
        description={`${filtered.length} client${filtered.length === 1 ? "" : "s"} · RM ${totalK}K total workshop value`}
        actions={
          <>
            <ButtonLink href={routes.readinessIndex()} variant="ghost">
              Readiness checks
            </ButtonLink>
            <div className="switch">
              <button onClick={() => setView("Grid")} className={view === "Grid" ? "on" : ""}>
                Cards
              </button>
              <button onClick={() => setView("Table")} className={view === "Table" ? "on" : ""}>
                Table
              </button>
            </div>
            <AddClientDialog />
          </>
        }
      />

      <div className="panel mb-6 grid grid-cols-2 gap-3 p-4 md:grid-cols-4">
        <Field label="Stage">
          <Select value={stage} onChange={(e) => setStage(e.target.value)}>
            {STAGES.map((o) => (
              <option key={o}>{o}</option>
            ))}
          </Select>
        </Field>
        <Field label="Industry">
          <Select value={industry} onChange={(e) => setIndustry(e.target.value)}>
            {INDUSTRIES.map((o) => (
              <option key={o}>{o}</option>
            ))}
          </Select>
        </Field>
        <Field label="Size">
          <Select value={size} onChange={(e) => setSize(e.target.value)}>
            {SIZES.map((o) => (
              <option key={o}>{o}</option>
            ))}
          </Select>
        </Field>
        <Field label="Sort by">
          <Select value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
            {SORTS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      {filtered.length === 0 ? (
        hasFilters ? (
          <EmptyState
            title="No clients match these filters."
            hint="Try widening the stage, industry or size filters above."
          />
        ) : (
          <EmptyState
            title="No clients yet."
            hint="Add a client to start. From their page you can plan calls, run a readiness check and create proposals."
            action={<AddClientDialog />}
          />
        )
      ) : view === "Grid" ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => {
            const status = readinessStatusFromScore(c.health);
            return (
              <Link
                key={c.id ?? c.name}
                href={c.id ? routes.client(c.id) : "#"}
                className="panel block p-4 transition-colors hover:border-accent"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-elevated text-xs font-semibold text-accent">
                      {c.initials}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate font-semibold">{c.name}</div>
                      <div className="truncate text-xs text-muted">{c.contact}</div>
                    </div>
                  </div>
                  <StatusChip className="shrink-0">{c.stage}</StatusChip>
                </div>
                <div className="mt-2 text-xs text-muted">
                  {c.industry} · {c.size} · {c.employees.toLocaleString()} staff
                  {typeof c.devCount === "number" ? ` · ${c.devCount} engineers` : ""}
                </div>
                <div className="mt-4 flex items-end justify-between gap-3">
                  <div>
                    <div className="text-xs text-muted">Workshop value</div>
                    <div className="text-xl font-semibold tabular-nums">{c.arr}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-muted">Readiness</div>
                    <div className="flex items-center justify-end gap-2">
                      <span className="text-xl font-semibold tabular-nums">{c.health}</span>
                      <StatusChip tone={READINESS_STATUS_TONE[status]}>
                        {READINESS_STATUS_LABEL[status]}
                      </StatusChip>
                    </div>
                  </div>
                </div>
                <div className="bar-track mt-3">
                  <div className="bar-fill" style={{ width: `${c.health}%` }} />
                </div>
                <div className="mt-3 text-xs text-muted">Last activity · {c.lastActivity}</div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="panel overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="text-left text-xs font-medium text-muted">
              <tr>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Stage</th>
                <th className="px-4 py-3">Industry</th>
                <th className="px-4 py-3">Size</th>
                <th className="px-4 py-3">Engineers</th>
                <th className="px-4 py-3">Workshop value</th>
                <th className="px-4 py-3">Readiness</th>
                <th className="px-4 py-3">Last activity</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => {
                const status = readinessStatusFromScore(c.health);
                return (
                  <tr key={c.id ?? c.name} className="row-hover border-t border-border-subtle">
                    <td className="px-4 py-3 font-medium">
                      {c.id ? <Link href={routes.client(c.id)}>{c.name}</Link> : c.name}
                    </td>
                    <td className="px-4 py-3 text-muted">{c.stage}</td>
                    <td className="px-4 py-3 text-muted">{c.industry}</td>
                    <td className="px-4 py-3 text-muted">{c.size}</td>
                    <td className="px-4 py-3 text-muted">{c.devCount ?? "—"}</td>
                    <td className="px-4 py-3 font-semibold tabular-nums">{c.arr}</td>
                    <td className="px-4 py-3">
                      <StatusChip tone={READINESS_STATUS_TONE[status]}>{c.health}</StatusChip>
                    </td>
                    <td className="px-4 py-3 text-muted">{c.lastActivity}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
