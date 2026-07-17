import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "../../../../src/db/schema";
import { MockPool } from "../../../../api/_lib/mock-pool";

const isProduction = process.env.NODE_ENV === "production";
const databaseUrl = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;
const hasDatabaseUrl = !!databaseUrl;

if (!hasDatabaseUrl) {
  if (isProduction) {
    throw new Error("FATAL: DATABASE_URL is mandatory in production mode. Startup aborted.");
  }
  
  // Development: do not silently activate MockPool unless ALLOW_MOCK_DB or MOCK_DATABASE is true
  const isMockExplicitlyAllowed = process.env.ALLOW_MOCK_DB === "true" || process.env.MOCK_DATABASE === "true";
  if (!isMockExplicitlyAllowed) {
    throw new Error("FATAL: DATABASE_URL is missing in development mode, and MockPool is not explicitly enabled (ALLOW_MOCK_DB or MOCK_DATABASE must be 'true').");
  }
}

let pool: any;

if (!databaseUrl) {
  console.warn("DATABASE_URL is not set. Running in DEVELOPMENT-ONLY MOCK MODE.");
  pool = new MockPool();
  (pool as any).isMock = true;
} else {
  pool = new pg.Pool({
    connectionString: databaseUrl,
    ssl: isProduction || databaseUrl.includes("neon.tech") ? { rejectUnauthorized: false } : false,
  });
  (pool as any).isMock = false;

  const isTestMode = process.env.NODE_ENV === "test" || process.env.VITEST === "true" || !!process.env.TEST_DATABASE_URL;
  if (!isTestMode) {
    pool.on("connect", (client: any) => {
      client.query("SET search_path TO public").catch((err: any) => {
        console.warn("Failed to reset search_path to public on connect:", err.message);
      });
    });
  }
}

export const drizzleDb = drizzle(pool, { schema });
export { pool };
