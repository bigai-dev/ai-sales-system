"use client";

import { useState, useTransition } from "react";
import {
  updateClientDiscovery,
  type DiscoveryPatch,
} from "@/app/(dashboard)/clients/actions";
import type { DecisionMaker } from "@/lib/types/client";
import { SOURCE_LABEL } from "@/lib/constants/labels";

const STANCE_TONE: Record<DecisionMaker["stance"], string> = {
  champion: "chip-good",
  neutral: "chip",
  blocker: "chip-bad",
};

export type Discovery = {
  goals: string | null;
  painPoints: string | null;
  currentStack: string[];
  decisionMakers: DecisionMaker[];
  budgetSignal: string | null;
  timelineSignal: string | null;
  source: string | null;
  notes: string | null;
};

type Source = DiscoveryPatch["source"];

export default function ClientDiscoveryPanel({
  clientId,
  initial,
}: {
  clientId: string;
  initial: Discovery;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Discovery>(initial);
  const [pending, startTransition] = useTransition();
  const [justSaved, setJustSaved] = useState(false);

  function startEdit() {
    setDraft(initial);
    setEditing(true);
  }

  function cancel() {
    setDraft(initial);
    setEditing(false);
  }

  function save() {
    startTransition(async () => {
      await updateClientDiscovery(clientId, {
        goals: draft.goals ?? "",
        painPoints: draft.painPoints ?? "",
        currentStack: draft.currentStack,
        decisionMakers: draft.decisionMakers,
        budgetSignal: draft.budgetSignal ?? "",
        timelineSignal: draft.timelineSignal ?? "",
        source: (draft.source ?? "") as Source,
        notes: draft.notes ?? "",
      });
      setEditing(false);
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 1800);
    });
  }

  function patch<K extends keyof Discovery>(key: K, value: Discovery[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  return (
    <div
      className={`panel p-5 space-y-5 transition-colors duration-500 ${
        justSaved ? "border-success" : ""
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="font-semibold flex items-center gap-2">
            What the client wants
            {justSaved && (
              <span
                aria-live="polite"
                className="text-[11px] font-normal text-success inline-flex items-center gap-1"
              >
                <CheckIcon /> Saved
              </span>
            )}
          </div>
          {editing && (
            <div className="text-[11px] text-accent mt-0.5">
              Editing — click Save to persist all changes
            </div>
          )}
        </div>
        <div className="flex gap-2">
          {editing ? (
            <>
              <button onClick={cancel} disabled={pending} className="btn-ghost">
                Cancel
              </button>
              <button onClick={save} disabled={pending} className="btn">
                {pending ? "Saving…" : "Save"}
              </button>
            </>
          ) : (
            <button onClick={startEdit} className="btn-ghost">
              Edit
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <TextField
          label="Goals"
          placeholder="What they want to achieve from the workshop"
          value={draft.goals}
          editing={editing}
          rows={4}
          onChange={(v) => patch("goals", v)}
        />
        <TextField
          label="Pain points"
          placeholder="Current problems they've shared"
          value={draft.painPoints}
          editing={editing}
          rows={4}
          onChange={(v) => patch("painPoints", v)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <TagsField
          label="Current stack"
          placeholder="Add a tool or framework, then Enter"
          value={draft.currentStack}
          editing={editing}
          onChange={(v) => patch("currentStack", v)}
        />
        <DecisionMakersField
          value={draft.decisionMakers}
          editing={editing}
          onChange={(v) => patch("decisionMakers", v)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <TextField
          label="Budget signal"
          placeholder="e.g. RM 50–80K range; can stretch with board approval"
          value={draft.budgetSignal}
          editing={editing}
          rows={2}
          onChange={(v) => patch("budgetSignal", v)}
        />
        <TextField
          label="Timeline signal"
          placeholder="e.g. before MOH audit cycle in August"
          value={draft.timelineSignal}
          editing={editing}
          rows={2}
          onChange={(v) => patch("timelineSignal", v)}
        />
        <SourceField
          value={draft.source}
          editing={editing}
          onChange={(v) => patch("source", v)}
        />
      </div>

      <TextField
        label="General notes"
        placeholder="Anything else worth remembering"
        value={draft.notes}
        editing={editing}
        rows={3}
        onChange={(v) => patch("notes", v)}
      />
    </div>
  );
}

function SectionHeader({ label }: { label: string }) {
  return (
    <div className="text-[10px] uppercase tracking-wider text-muted mb-1">
      {label}
    </div>
  );
}

function TextField({
  label,
  placeholder,
  value,
  editing,
  rows,
  onChange,
}: {
  label: string;
  placeholder: string;
  value: string | null;
  editing: boolean;
  rows: number;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <SectionHeader label={label} />
      {editing ? (
        <textarea
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          className="w-full bg-surface border border-border-subtle rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted placeholder:italic focus:outline-none focus:ring-2 focus:ring-accent/40 hover:border-border resize-y leading-relaxed"
        />
      ) : (
        <div className="rounded-lg border border-border-subtle bg-surface px-3 py-2 text-sm min-h-[60px]">
          {value ? (
            <span className="whitespace-pre-wrap leading-relaxed text-foreground">
              {value}
            </span>
          ) : (
            <span className="text-muted italic">— not set</span>
          )}
        </div>
      )}
    </div>
  );
}

function TagsField({
  label,
  placeholder,
  value,
  editing,
  onChange,
}: {
  label: string;
  placeholder: string;
  value: string[];
  editing: boolean;
  onChange: (v: string[]) => void;
}) {
  const [draft, setDraft] = useState("");

  function add() {
    const t = draft.trim();
    if (!t || value.includes(t)) return;
    onChange([...value, t]);
    setDraft("");
  }

  function remove(i: number) {
    onChange(value.filter((_, idx) => idx !== i));
  }

  return (
    <div>
      <SectionHeader label={label} />
      <div className="rounded-lg border border-border-subtle bg-surface px-3 py-2 min-h-[60px]">
        {value.length === 0 && !editing && (
          <div className="text-sm text-muted italic">— not set</div>
        )}
        <div className="flex flex-wrap gap-1.5 items-center">
          {value.map((t, i) => (
            <span
              key={`${t}-${i}`}
              className="chip flex items-center gap-1 group"
            >
              {t}
              {editing && (
                <button
                  onClick={() => remove(i)}
                  className="text-muted hover:text-danger opacity-60 group-hover:opacity-100 transition"
                  aria-label={`Remove ${t}`}
                >
                  ×
                </button>
              )}
            </span>
          ))}
          {editing && (
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  add();
                }
              }}
              placeholder={value.length === 0 ? placeholder : "+ add"}
              className="flex-1 min-w-[100px] bg-transparent border-0 text-sm text-foreground placeholder:text-muted focus:outline-none"
            />
          )}
        </div>
      </div>
    </div>
  );
}

function DecisionMakersField({
  value,
  editing,
  onChange,
}: {
  value: DecisionMaker[];
  editing: boolean;
  onChange: (v: DecisionMaker[]) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [stance, setStance] = useState<DecisionMaker["stance"]>("neutral");

  function add() {
    if (!name.trim()) return;
    onChange([...value, { name: name.trim(), role: role.trim(), stance }]);
    setName("");
    setRole("");
    setStance("neutral");
    setAdding(false);
  }

  function remove(i: number) {
    onChange(value.filter((_, idx) => idx !== i));
  }

  return (
    <div>
      <SectionHeader label="Decision-makers" />
      <div className="rounded-lg border border-border-subtle bg-surface p-2 space-y-1.5 min-h-[60px]">
        {value.length === 0 && !editing && (
          <div className="text-sm text-muted italic px-2 py-1">— not set</div>
        )}
        {value.map((dm, i) => (
          <div
            key={`${dm.name}-${i}`}
            className="flex items-center gap-2 px-2 py-1 rounded hover:bg-surface-elevated/40 group"
          >
            <span className={`chip ${STANCE_TONE[dm.stance]} text-[10px] shrink-0`}>
              {dm.stance}
            </span>
            <div className="flex-1 min-w-0">
              <div className="text-sm text-foreground truncate">{dm.name}</div>
              {dm.role && (
                <div className="text-[11px] text-muted truncate">{dm.role}</div>
              )}
            </div>
            {editing && (
              <button
                onClick={() => remove(i)}
                className="text-muted hover:text-danger opacity-0 group-hover:opacity-100 transition px-2"
                aria-label={`Remove ${dm.name}`}
              >
                ×
              </button>
            )}
          </div>
        ))}
        {editing &&
          (adding ? (
            <div className="space-y-1.5 p-2 border border-border-subtle rounded">
              <div className="grid grid-cols-2 gap-1.5">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Name"
                  className="bg-surface-elevated border border-border-subtle rounded px-2 py-1 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent/40"
                  autoFocus
                />
                <input
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="Role (e.g. CTO)"
                  className="bg-surface-elevated border border-border-subtle rounded px-2 py-1 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent/40"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <select
                  value={stance}
                  onChange={(e) => setStance(e.target.value as DecisionMaker["stance"])}
                  className="bg-surface-elevated border border-border-subtle rounded px-2 py-1 text-sm text-foreground flex-1 focus:outline-none focus:ring-1 focus:ring-accent/40"
                >
                  <option value="champion">Champion</option>
                  <option value="neutral">Neutral</option>
                  <option value="blocker">Blocker</option>
                </select>
                <button onClick={() => setAdding(false)} className="btn-text text-[11px]">
                  Cancel
                </button>
                <button onClick={add} className="btn-ghost text-[11px]">
                  Add
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setAdding(true)}
              className="w-full text-left text-sm text-muted hover:text-foreground px-2 py-1 rounded transition"
            >
              + add a person
            </button>
          ))}
      </div>
    </div>
  );
}

function SourceField({
  value,
  editing,
  onChange,
}: {
  value: string | null;
  editing: boolean;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <SectionHeader label="Source" />
      {editing ? (
        <select
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-surface border border-border-subtle rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/40"
        >
          <option value="">— Pick a source —</option>
          {Object.entries(SOURCE_LABEL).map(([k, label]) => (
            <option key={k} value={k}>
              {label}
            </option>
          ))}
        </select>
      ) : (
        <div className="rounded-lg border border-border-subtle bg-surface px-3 py-2 text-sm min-h-[42px] flex items-center">
          {value ? (
            <span className="text-foreground">
              {SOURCE_LABEL[value as keyof typeof SOURCE_LABEL] ?? value}
            </span>
          ) : (
            <span className="text-muted italic">— not set</span>
          )}
        </div>
      )}
    </div>
  );
}

function CheckIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
