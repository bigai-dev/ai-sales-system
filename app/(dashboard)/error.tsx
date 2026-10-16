"use client";
import { useEffect } from "react";
import { Button, EmptyState } from "@/components/ui";
import { BTN, ERR } from "@/lib/constants/copy";

// Shown when a page inside the app shell throws. The sidebar stays usable.
export default function DashboardError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="max-w-2xl">
      <EmptyState
        title={ERR.generic}
        hint="The rest of the app still works. If this keeps happening, note what you were doing and try again later."
        action={<Button onClick={() => unstable_retry()}>{BTN.tryAgain}</Button>}
      />
    </section>
  );
}
