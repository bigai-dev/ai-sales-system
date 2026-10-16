import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonVariant = "primary" | "ghost" | "danger" | "text" | "textDanger";
export type ButtonSize = "md" | "sm";

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary: "btn",
  ghost: "btn-ghost",
  danger: "btn-danger",
  text: "btn-text",
  textDanger: "btn-text-danger",
};

export function buttonClass(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
  extra?: string,
): string {
  return [VARIANT_CLASS[variant], size === "sm" ? "btn-sm" : "", extra ?? ""]
    .filter(Boolean)
    .join(" ");
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** While true the button is disabled and shows `busyLabel` (or its children). */
  busy?: boolean;
  busyLabel?: string;
  icon?: ReactNode;
};

export default function Button({
  variant = "primary",
  size = "md",
  busy = false,
  busyLabel,
  icon,
  className,
  children,
  disabled,
  type = "button",
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || busy}
      aria-busy={busy || undefined}
      className={buttonClass(variant, size, className)}
      {...rest}
    >
      {!busy && icon}
      {busy && busyLabel ? busyLabel : children}
    </button>
  );
}

export function ButtonLink({
  href,
  variant = "primary",
  size = "md",
  icon,
  className,
  children,
  ...rest
}: {
  href: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
  className?: string;
  children: ReactNode;
} & Omit<React.ComponentProps<typeof Link>, "href" | "className" | "children">) {
  return (
    <Link href={href} className={buttonClass(variant, size, className)} {...rest}>
      {icon}
      {children}
    </Link>
  );
}
