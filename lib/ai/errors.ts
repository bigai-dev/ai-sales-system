import { ERR } from "@/lib/constants/copy";

/**
 * An error whose message is safe and useful to show the person using the app
 * ("Make a call plan first."). Anything else that goes wrong inside an AI
 * action is logged on the server and shown as a short generic sentence.
 */
export class KnownError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "KnownError";
  }
}

/** Turn whatever was thrown into one plain sentence for the screen. */
export function friendlyError(e: unknown, verb: string): string {
  if (e instanceof KnownError) return e.message;
  console.error(`[ai] couldn't ${verb}:`, e);
  return ERR.ai(verb);
}
