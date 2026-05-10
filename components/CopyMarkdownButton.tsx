"use client";
import { useState } from "react";

export default function CopyMarkdownButton({
  markdown,
  label = "Export",
  copiedLabel = "✓ Copied",
  variant = "ghost",
}: {
  markdown: string;
  label?: string;
  copiedLabel?: string;
  variant?: "primary" | "ghost" | "text";
}) {
  const [copied, setCopied] = useState(false);
  const cls =
    variant === "primary" ? "btn" : variant === "text" ? "btn-text" : "btn-ghost";
  return (
    <button
      type="button"
      className={cls}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(markdown);
          setCopied(true);
          setTimeout(() => setCopied(false), 1800);
        } catch {
          // fallback for older browsers / permission denied
          const ta = document.createElement("textarea");
          ta.value = markdown;
          document.body.appendChild(ta);
          ta.select();
          document.execCommand("copy");
          document.body.removeChild(ta);
          setCopied(true);
          setTimeout(() => setCopied(false), 1800);
        }
      }}
    >
      {copied ? copiedLabel : label}
    </button>
  );
}
