import { z } from "zod";

export const emailDraftSchema = z.object({
  subject: z
    .string()
    .min(8)
    .max(120)
    .describe(
      "Concise email subject. Reference the workshop and the prospect's company.",
    ),
  body: z
    .string()
    .min(120)
    .max(2000)
    .describe(
      "Email body in plain text (no HTML, no markdown). Open with a thank-you for the call, " +
        "reference 1-2 specific things the prospect said (use their words where natural), " +
        "restate the next step with timing, and end with a clear ask. " +
        "Use British/Malaysian English. No 'Hope this finds you well' openers. No marketing fluff.",
    ),
  attachmentNote: z
    .string()
    .min(0)
    .max(160)
    .describe(
      "If a proposal PDF should be attached, a one-line note describing it " +
        "(e.g. 'Workshop proposal — 18 pax · RM 68,040 incl. SST'). " +
        "Empty string if no proposal exists for this client.",
    )
    .default(""),
});

export type EmailDraft = z.infer<typeof emailDraftSchema>;
