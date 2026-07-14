import pg from "pg";
import crypto from "crypto";

// Create a direct PG pool for migration to avoid lifecycle dependency cycles
const getPool = () => {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.warn("[DbInit] DATABASE_URL is not set. Database initialization skipped.");
    return null;
  }
  return new pg.Pool({
    connectionString,
    ssl: connectionString.includes("neon.tech") ? { rejectUnauthorized: false } : false,
    max: 2,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 30000,
  });
};

export async function ensureAuthSchema() {
  const pool = getPool();
  if (!pool) return;

  let client;
  try {
    client = await pool.connect();
    console.log("[DbInit] Verifying Better Auth schema in Neon PostgreSQL...");

    // 1. Create Better Auth tables in lowercase, quoting "user" as it is a reserved PG keyword
    await client.query(`
      CREATE TABLE IF NOT EXISTS "user" (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        "emailVerified" BOOLEAN NOT NULL DEFAULT FALSE,
        image TEXT,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS "session" (
        id VARCHAR(255) PRIMARY KEY,
        "expiresAt" TIMESTAMP NOT NULL,
        token VARCHAR(255) NOT NULL UNIQUE,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "ipAddress" VARCHAR(255),
        "userAgent" TEXT,
        "userId" VARCHAR(255) NOT NULL REFERENCES "user"(id) ON DELETE CASCADE
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS "account" (
        id VARCHAR(255) PRIMARY KEY,
        "accountId" VARCHAR(255) NOT NULL,
        "providerId" VARCHAR(255) NOT NULL,
        "userId" VARCHAR(255) NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
        "accessToken" TEXT,
        "refreshToken" TEXT,
        "idToken" TEXT,
        "accessTokenExpiresAt" TIMESTAMP,
        "refreshTokenExpiresAt" TIMESTAMP,
        scope TEXT,
        password TEXT,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS "verification" (
        id VARCHAR(255) PRIMARY KEY,
        identifier VARCHAR(255) NOT NULL,
        value VARCHAR(255) NOT NULL,
        "expiresAt" TIMESTAMP NOT NULL,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log("[DbInit] Better Auth tables ensured successfully.");

    // 2. Perform Migration from legacy "users" (plural) to "user" and "account" (Better Auth tables)
    try {
      const hasLegacyUsersTable = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'users'
        ) as exists
      `);

      if (hasLegacyUsersTable.rows[0].exists) {
        console.log("[DbInit] Legacy 'users' table detected. Migrating records...");
        
        const legacyUsers = await client.query("SELECT * FROM users");
        console.log(`[DbInit] Found ${legacyUsers.rows.length} legacy users for potential migration.`);

        for (const row of legacyUsers.rows) {
          const email = row.email.toLowerCase().trim();
          
          // Check if this user email already exists in Better Auth's "user"
          const existsBA = await client.query('SELECT id FROM "user" WHERE email = $1', [email]);
          if (existsBA.rows.length === 0) {
            console.log(`[DbInit] Migrating legacy user: ${email}`);
            
            const userId = row.id || crypto.randomUUID();
            const name = row.name || email.split("@")[0] || "User";
            const emailVerified = row.email_verified || false;
            const image = row.profile_image || null;
            const createdAt = row.created_at ? new Date(row.created_at) : new Date();
            const updatedAt = row.updated_at ? new Date(row.updated_at) : new Date();

            // Insert into "user"
            await client.query(`
              INSERT INTO "user" (id, name, email, "emailVerified", image, "createdAt", "updatedAt")
              VALUES ($1, $2, $3, $4, $5, $6, $7)
              ON CONFLICT (id) DO NOTHING
            `, [userId, name, email, emailVerified, image, createdAt, updatedAt]);

            // Migrate password credentials into "account" table if password hash exists
            if (row.password_hash) {
              const accountId = userId; // In Better Auth, accountId for credentials is safe to be user's ID
              const accountIdString = row.id || crypto.randomUUID();
              await client.query(`
                INSERT INTO "account" (
                  id, "accountId", "providerId", "userId", password, "createdAt", "updatedAt"
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                ON CONFLICT DO NOTHING
              `, [
                crypto.randomUUID(), 
                accountIdString, 
                "email", 
                userId, 
                row.password_hash, 
                createdAt, 
                updatedAt
              ]);
            }
          }
        }
        console.log("[DbInit] Migration of legacy users completed safely.");
      }
    } catch (migErr) {
      console.error("[DbInit] Error during legacy data migration:", migErr);
    }

  } catch (err) {
    console.error("[DbInit] Fatal error initializing Better Auth schema:", err);
  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
  }
}
