import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

/** Label on top, control below. */
export function Field({
  label,
  hint,
  children,
  className,
}: {
  label: ReactNode;
  hint?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={["flex flex-col gap-1", className ?? ""].join(" ").trim()}>
      <span className="label">{label}</span>
      {children}
      {hint ? <span className="text-xs text-quiet">{hint}</span> : null}
    </label>
  );
}

export function Input({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={["input", className ?? ""].join(" ").trim()} {...rest} />;
}

export function Select({ className, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={["input", className ?? ""].join(" ").trim()} {...rest}>
      {children}
    </select>
  );
}

export function Textarea({ className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={["input", className ?? ""].join(" ").trim()} {...rest} />;
}
