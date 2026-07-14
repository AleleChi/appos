import pg from "pg";
import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("Missing DATABASE_URL in environment.");
  process.exit(1);
}

const pool = new pg.Pool({
  connectionString: databaseUrl,
});

async function main() {
  const client = await pool.connect();
  try {
    console.log("Connecting to database and starting Better Auth schema creation...");

    // Create Better Auth tables if they don't exist
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

    console.log("Better Auth tables ensured.");

    // Check if legacy 'users' table exists
    const legacyTableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      ) as exists
    `);

    if (!legacyTableCheck.rows[0].exists) {
      console.log("Legacy 'users' table does not exist in this database. Skipping migration.");
      return;
    }

    console.log("Legacy 'users' table found. Starting legacy user migration...");

    const legacyUsers = await client.query("SELECT * FROM users");
    const totalDiscovered = legacyUsers.rows.length;

    let migratedCount = 0;
    let skippedCount = 0;
    let credentialMigratedCount = 0;
    let conflictsCount = 0;

    for (const row of legacyUsers.rows) {
      const email = row.email ? row.email.toLowerCase().trim() : "";
      if (!email) {
        skippedCount++;
        continue;
      }

      await client.query("BEGIN");
      try {
        // 1. Check if user already exists
        const existsUser = await client.query('SELECT id FROM "user" WHERE email = $1', [email]);
        let userId = "";

        if (existsUser.rows.length > 0) {
          userId = existsUser.rows[0].id;
          skippedCount++;
        } else {
          // 2. Determine verified status
          const emailVerified = Boolean(row.email_verified_at || row.email_verified);
          
          userId = row.id || crypto.randomUUID();
          const name = row.name || email.split("@")[0] || "User";
          const image = row.profile_image || null;
          const createdAt = row.created_at ? new Date(row.created_at) : new Date();
          const updatedAt = row.updated_at ? new Date(row.updated_at) : new Date();

          // 3. Insert into "user"
          await client.query(`
            INSERT INTO "user" (id, name, email, "emailVerified", image, "createdAt", "updatedAt")
            VALUES ($1, $2, $3, $4, $5, $6, $7)
          `, [userId, name, email, emailVerified, image, createdAt, updatedAt]);

          migratedCount++;
        }

        // 4. Migrate credential if password hash exists and account doesn't exist
        if (row.password_hash) {
          const existsAccount = await client.query(
            'SELECT id FROM "account" WHERE "userId" = $1 AND "providerId" = $2',
            [userId, "credential"]
          );

          if (existsAccount.rows.length === 0) {
            const createdAt = row.created_at ? new Date(row.created_at) : new Date();
            const updatedAt = row.updated_at ? new Date(row.updated_at) : new Date();

            await client.query(`
              INSERT INTO "account" (
                id, "accountId", "providerId", "userId", password, "createdAt", "updatedAt"
              )
              VALUES ($1, $2, $3, $4, $5, $6, $7)
            `, [
              crypto.randomUUID(),
              userId, // accountId = user ID as per step 8
              "credential", // providerId = credential as per step 8
              userId,
              row.password_hash,
              createdAt,
              updatedAt
            ]);

            credentialMigratedCount++;
          }
        }

        await client.query("COMMIT");
      } catch (err) {
        await client.query("ROLLBACK");
        console.error(`Failed to migrate user ${email}:`, err);
        conflictsCount++;
      }
    }

    console.log("\n================ MIGRATION REPORT ================");
    console.log(`users discovered:             ${totalDiscovered}`);
    console.log(`users migrated:               ${migratedCount}`);
    console.log(`users skipped:                ${skippedCount}`);
    console.log(`credential accounts migrated: ${credentialMigratedCount}`);
    console.log(`conflicts requiring review:   ${conflictsCount}`);
    console.log("==================================================\n");

  } catch (error) {
    console.error("Migration fatal error:", error);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
