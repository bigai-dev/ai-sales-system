"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Modal from "./Modal";
import { createClient } from "@/app/(dashboard)/clients/actions";
import { Button, ErrorText, Field, Input, Select } from "@/components/ui";
import { BUSY } from "@/lib/constants/copy";

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
      <Button onClick={() => setOpen(true)}>Add client</Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Add client">
        <form action={onSubmit} className="space-y-3 text-sm">
          <Field label="Company name">
            <Input name="name" required />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Contact name">
              <Input name="contactName" required />
            </Field>
            <Field label="Contact role">
              <Input name="contactRole" placeholder="e.g. Head of Engineering" />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Industry">
              <Input name="industry" placeholder="e.g. Logistics, Fintech" />
            </Field>
            <Field label="Company size">
              <Select name="size" defaultValue="Mid-market">
                {SIZES.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Total staff">
              <Input name="employees" type="number" min={0} />
            </Field>
            <Field label="Engineers">
              <Input name="devCount" type="number" min={0} placeholder="28" />
            </Field>
            <Field label="Workshop value" hint="Before SST">
              <Input name="arr" placeholder="RM 70K" />
            </Field>
          </div>
          <p className="text-xs text-muted">
            The client starts as a new lead. Its stage follows its deals from there.
          </p>
          <ErrorText>{error}</ErrorText>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" busy={pending} busyLabel={BUSY.adding}>
              Add client
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
