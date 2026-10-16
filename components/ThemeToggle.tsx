"use client";
import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";

// The page's <html class="dark"> is the source of truth (set before paint by
// public/theme-init.js). This hook mirrors it into React without any effect.
function subscribe(onChange: () => void) {
  const obs = new MutationObserver(onChange);
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => obs.disconnect();
}
const isDarkNow = () => document.documentElement.classList.contains("dark");
const serverSnapshot = () => false;

export default function ThemeToggle() {
  const dark = useSyncExternalStore(subscribe, isDarkNow, serverSnapshot);

  function toggle() {
    const next = !dark;
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {
      // Storage blocked; the choice just won't be remembered.
    }
  }

  const label = dark ? "Switch to light mode" : "Switch to dark mode";
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      className="flex h-9 w-9 items-center justify-center rounded-md text-muted transition hover:bg-surface-elevated hover:text-foreground"
    >
      {dark ? <Sun size={17} aria-hidden /> : <Moon size={17} aria-hidden />}
    </button>
  );
}
