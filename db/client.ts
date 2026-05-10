import { config } from "dotenv";
import { drizzle } from "drizzle-orm/libsql";

config({ path: ".env.local" });
config({ path: ".env" });
import { createClient } from "@libsql/client";
import * as schema from "./schema";

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url) {
  throw new Error("TURSO_DATABASE_URL is not set");
}

export const libsql = createClient({ url, authToken });
export const db = drizzle(libsql, { schema, casing: "snake_case" });
export { schema };
