"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";

type NavItem = {
  label: string;
  href: string;
  icon: ReactNode;
  // When true, render as a non-clickable placeholder with a "Soon" tag.
  comingSoon?: boolean;
};

// Primary workspace nav — the day-to-day CRM surfaces.
const NAV_MAIN: NavItem[] = [
  { label: "Today", href: "/today", icon: <TodayIcon /> },
  { label: "Dashboard", href: "/", icon: <DashboardIcon /> },
  { label: "Pipeline", href: "/pipeline", icon: <PipelineIcon /> },
  { label: "Calls", href: "/calls", icon: <CallsIcon /> },
  { label: "Clients", href: "/clients", icon: <ClientsIcon /> },
  { label: "Readiness", href: "/health-check", icon: <ReadinessIcon /> },
];

// Training section — separate group with its own submenus.
const NAV_TRAINING: NavItem[] = [
  { label: "Overview", href: "/training", icon: <OverviewIcon /> },
  { label: "Trends", href: "/training/trends", icon: <TrainingIcon /> },
  {
    label: "Drills",
    href: "/training/drills",
    icon: <DrillsIcon />,
  },
  {
    label: "Playbook",
    href: "/training/playbook",
    icon: <PlaybookIcon />,
  },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  // Readiness is a section, not just a URL prefix: it owns any path ending
  // in /health-check, even nested under /clients/[id]/health-check.
  const onHealthCheck = pathname.endsWith("/health-check");
  if (href === "/health-check") return onHealthCheck;
  if (onHealthCheck) return false;
  // /training is the section landing — it should highlight only on exact
  // match so the deeper Trends/Drills/Playbook items can claim active state
  // when the user is on those routes.
  if (href === "/training") return pathname === "/training";
  return pathname === href || pathname.startsWith(href + "/");
}

export default function Sidebar({
  user,
}: {
  user: { initials: string; name: string; role: string };
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        aria-label="Open menu"
        onClick={() => setOpen(true)}
        className="md:hidden fixed top-3 left-3 z-50 w-10 h-10 rounded-lg border border-border-subtle bg-background/90 backdrop-blur flex items-center justify-center text-foreground hover:text-white"
      >
        <MenuIcon />
      </button>

      {open && (
        <div
          className="md:hidden fixed inset-0 z-40 backdrop-blur-sm"
          style={{ background: "color-mix(in oklch, var(--background) 35%, transparent)" }}
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}

      <aside
        className={`fixed left-0 top-0 h-screen w-60 z-50 flex flex-col border-r border-border-subtle bg-surface transform transition-transform duration-200 ${
          open ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0`}
      >
        <Link
          href="/"
          onClick={() => setOpen(false)}
          className="px-5 pt-5 pb-4 flex items-center gap-3 border-b border-border-subtle"
        >
          <div className="w-9 h-9 rounded-lg bg-accent flex items-center justify-center font-bold text-white shrink-0">
            S
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-[15px] leading-tight tracking-tight">SALES.AI</div>
            <div className="text-[10px] uppercase tracking-wider text-muted mt-0.5">
              Vibe-coding training
            </div>
          </div>
        </Link>

        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <div className="space-y-0.5">
            {NAV_MAIN.map((item) => (
              <NavLink
                key={item.href}
                item={item}
                active={isActive(pathname, item.href)}
                onClick={() => setOpen(false)}
              />
            ))}
          </div>

          <div className="mt-5 pt-4 border-t border-border-subtle">
            <div className="px-3 mb-2 text-[10px] uppercase tracking-wider text-muted font-semibold">
              Training
            </div>
            <div className="space-y-0.5">
              {NAV_TRAINING.map((item) => (
                <NavLink
                  key={item.href}
                  item={item}
                  active={isActive(pathname, item.href)}
                  onClick={() => setOpen(false)}
                />
              ))}
            </div>
          </div>
        </nav>

        <div className="border-t border-border-subtle px-4 py-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-accent-quiet text-foreground flex items-center justify-center font-semibold text-sm shrink-0">
            {user.initials}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-medium leading-tight truncate">
              {user.name}
            </div>
            <div className="text-[11px] text-muted leading-tight">{user.role}</div>
          </div>
        </div>
      </aside>
    </>
  );
}

function NavLink({
  item,
  active,
  onClick,
}: {
  item: NavItem;
  active: boolean;
  onClick: () => void;
}) {
  if (item.comingSoon) {
    return (
      <div
        className="flex items-center gap-3 px-3 py-2 rounded-md text-[13px] font-semibold text-muted/60 cursor-not-allowed"
        aria-disabled
      >
        <span className="shrink-0" aria-hidden>
          {item.icon}
        </span>
        <span className="flex-1">{item.label}</span>
        <span className="text-[9px] uppercase tracking-wider rounded bg-surface-elevated px-1.5 py-0.5 border border-border-subtle">
          Soon
        </span>
      </div>
    );
  }
  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-2 rounded-md text-[13px] font-semibold transition ${
        active
          ? "bg-accent text-accent-foreground"
          : "text-muted hover:text-foreground hover:bg-surface-elevated/60"
      }`}
    >
      <span className="shrink-0" aria-hidden>
        {item.icon}
      </span>
      <span>{item.label}</span>
    </Link>
  );
}

function MenuIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="4" y1="6" x2="20" y2="6" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="18" x2="20" y2="18" />
    </svg>
  );
}

function TodayIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z" />
    </svg>
  );
}

function DashboardIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function PipelineIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="5" height="18" rx="1" />
      <rect x="10" y="3" width="5" height="12" rx="1" />
      <rect x="17" y="3" width="4" height="7" rx="1" />
    </svg>
  );
}

function CallsIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

function ClientsIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function TrainingIcon() {
  // Used by the "Trends" submenu — line going up-and-to-the-right.
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 17l6-6 4 4 8-8" />
      <path d="M14 7h7v7" />
    </svg>
  );
}

function OverviewIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
    </svg>
  );
}

function DrillsIcon() {
  // Target — drills are about hitting the target.
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
    </svg>
  );
}

function PlaybookIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 5a2 2 0 0 1 2-2h13v18H6a2 2 0 0 1-2-2V5z" />
      <path d="M4 17h15" />
      <path d="M9 7h6" />
    </svg>
  );
}

function ReadinessIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z" />
      <path d="M3.22 12H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27" />
    </svg>
  );
}
