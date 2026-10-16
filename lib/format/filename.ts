/** "Acme Sdn Bhd" → "Acme_Sdn_Bhd"; safe for a download name. */
export function safeSlug(name: string): string {
  return name.replace(/[^a-z0-9]+/gi, "_").replace(/^_|_$/g, "");
}

/** "proposal-Acme_Sdn_Bhd.pdf" */
export function safeFilename(name: string, prefix = "proposal", ext = "pdf"): string {
  return `${prefix}-${safeSlug(name) || "client"}.${ext}`;
}
