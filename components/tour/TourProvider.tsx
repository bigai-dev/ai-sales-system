"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { TOUR_STEPS } from "@/lib/tour/steps";
import type { TourStep } from "@/lib/tour/types";
import type { DemoTargets } from "@/lib/queries/demo-targets";
import { fetchDemoTargets } from "@/app/actions/tour";

type TourCtx = {
  active: boolean;
  index: number;
  step: TourStep | null;
  totalSteps: number;
  targets: DemoTargets | null;
  start: () => Promise<void>;
  next: () => void;
  prev: () => void;
  exit: () => void;
};

const TourContext = createContext<TourCtx | null>(null);

export function useTour(): TourCtx {
  const ctx = useContext(TourContext);
  if (!ctx) throw new Error("useTour must be used within TourProvider");
  return ctx;
}

export default function TourProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [active, setActive] = useState(false);
  const [index, setIndex] = useState(0);
  const [targets, setTargets] = useState<DemoTargets | null>(null);

  const step = active ? (TOUR_STEPS[index] ?? null) : null;

  const navigateTo = useCallback(
    (s: TourStep, t: DemoTargets) => {
      const want = s.route(t);
      if (want !== pathname) router.push(want);
    },
    [pathname, router],
  );

  const start = useCallback(async () => {
    const t = await fetchDemoTargets();
    setTargets(t);
    setIndex(0);
    setActive(true);
    navigateTo(TOUR_STEPS[0]!, t);
  }, [navigateTo]);

  const next = useCallback(() => {
    const ni = Math.min(index + 1, TOUR_STEPS.length - 1);
    if (ni === index) {
      setActive(false);
      return;
    }
    setIndex(ni);
    if (targets) navigateTo(TOUR_STEPS[ni]!, targets);
  }, [index, navigateTo, targets]);

  const prev = useCallback(() => {
    const ni = Math.max(index - 1, 0);
    if (ni === index) return;
    setIndex(ni);
    if (targets) navigateTo(TOUR_STEPS[ni]!, targets);
  }, [index, navigateTo, targets]);

  const exit = useCallback(() => {
    setActive(false);
  }, []);

  // Lock body scroll while tour is open so the page can't drift away from
  // the spotlight.
  useEffect(() => {
    if (!active) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [active]);

  // ESC to exit, Arrow keys to navigate.
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") exit();
      else if (e.key === "ArrowRight" || e.key === "Enter") next();
      else if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, exit, next, prev]);

  const value = useMemo<TourCtx>(
    () => ({
      active,
      index,
      step,
      totalSteps: TOUR_STEPS.length,
      targets,
      start,
      next,
      prev,
      exit,
    }),
    [active, index, step, targets, start, next, prev, exit],
  );

  return <TourContext.Provider value={value}>{children}</TourContext.Provider>;
}
