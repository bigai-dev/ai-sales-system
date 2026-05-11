// Pure types and constants for plays — no DB imports, safe to import from
// client components. The query layer at lib/queries/plays.ts uses these.

import type { DrillBucket } from "@/lib/schemas/drill";

export type PlayBucket = DrillBucket | "other";

export type PlaySource = "coaching_strength" | "drill_delivered" | "closed_won";

export type PlayListItem = {
  id: string;
  callId: string;
  bucket: PlayBucket;
  scenario: string;
  repResponseExcerpt: string;
  outcome: string;
  source: PlaySource;
  pinned: boolean;
  hidden: boolean;
  createdAt: number;
  clientName: string | null;
};

export type PlayDetail = PlayListItem & {
  callTitle: string | null;
  // Nullable because the LEFT JOIN to calls won't fail if the call was deleted
  // (cascade should handle it, but type-wise this stays defensive).
  callDate: number | null;
};

export const SOURCE_LABEL: Record<PlaySource, string> = {
  coaching_strength: "Strength noted in coaching",
  drill_delivered: "Drill best-response delivered live",
  closed_won: "From a closed-won call",
};

export const SOURCE_TONE: Record<PlaySource, "good" | "info" | "warn"> = {
  coaching_strength: "info",
  drill_delivered: "good",
  closed_won: "good",
};
