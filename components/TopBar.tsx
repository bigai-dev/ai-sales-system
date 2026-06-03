"use client";
import { usePathname } from "next/navigation";
import ThemeToggle from "./ThemeToggle";
import TourLauncher from "./tour/TourLauncher";
import MovieLauncher from "./movie/MovieLauncher";

function titleFor(pathname: string): string {
  if (pathname === "/today") return "Today";
  if (pathname === "/") return "Dashboard";
  if (pathname === "/pipeline") return "Your deals";
  if (pathname === "/calls") return "Calls";
  if (pathname.startsWith("/calls/")) return "Call";
  if (pathname === "/clients") return "Clients";
  if (pathname.endsWith("/health-check")) return "Fit check";
  if (pathname.startsWith("/clients/")) return "Client";
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
        <MovieLauncher />
        <TourLauncher />
        <ThemeToggle />
      </div>
    </header>
  );
}
