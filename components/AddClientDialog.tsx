"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Modal from "./Modal";
import { createClient } from "@/app/(dashboard)/clients/actions";

const STAGES = ["Lead", "Qualified", "Discovery", "Proposal", "Negotiation", "Closed-won"] as const;
const SIZES = ["SMB", "Mid-market", "Enterprise"] as const;

export default function AddClientDialog() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function onSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createClient({
        name: String(formData.get("name") ?? ""),
        contactName: String(formData.get("contactName") ?? ""),
        contactRole: String(formData.get("contactRole") ?? "") || undefined,
        industry: String(formData.get("industry") ?? "") || undefined,
        size: (formData.get("size") as (typeof SIZES)[number]) || "Mid-market",
        employees: Number(formData.get("employees")) || undefined,
        devCount: Number(formData.get("devCount")) || undefined,
        arr: String(formData.get("arr") ?? "") || undefined,
        stage: (formData.get("stage") as (typeof STAGES)[number]) || "Lead",
        health: Number(formData.get("health")) || 50,
      });
      if (result.ok) {
        setOpen(false);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn">
        + Add client
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Add client">
        <form action={onSubmit} className="space-y-3 text-sm">
          <Field label="Company name" name="name" required />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Contact name" name="contactName" required />
            <Field label="Contact role" name="contactRole" placeholder="e.g. VP Engineering" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Industry" name="industry" placeholder="e.g. SaaS, Fintech" />
            <Select label="Size" name="size" options={SIZES} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Total employees" name="employees" type="number" />
            <Field label="Engineers" name="devCount" type="number" placeholder="28" />
            <Field label="Workshop value (excl. SST)" name="arr" placeholder="RM 70K" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Select label="Stage" name="stage" options={STAGES} />
            <Field label="Account health" name="health" type="number" defaultValue="60" />
          </div>
          {error && <div className="text-xs chip-bad chip">{error}</div>}
          <div className="flex gap-2 justify-end pt-2">
            <button type="button" onClick={() => setOpen(false)} className="btn-ghost">
              Cancel
            </button>
            <button type="submit" className="btn" disabled={pending}>
              {pending ? "Adding…" : "Add client"}
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
  required,
  type = "text",
  placeholder,
  defaultValue,
}: {
  label: string;
  name: string;
  required?: boolean;
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
        required={required}
        placeholder={placeholder}
        defaultValue={defaultValue}
        className="bg-surface border border-border-subtle rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/40"
      />
    </label>
  );
}

function Select({
  label,
  name,
  options,
}: {
  label: string;
  name: string;
  options: readonly string[];
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] uppercase tracking-wider text-muted">{label}</span>
      <select
        name={name}
        className="bg-surface border border-border-subtle rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/40"
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
