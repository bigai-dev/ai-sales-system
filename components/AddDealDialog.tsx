"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Modal from "./Modal";
import { createDeal } from "@/app/(dashboard)/pipeline/actions";
import type { SpancoCode } from "@/lib/constants/labels";
import { DAY_MS } from "@/lib/format/time";

const STAGES: { code: SpancoCode; name: string }[] = [
  { code: "S", name: "Suspect" },
  { code: "P", name: "Prospect" },
  { code: "A", name: "Analysis" },
  { code: "N", name: "Negotiation" },
  { code: "C", name: "Conclusion" },
  { code: "O", name: "Order" },
];

const NEXT_STEP_OPTIONS: { value: string; label: string }[] = [
  { value: "discovery_call", label: "Discovery call" },
  { value: "send_proposal", label: "Send proposal" },
  { value: "followup_email", label: "Follow-up email" },
  { value: "decision_meeting", label: "Decision meeting" },
  { value: "contract_invoice", label: "Contract / invoice" },
  { value: "workshop_delivery", label: "Workshop delivery" },
  { value: "other", label: "Other" },
];

function formatNextStepDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  let hours = d.getHours();
  const mins = d.getMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "pm" : "am";
  hours = hours % 12 || 12;
  const time = `${hours}:${mins}${ampm}`;
  const daysOut = (d.getTime() - Date.now()) / DAY_MS;
  if (daysOut >= 0 && daysOut <= 7) {
    const weekday = d.toLocaleDateString("en-US", { weekday: "short" });
    return `${weekday} ${time}`;
  }
  const md = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `${md} ${time}`;
}

function composeNextStep(action: string, dateIso: string, otherText: string): string | undefined {
  const label =
    action === "other"
      ? otherText.trim()
      : NEXT_STEP_OPTIONS.find((o) => o.value === action)?.label ?? "";
  const date = dateIso ? formatNextStepDate(dateIso) : "";
  if (!label && !date) return undefined;
  if (!label) return date;
  if (!date) return label;
  return `${date} — ${label}`;
}

export type ClientOption = { id: string; name: string };

export default function AddDealDialog({ clients }: { clients: ClientOption[] }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [nextStepAction, setNextStepAction] = useState<string>("discovery_call");
  const [nextStepDate, setNextStepDate] = useState<string>("");
  const [nextStepOther, setNextStepOther] = useState<string>("");
  const router = useRouter();

  function onSubmit(fd: FormData) {
    setError(null);
    startTransition(async () => {
      const tagsRaw = String(fd.get("tags") ?? "").trim();
      const tags = tagsRaw ? tagsRaw.split(",").map((t) => t.trim()).filter(Boolean) : [];
      const headcount = Number(fd.get("headcount")) || undefined;
      const deliveryDateStr = String(fd.get("deliveryDate") ?? "").trim();
      const deliveryDate = deliveryDateStr ? new Date(deliveryDateStr).getTime() : undefined;
      const r = await createDeal({
        clientId: String(fd.get("clientId") ?? ""),
        value: String(fd.get("value") ?? ""),
        stage: (fd.get("stage") as SpancoCode) || "S",
        hot: fd.get("hot") === "on",
        nextStep: composeNextStep(nextStepAction, nextStepDate, nextStepOther),
        tags,
        headcount,
        deliveryDate,
      });
      if (r.ok) {
        setOpen(false);
        setNextStepAction("discovery_call");
        setNextStepDate("");
        setNextStepOther("");
        router.refresh();
      } else {
        setError(r.error);
      }
    });
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn">
        + New workshop deal
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="New workshop deal">
        <form action={onSubmit} className="space-y-3 text-sm">
          <label className="flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-wider text-muted">Client</span>
            <select
              name="clientId"
              required
              className="bg-surface border border-border-subtle rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/40"
            >
              <option value="">— Pick a client —</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Workshop value (excl. SST)" name="value" placeholder="RM 70K" />
            <SelectField label="Stage" name="stage" defaultValue="S">
              {STAGES.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.code} — {s.name}
                </option>
              ))}
            </SelectField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Headcount" name="headcount" type="number" placeholder="20" />
            <Field label="Delivery date" name="deliveryDate" type="date" />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-wider text-muted">Next step</span>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={nextStepAction}
                onChange={(e) => setNextStepAction(e.target.value)}
                className="bg-surface border border-border-subtle rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/40"
              >
                {NEXT_STEP_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <input
                type="datetime-local"
                value={nextStepDate}
                onChange={(e) => setNextStepDate(e.target.value)}
                className="bg-surface border border-border-subtle rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/40"
              />
            </div>
            {nextStepAction === "other" && (
              <input
                type="text"
                value={nextStepOther}
                onChange={(e) => setNextStepOther(e.target.value)}
                placeholder="Describe the next step"
                className="mt-2 bg-surface border border-border-subtle rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/40"
              />
            )}
            {composeNextStep(nextStepAction, nextStepDate, nextStepOther) && (
              <div className="mt-1 text-[11px] text-muted">
                Preview:{" "}
                <span className="text-foreground">
                  {composeNextStep(nextStepAction, nextStepDate, nextStepOther)}
                </span>
              </div>
            )}
          </div>
          <Field
            label="Tags (comma-separated, max 2)"
            name="tags"
            placeholder="Backend-heavy, Champion: VPE"
          />
          <label className="chip cursor-pointer inline-flex items-center gap-2">
            <input type="checkbox" name="hot" className="accent-accent" />
            🔥 Mark as hot
          </label>
          {error && <div className="text-xs chip-bad chip">{error}</div>}
          <div className="flex gap-2 justify-end pt-2">
            <button type="button" onClick={() => setOpen(false)} className="btn-ghost">
              Cancel
            </button>
            <button type="submit" className="btn" disabled={pending}>
              {pending ? "Creating…" : "Create deal"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}

function Field({
  label,
  name,
  type = "text",
  placeholder,
  defaultValue,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  defaultValue?: string;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] uppercase tracking-wider text-muted">{label}</span>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        defaultValue={defaultValue}
        className="bg-surface border border-border-subtle rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/40"
      />
    </label>
  );
}

function SelectField({
  label,
  name,
  defaultValue,
  children,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] uppercase tracking-wider text-muted">{label}</span>
      <select
        name={name}
        defaultValue={defaultValue}
        className="bg-surface border border-border-subtle rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/40"
      >
        {children}
      </select>
    </label>
  );
}
