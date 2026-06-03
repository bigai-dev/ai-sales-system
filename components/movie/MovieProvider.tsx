"use client";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import MovieOverlay from "./MovieOverlay";

type MovieCtx = {
  active: boolean;
  start: () => void;
  exit: () => void;
};

const MovieContext = createContext<MovieCtx | null>(null);

export function useMovie(): MovieCtx {
  const ctx = useContext(MovieContext);
  if (!ctx) throw new Error("useMovie must be used within MovieProvider");
  return ctx;
}

// Stand-alone, full-screen "keynote" demo. Deliberately self-contained: it
// reads nothing from the DB and makes no network calls, so it can't stall or
// fail mid-presentation. All content lives in lib/movie/script.ts.
export default function MovieProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState(false);
  // Bumped on every start so the overlay remounts with fresh state (scene 0).
  const [runId, setRunId] = useState(0);
  const start = useCallback(() => {
    setRunId((r) => r + 1);
    setActive(true);
  }, []);
  const exit = useCallback(() => setActive(false), []);
  const value = useMemo<MovieCtx>(
    () => ({ active, start, exit }),
    [active, start, exit],
  );
  return (
    <MovieContext.Provider value={value}>
      {children}
      <MovieOverlay key={runId} />
    </MovieContext.Provider>
  );
}
