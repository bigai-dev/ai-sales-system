export default function Skeleton({ className = "h-4 w-full" }: { className?: string }) {
  return <div className={`skeleton ${className}`} aria-hidden />;
}

/** A grey page: title block plus a few panels. Used by loading.tsx files. */
export function PageSkeleton({ panels = 3 }: { panels?: number }) {
  return (
    <div>
      <Skeleton className="h-7 w-48" />
      <Skeleton className="mt-2 h-4 w-72" />
      <div className="mt-6 space-y-4">
        {Array.from({ length: panels }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}
