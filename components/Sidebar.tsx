"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  BookOpen,
  Building2,
  Kanban,
  LayoutDashboard,
  ListTodo,
  Menu,
  MessageSquare,
  Phone,
  GraduationCap,
  X,
} from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import DemoMenu from "./DemoMenu";
import { BRAND, NAV_MAIN, NAV_TRAINING, type NavIcon, type NavItem } from "@/lib/constants/copy";
import { routes } from "@/lib/constants/routes";

const ICON: Record<NavIcon, React.ComponentType<{ size?: number; "aria-hidden"?: boolean }>> = {
  today: ListTodo,
  dashboard: LayoutDashboard,
  clients: Building2,
  deals: Kanban,
  calls: Phone,
  training: GraduationCap,
  rolePlay: MessageSquare,
  playbook: BookOpen,
};

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  // Training is the section landing: exact match only, so Role play and
  // Playbook can claim their own routes.
  if (href === routes.training()) return pathname === href;
  return pathname === href || pathname.startsWith(href + "/");
}

export default function Sidebar({
  user,
}: {
  user: { initials: string; name: string; role: string };
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <>
      <button
        type="button"
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => setOpen((o) => !o)}
        className="fixed left-3 top-3 z-[60] flex h-10 w-10 items-center justify-center rounded-lg border border-border-subtle bg-background/90 text-foreground backdrop-blur md:hidden"
      >
        {open ? <X size={18} aria-hidden /> : <Menu size={18} aria-hidden />}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-40 backdrop-blur-sm md:hidden"
          style={{ background: "color-mix(in oklch, var(--background) 35%, transparent)" }}
          onClick={close}
          aria-hidden
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen w-60 transform flex-col border-r border-border-subtle bg-surface transition-transform duration-200 ${
          open ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0`}
      >
        <Link
          href={routes.today()}
          onClick={close}
          className="flex items-center gap-3 border-b border-border-subtle px-5 pb-4 pt-5"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent font-bold text-white">
            S
          </div>
          <div className="min-w-0">
            <div className="text-[15px] font-semibold leading-tight tracking-tight">
              {BRAND.name}
            </div>
            <div className="mt-0.5 text-xs text-muted">{BRAND.tagline}</div>
          </div>
        </Link>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <div className="space-y-0.5">
            {NAV_MAIN.map((item) => (
              <NavLink key={item.href} item={item} active={isActive(pathname, item.href)} onClick={close} />
            ))}
          </div>

          <div className="mt-5 border-t border-border-subtle pt-4">
            <div className="mb-2 px-3 text-xs font-semibold text-muted">Training</div>
            <div className="space-y-0.5">
              {NAV_TRAINING.map((item) => (
                <NavLink key={item.href} item={item} active={isActive(pathname, item.href)} onClick={close} />
              ))}
            </div>
          </div>
        </nav>

        <div className="space-y-3 border-t border-border-subtle px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-quiet text-sm font-semibold text-foreground">
              {user.initials}
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-medium leading-tight">{user.name}</div>
              <div className="text-xs leading-tight text-muted">{user.role}</div>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <DemoMenu />
            <ThemeToggle />
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
  const Icon = ICON[item.icon];
  return (
    <Link
      href={item.href}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`nav-item ${active ? "active" : ""}`}
    >
      <Icon size={18} aria-hidden />
      <span>{item.label}</span>
    </Link>
  );
}
