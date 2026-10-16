"use client";
import { useState } from "react";
import Modal from "./Modal";
import { createCallForClient } from "@/app/(dashboard)/calls/actions";
import { Button, Field, Input, Select } from "@/components/ui";
import { BTN } from "@/lib/constants/copy";

function defaultDateTimeLocal(): string {
  // Tomorrow at 09:00, local time, in the "YYYY-MM-DDTHH:mm" form the
  // date-time picker expects.
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(9, 0, 0, 0);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * Plans a call. On a client's page the client is fixed; on the Calls page a
 * list of clients is passed in and the person picks one.
 */
export default function PlanCallButton({
  clientId,
  clients,
  variant = "ghost",
}: {
  clientId?: string;
  clients?: { id: string; name: string }[];
  variant?: "primary" | "ghost";
}) {
  const [open, setOpen] = useState(false);
  const [scheduledAt, setScheduledAt] = useState<string>(defaultDateTimeLocal);

  return (
    <>
      <Button variant={variant} onClick={() => setOpen(true)}>
        {BTN.planCall}
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Plan a call">
        <form action={createCallForClient} className="space-y-4 text-sm">
          {clientId ? (
            <input type="hidden" name="clientId" value={clientId} />
          ) : (
            <Field label="Client">
              <Select name="clientId" required defaultValue="">
                <option value="" disabled>
                  Choose a client…
                </option>
                {(clients ?? []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </Field>
          )}
          <Field
            label="When"
            hint="You'll land on the call page, where you can make a call plan and take notes."
          >
            <Input
              type="datetime-local"
              name="scheduledAt"
              required
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
            />
          </Field>
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              {BTN.cancel}
            </Button>
            <Button type="submit">{BTN.planCall}</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
