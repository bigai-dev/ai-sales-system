import type { HTMLAttributes, ReactNode } from "react";
import SectionLabel from "./SectionLabel";

type Padding = "sm" | "md" | "none";
const PAD: Record<Padding, string> = { sm: "p-4", md: "p-5", none: "" };

/**
 * The one card. Optional title row (title left, `aside` right).
 * Any `data-*` attribute passes through, so tour anchors keep working.
 */
export default function Panel({
  title,
  aside,
  padding = "md",
  className,
  children,
  ...rest
}: HTMLAttributes<HTMLDivElement> & {
  title?: ReactNode;
  aside?: ReactNode;
  padding?: Padding;
  children: ReactNode;
}) {
  return (
    <section className={["panel", PAD[padding], className ?? ""].join(" ").trim()} {...rest}>
      {(title || aside) && (
        <div className="mb-3 flex items-center justify-between gap-3">
          {title ? <SectionLabel>{title}</SectionLabel> : <span />}
          {aside}
        </div>
      )}
      {children}
    </section>
  );
}
