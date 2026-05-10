"use client";
import { useEffect } from "react";

type Size = "default" | "lg" | "xl";

const SIZE_CLASS: Record<Size, string> = {
  default: "max-w-lg",
  lg: "max-w-3xl",
  xl: "max-w-5xl",
};

export default function Modal({
  open,
  onClose,
  title,
  children,
  size = "default",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: Size;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md"
      style={{ background: "color-mix(in oklch, black 55%, transparent)" }}
      onClick={onClose}
    >
      <div
        className={`w-full ${SIZE_CLASS[size]} mx-4 max-h-[90vh] overflow-y-auto rounded-xl border border-border bg-surface-elevated p-5 shadow-2xl`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="font-semibold">{title}</div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            title="Close (Esc)"
            className="text-muted hover:text-foreground text-lg leading-none px-2 -mr-2"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
