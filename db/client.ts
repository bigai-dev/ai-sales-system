import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema";

// Local development reads .env.local / .env via dotenv. On Vercel the env vars
// are injected natively, AND `dotenv` lives in devDependencies (which Vercel
// strips from production installs) — so importing it at module top-level
// would throw at runtime. The dynamic import below is gated to local only.
if (!process.env.VERCEL && typeof process.env.TURSO_DATABASE_URL === "undefined") {
  // Load .env.local first, then .env. Imported synchronously via require so
  // module init stays synchronous (drizzle/db is consumed at import time).
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { config } = require("dotenv") as typeof import("dotenv");
  config({ path: ".env.local" });
  config({ path: ".env" });
}

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url) {
  throw new Error("TURSO_DATABASE_URL is not set");
}

export const libsql = createClient({ url, authToken });
export const db = drizzle(libsql, { schema, casing: "snake_case" });
export { schema };
