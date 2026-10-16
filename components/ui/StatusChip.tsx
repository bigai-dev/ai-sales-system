import type { ReactNode } from "react";
import { TONE_CHIP, type Tone } from "@/lib/constants/labels";

/** The one coloured tag. Use sparingly: one per row at most. */
export default function StatusChip({
  tone = "neutral",
  children,
  className,
  title,
}: {
  tone?: Tone;
  children: ReactNode;
  className?: string;
  title?: string;
}) {
  return (
    <span className={[TONE_CHIP[tone], className ?? ""].join(" ").trim()} title={title}>
      {children}
    </span>
  );
}
