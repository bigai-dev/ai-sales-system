import type { ReactNode } from "react";

/** In-page section title. Replaces the small all-caps eyebrows. */
export default function SectionLabel({
  children,
  hint,
  className,
}: {
  children: ReactNode;
  hint?: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <h2 className="text-sm font-semibold text-foreground">{children}</h2>
      {hint ? <p className="text-xs text-muted">{hint}</p> : null}
    </div>
  );
}
