import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 text-sm text-muted transition hover:text-foreground"
    >
      <ChevronLeft size={16} aria-hidden />
      {label}
    </Link>
  );
}
