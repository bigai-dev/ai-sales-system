// Shared display labels for SPANCO stages and discovery sources.
// Single source of truth — extend here, not in feature files.

export type SpancoCode = "S" | "P" | "A" | "N" | "C" | "O";

export const STAGE_NAME: Record<SpancoCode, string> = {
  S: "Suspect",
  P: "Prospect",
  A: "Analysis",
  N: "Negotiation",
  C: "Conclusion",
  O: "Order",
};

export type ClientSource =
  | "referral"
  | "cold_inbound"
  | "event"
  | "linkedin"
  | "warm_intro"
  | "other";

export const SOURCE_LABEL: Record<ClientSource, string> = {
  referral: "Referral",
  cold_inbound: "Cold inbound",
  event: "Event",
  linkedin: "LinkedIn",
  warm_intro: "Warm intro",
  other: "Other",
};
