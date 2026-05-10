// Strip likely PII from prompts before sending to a hosted model.
// DeepSeek's hosted endpoints are not zero-retention — assume training-eligible.
//
// What this catches: email, phone, Malaysian IC, credit card, IPv4. What it
// does NOT catch: human names, company names, addresses. Those are sent
// through deliberately so the AI can produce useful output ("Jane is your
// champion at Acme") — accept the trade-off or build NER-based redaction.

const EMAIL = /[\w.+-]+@[\w-]+\.[\w.-]+/g;
const PHONE = /(?:\+?\d{1,3}[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/g;

// Malaysian IC: YYMMDD-PB-####. Hyphens optional. 12 digits total.
const MY_IC = /\b\d{6}[\s-]?\d{2}[\s-]?\d{4}\b/g;

// Credit card: 13–19 digits, possibly grouped by space/dash. Loose but
// effective — Luhn check is overkill for outbound prompts.
const CREDIT_CARD = /\b(?:\d[ -]?){13,19}\b/g;

// IPv4 — sometimes leaks in pasted error logs.
const IPV4 = /\b(?:\d{1,3}\.){3}\d{1,3}\b/g;

export function scrub(input: string): string {
  return input
    .replace(EMAIL, "[email]")
    // Phone before IC/CC because the broader phone regex would otherwise
    // shadow them. Order matters here.
    .replace(PHONE, "[phone]")
    .replace(MY_IC, "[ic]")
    .replace(CREDIT_CARD, "[card]")
    .replace(IPV4, "[ip]");
}

export function scrubObject<T>(obj: T): T {
  if (typeof obj === "string") return scrub(obj) as unknown as T;
  if (Array.isArray(obj)) return obj.map((v) => scrubObject(v)) as unknown as T;
  if (obj && typeof obj === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      out[k] = scrubObject(v);
    }
    return out as unknown as T;
  }
  return obj;
}
