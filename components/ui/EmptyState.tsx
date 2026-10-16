import type { ReactNode } from "react";

/** The one "nothing here yet" box. */
export default function EmptyState({
  title,
  hint,
  action,
  compact = false,
}: {
  title: ReactNode;
  hint?: ReactNode;
  action?: ReactNode;
  compact?: boolean;
}) {
  return (
    <div className={`panel text-center ${compact ? "p-5" : "p-8"}`}>
      <p className="text-sm font-medium text-foreground">{title}</p>
      {hint ? <p className="mx-auto mt-1 max-w-md text-xs text-muted">{hint}</p> : null}
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}
