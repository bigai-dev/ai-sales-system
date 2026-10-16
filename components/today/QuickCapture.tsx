"use client";

import { useRef, useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { captureScratch } from "@/app/(dashboard)/today/actions";
import { Button, Input } from "@/components/ui";
import { BUSY } from "@/lib/constants/copy";

/** One-line box to drop a note onto the Today list. */
export default function QuickCapture() {
  const [body, setBody] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement | null>(null);

  function submit() {
    if (!body.trim()) return;
    const fd = new FormData();
    fd.set("body", body.trim());
    if (dueAt) fd.set("dueAt", dueAt);
    startTransition(async () => {
      await captureScratch(fd);
      setBody("");
      setDueAt("");
      inputRef.current?.focus();
    });
  }

  return (
    <div className="panel flex flex-wrap items-center gap-2 px-3 py-2.5">
      <Plus size={16} className="shrink-0 text-muted" aria-hidden />
      <input
        ref={inputRef}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            submit();
          }
        }}
        placeholder="Add a note — anything you don't want to forget"
        aria-label="Add a note"
        className="min-w-[12rem] flex-1 border-0 bg-transparent text-sm text-foreground placeholder:text-quiet focus:outline-none"
      />
      <Input
        type="datetime-local"
        value={dueAt}
        onChange={(e) => setDueAt(e.target.value)}
        className="w-auto py-1 text-xs"
        title="When (optional)"
        aria-label="When (optional)"
      />
      <Button variant="ghost" size="sm" onClick={submit} disabled={!body.trim()} busy={pending} busyLabel={BUSY.adding}>
        Add
      </Button>
    </div>
  );
}
