"use client";
import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { generateHealthCheck } from "@/app/(dashboard)/clients/[id]/health-check/actions";

export default function GenerateHealthCheckButton({
  clientId,
  variant = "primary",
  label = "Generate readiness audit",
}: {
  clientId: string;
  variant?: "primary" | "ghost";
  label?: string;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  return (
    <div className="flex items-center gap-2">
      <button
        className={variant === "primary" ? "btn" : "btn-ghost"}
        disabled={pending}
        onClick={() =>
          start(async () => {
            setError(null);
            const r = await generateHealthCheck(clientId);
            if (!r.ok) {
              setError(r.error);
            } else {
              router.refresh();
            }
          })
        }
      >
        {pending ? "Generating…" : label}
      </button>
      {error && <span className="chip chip-bad">{error.slice(0, 80)}</span>}
    </div>
  );
}
