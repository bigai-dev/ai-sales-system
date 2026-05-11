"use client";
import { usePathname } from "next/navigation";
import ThemeToggle from "./ThemeToggle";
import TourLauncher from "./tour/TourLauncher";

function titleFor(pathname: string): string {
  if (pathname === "/today") return "Today";
  if (pathname === "/") return "Sales Pipeline Dashboard";
  if (pathname === "/pipeline") return "SPANCO Pipeline";
  if (pathname === "/calls") return "Call Sessions";
  if (pathname.startsWith("/calls/")) return "Call Session";
  if (pathname === "/clients") return "Client Directory";
  if (pathname.endsWith("/health-check")) return "Workshop Readiness";
  if (pathname.startsWith("/clients/")) return "Client Profile";
  if (pathname === "/training") return "Training";
  if (pathname === "/training/trends") return "Training · Trends";
  if (pathname.startsWith("/training/")) return "Training";
  return "SALES.AI";
}

export default function TopBar() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border-subtle bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 px-6 md:px-8">
      <h1 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted ml-12 md:ml-0">
        {titleFor(pathname)}
      </h1>
      <div className="flex items-center gap-2">
        <TourLauncher />
        <ThemeToggle />
      </div>
    </header>
  );
}
