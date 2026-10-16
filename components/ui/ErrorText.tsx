/** The one way to show an error next to a form or button. */
export default function ErrorText({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  if (!children) return null;
  return (
    <p role="alert" className={["text-sm text-danger", className ?? ""].join(" ").trim()}>
      {children}
    </p>
  );
}
