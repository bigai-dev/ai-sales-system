"use client";

import { useRef, useState, useTransition } from "react";
import { captureScratch } from "@/app/(dashboard)/today/actions";

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
    <div className="rounded-xl border border-border-subtle bg-surface px-3 py-2.5 flex items-center gap-2">
      <span className="text-muted text-sm shrink-0" aria-hidden>
        +
      </span>
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
        placeholder="Quick capture — anything you don't want to forget"
        className="flex-1 bg-transparent border-0 text-sm text-foreground placeholder:text-muted focus:outline-none"
      />
      <input
        type="datetime-local"
        value={dueAt}
        onChange={(e) => setDueAt(e.target.value)}
        className="bg-surface-elevated border border-border-subtle rounded-md px-2 py-1 text-[11px] text-foreground focus:outline-none focus:ring-1 focus:ring-accent/40"
        title="Due date (optional)"
      />
      <button
        onClick={submit}
        disabled={pending || !body.trim()}
        className="btn-ghost shrink-0 disabled:opacity-50"
      >
        Add
      </button>
    </div>
  );
}
