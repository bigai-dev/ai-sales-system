"use client";
import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { generateHealthCheck } from "@/lib/ai/health-check";
import { Button, ErrorText } from "@/components/ui";
import { BTN, BUSY } from "@/lib/constants/copy";

export default function GenerateHealthCheckButton({
  clientId,
  variant = "primary",
  label = BTN.runReadiness,
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
      <Button
        variant={variant}
        busy={pending}
        busyLabel={BUSY.running}
        onClick={() =>
          start(async () => {
            setError(null);
            const r = await generateHealthCheck(clientId);
            if (!r.ok) setError(r.error);
            else router.refresh();
          })
        }
      >
        {label}
      </Button>
      <ErrorText>{error}</ErrorText>
    </div>
  );
}
