import fs from "fs";
import path from "path";
import crypto from "crypto";
import pg from "pg";

/**
 * AppOS Secure Production-Ready Relational Database Layer
 * Implements a unified interface for file-backed persistent database (JSON) 
 * and production cloud-hosted PostgreSQL database (Neon).
 * Detects DATABASE_URL and switches dynamically with zero-code reconfiguration.
 */

export interface User {
  id: string;
  email: string;
  password_hash: string | null;
  provider: string | null;
  provider_id: string | null;
  provider_email?: string | null;
  email_verified?: boolean | null;
  email_verified_at: string | null;
  created_at: string;
  updated_at: string;
  last_login_at: string | null;
  name?: string | null;
  profile_image?: string | null;
  email_verification_pending?: boolean | null;
}

export interface VerificationToken {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: string;
  used: boolean;
}

export interface PasswordResetToken {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: string;
  used: boolean;
}

export interface AuditLog {
  id: string;
  event_type: string;
  email: string | null;
  ip_address: string;
  details: string;
  created_at: string;
}

export interface Workspace {
  id: string;
  owner_id: string;
  name: string;
  industry: string | null;
  created_at: string;
  updated_at: string;
}

export interface WorkspaceMember {
  id: string;
  workspace_id: string;
  user_id: string;
  role: string;
  created_at: string;
  updated_at: string;
}

export interface Application {
  id: string;
  workspace_id: string;
  name: string;
  website_url: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Asset {
  id: string;
  application_id: string;
  cloudinary_url: string;
  asset_type: string;
  created_at: string;
}

export interface AuthHandoffCode {
  id: string;
  code_hash: string;
  user_id: string;
  purpose: string;
  expires_at: string;
  used_at: string | null;
  created_at: string;
  request_id: string;
}

export interface Session {
  id: string;
  user_id: string;
  expires_at: string;
  created_at: string;
}

export interface OAuthTransaction {
  id: string;
  state_hash: string;
  created_at: string;
  expires_at: string;
  consumed_at: string | null;
  callback_started_at: string | null;
  token_exchange_completed_at: string | null;
}

interface DatabaseSchema {
  users: User[];
  verification_tokens: VerificationToken[];
  password_reset_tokens: PasswordResetToken[];
  audit_logs: AuditLog[];
  workspaces: Workspace[];
  workspace_members: WorkspaceMember[];
  applications: Application[];
  assets: Asset[];
  auth_handoff_codes?: AuthHandoffCode[];
  sessions?: Session[];
  oauth_transactions?: OAuthTransaction[];
}

const DB_FILE_PATH = path.join(process.cwd(), "app_database.json");

export class Database {
  private data: DatabaseSchema = {
    users: [],
    verification_tokens: [],
    password_reset_tokens: [],
    audit_logs: [],
    workspaces: [],
    workspace_members: [],
    applications: [],
    assets: [],
    auth_handoff_codes: [],
    sessions: [],
    oauth_transactions: []
  };

  private pgPool: pg.Pool | null = null;
  private isPostgresActive = false;

  constructor() {
    const dbUrl = process.env.DATABASE_URL;
    const isProduction = process.env.NODE_ENV === "production";

    console.log(`DATABASE_ENVIRONMENT=${process.env.NODE_ENV || "development"}`);

    if (isProduction && !dbUrl) {
      console.error("DATABASE_CONFIG_PRESENT=false");
      console.error("DATABASE_DRIVER=none");
      console.error("DATABASE_POOL_INITIALIZED=false");
      console.error("Database initialization failed: DATABASE_URL is missing in production environment!");
      throw new Error("Missing DATABASE_URL in production environment.");
    }

    if (dbUrl) {
      console.log("DATABASE_CONFIG_PRESENT=true");
      console.log("DATABASE_DRIVER=pg");
      
      let host = "unknown";
      let dbName = "unknown";
      try {
        const match = dbUrl.match(/@([^/?:#]+)(?:\/([^?#]+))?/);
        if (match) {
          host = match[1] || "unknown";
          dbName = match[2]?.split("?")[0] || "unknown";
        }
      } catch (_) {}

      const hostParts = host.split(".");
      const redactedHost = hostParts.length > 2 
        ? `***.${hostParts.slice(-2).join(".")}`
        : host;

      console.log(`DATABASE_HOST=${redactedHost}`);
      console.log(`DATABASE_NAME=${dbName}`);
      
      const isNeon = dbUrl.includes("neon.tech");
      const sslEnabled = isNeon || isProduction;
      console.log(`DATABASE_SSL_ENABLED=${sslEnabled}`);

      try {
        this.pgPool = new pg.Pool({
          connectionString: dbUrl,
          ssl: sslEnabled ? { rejectUnauthorized: false } : false,
          max: 10,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 30000,
        });
        this.isPostgresActive = true;
        console.log("DATABASE_POOL_INITIALIZED=true");
        this.bootstrapPostgres();
      } catch (err) {
        console.error("Database: Failed to initialize PG pool:", err);
        console.error("DATABASE_POOL_INITIALIZED=false");
        if (isProduction) {
          throw new Error(`Database connection failed: ${err instanceof Error ? err.message : String(err)}`);
        }
        this.isPostgresActive = false;
        this.loadJson();
      }
    } else {
      console.log("DATABASE_CONFIG_PRESENT=false");
      console.log("DATABASE_DRIVER=none");
      console.log("DATABASE_POOL_INITIALIZED=false");
      console.log("Database: No DATABASE_URL specified. Running with JSON fallback database.");
      this.loadJson();
    }
  }

  /**
   * Bootstraps PostgreSQL tables on startup to guarantee database readiness
   */
  private async bootstrapPostgres() {
    console.log(`DATABASE_URL_CONFIGURED=${!!process.env.DATABASE_URL}`);
    console.log(`DATABASE_POOL_CREATED=${!!this.pgPool}`);
    if (!this.pgPool) {
      console.log("DATABASE_CONNECTION_TEST=false");
      console.log("DATABASE_USERS_TABLE_EXISTS=false");
      return;
    }
    try {
      const client = await this.pgPool.connect();
      console.log("DATABASE_CONNECTION_TEST=true");
      
      const originalQuery = client.query.bind(client);
      client.query = (async function(queryText: any, values: any) {
        try {
          return await originalQuery(queryText, values);
        } catch (err: any) {
          console.error("BOOTSTRAP SQL FAILED:", queryText);
          throw err;
        }
      } as any);

      try {
        const dbMetadata = await client.query("SELECT current_database() as db_name, current_schema() as db_schema");
        console.log(`DATABASE_NAME=${dbMetadata.rows[0].db_name}`);
        console.log(`DATABASE_SCHEMA=${dbMetadata.rows[0].db_schema}`);
      } catch (metaErr) {
        console.warn("Failed to retrieve DB metadata:", metaErr);
      }
      try {
        await client.query(`
          CREATE TABLE IF NOT EXISTS users (
            id VARCHAR(255) PRIMARY KEY,
            email VARCHAR(255) UNIQUE NOT NULL,
            normalized_email VARCHAR(255) UNIQUE,
            password_hash VARCHAR(255),
            provider VARCHAR(50) DEFAULT 'email',
            auth_provider VARCHAR(50) DEFAULT 'email',
            provider_id VARCHAR(255),
            provider_email VARCHAR(255),
            email_verified BOOLEAN DEFAULT FALSE,
            email_verified_at VARCHAR(255),
            status VARCHAR(50) DEFAULT 'active',
            created_at VARCHAR(255) NOT NULL,
            updated_at VARCHAR(255) NOT NULL,
            last_login_at VARCHAR(255),
            name VARCHAR(255),
            profile_image TEXT
          );
        `);
        try {
          await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS provider VARCHAR(50) DEFAULT 'email';`);
          await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(50) DEFAULT 'email';`);
          await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS provider_id VARCHAR(255);`);
          await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS provider_email VARCHAR(255);`);
          await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;`);
          await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified_at VARCHAR(255);`);
          await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS normalized_email VARCHAR(255);`);
          await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active';`);
          await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS name VARCHAR(255);`);
          await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_image TEXT;`);
          await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at VARCHAR(255);`);
          await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);`);
          await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verification_pending BOOLEAN DEFAULT FALSE;`);
          await client.query(`ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;`);

          // Backfill data for existing columns to maintain consistency
          await client.query(`UPDATE users SET normalized_email = LOWER(email) WHERE normalized_email IS NULL;`);
          await client.query(`UPDATE users SET auth_provider = provider WHERE auth_provider IS NULL AND provider IS NOT NULL;`);
          await client.query(`UPDATE users SET status = 'active' WHERE status IS NULL;`);

          // Create index and constraints
          await client.query(`CREATE UNIQUE INDEX IF NOT EXISTS idx_users_normalized_email ON users (normalized_email);`);
          await client.query(`CREATE UNIQUE INDEX IF NOT EXISTS idx_users_auth_provider_provider_id ON users (auth_provider, provider_id) WHERE provider_id IS NOT NULL;`);
          await client.query(`CREATE UNIQUE INDEX IF NOT EXISTS idx_users_provider_provider_id ON users (provider, provider_id) WHERE provider_id IS NOT NULL;`);
          await client.query(`CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);`);
        } catch (alterErr) {
          console.warn("Database: Column/Index addition warning (may already exist):", alterErr);
        }
        await client.query(`
          CREATE TABLE IF NOT EXISTS workspaces (
            id VARCHAR(255) PRIMARY KEY,
            owner_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            name VARCHAR(255) NOT NULL,
            industry VARCHAR(255),
            created_at VARCHAR(255) NOT NULL,
            updated_at VARCHAR(255) NOT NULL
          );
        `);
        await client.query(`
          CREATE TABLE IF NOT EXISTS workspace_members (
            id VARCHAR(255) PRIMARY KEY,
            workspace_id VARCHAR(255) NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
            user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            role VARCHAR(50) NOT NULL DEFAULT 'member',
            created_at VARCHAR(255) NOT NULL,
            updated_at VARCHAR(255) NOT NULL,
            UNIQUE(workspace_id, user_id)
          );
        `);
        await client.query(`
          CREATE TABLE IF NOT EXISTS applications (
            id VARCHAR(255) PRIMARY KEY,
            workspace_id VARCHAR(255) NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
            name VARCHAR(255) NOT NULL,
            website_url TEXT NOT NULL,
            status VARCHAR(50) NOT NULL DEFAULT 'pending',
            created_at VARCHAR(255) NOT NULL,
            updated_at VARCHAR(255) NOT NULL
          );
        `);
        await client.query(`
          CREATE TABLE IF NOT EXISTS assets (
            id VARCHAR(255) PRIMARY KEY,
            application_id VARCHAR(255) NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
            cloudinary_url TEXT NOT NULL,
            asset_type VARCHAR(100) NOT NULL,
            created_at VARCHAR(255) NOT NULL
          );
        `);
        await client.query(`
          CREATE TABLE IF NOT EXISTS verification_tokens (
            id VARCHAR(255) PRIMARY KEY,
            user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            token_hash VARCHAR(255) NOT NULL,
            expires_at VARCHAR(255) NOT NULL,
            used BOOLEAN DEFAULT FALSE,
            created_at VARCHAR(255) NOT NULL DEFAULT CURRENT_TIMESTAMP
          );
        `);
        await client.query(`
          CREATE TABLE IF NOT EXISTS password_reset_tokens (
            id VARCHAR(255) PRIMARY KEY,
            user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            token_hash VARCHAR(255) NOT NULL,
            expires_at VARCHAR(255) NOT NULL,
            used BOOLEAN DEFAULT FALSE,
            created_at VARCHAR(255) NOT NULL DEFAULT CURRENT_TIMESTAMP
          );
        `);
        await client.query(`
          CREATE TABLE IF NOT EXISTS audit_logs (
            id VARCHAR(255) PRIMARY KEY,
            event_type VARCHAR(100) NOT NULL,
            email VARCHAR(255),
            ip_address VARCHAR(100) NOT NULL,
            details TEXT NOT NULL,
            created_at VARCHAR(255) NOT NULL
          );
        `);
        await client.query(`
          CREATE TABLE IF NOT EXISTS auth_handoff_codes (
            id VARCHAR(255) PRIMARY KEY,
            code_hash VARCHAR(255) NOT NULL,
            user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            purpose VARCHAR(50) NOT NULL,
            expires_at VARCHAR(50) NOT NULL,
            used_at VARCHAR(50),
            created_at VARCHAR(50) NOT NULL,
            request_id VARCHAR(255) NOT NULL
          );
        `);
        await client.query(`
          CREATE INDEX IF NOT EXISTS idx_auth_handoff_codes_code_hash ON auth_handoff_codes (code_hash);
        `);
        await client.query(`
          CREATE TABLE IF NOT EXISTS sessions (
            id VARCHAR(255) PRIMARY KEY,
            user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            expires_at VARCHAR(50) NOT NULL,
            created_at VARCHAR(50) NOT NULL
          );
        `);
        await client.query(`
          CREATE TABLE IF NOT EXISTS oauth_transactions (
            id VARCHAR(255) PRIMARY KEY,
            state_hash VARCHAR(255) UNIQUE NOT NULL,
            created_at VARCHAR(50) NOT NULL,
            expires_at VARCHAR(50) NOT NULL,
            consumed_at VARCHAR(50),
            callback_started_at VARCHAR(50),
            token_exchange_completed_at VARCHAR(50)
          );
        `);
        await client.query(`
          CREATE INDEX IF NOT EXISTS idx_oauth_transactions_state_hash ON oauth_transactions (state_hash);
        `);
        console.log("Database: PostgreSQL tables checked and bootstrapped successfully.");
        try {
          const checkUsersRes = await client.query(
            "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') as exists"
          );
          console.log(`DATABASE_USERS_TABLE_EXISTS=${checkUsersRes.rows[0].exists}`);
        } catch (checkErr) {
          console.warn("Failed to check if users table exists:", checkErr);
          console.log("DATABASE_USERS_TABLE_EXISTS=false");
        }
      } finally {
        client.release();
      }
    } catch (err) {
      console.error("Database: Failed to bootstrap PostgreSQL tables:", err);
      console.log("Database: Falling back to local JSON database storage (app_database.json).");
      this.isPostgresActive = false;
      this.loadJson();
    }
  }

  /**
   * Loads database from local disk (JSON fallback mode)
   */
  private loadJson() {
    try {
      if (fs.existsSync(DB_FILE_PATH)) {
        const raw = fs.readFileSync(DB_FILE_PATH, "utf-8");
        this.data = JSON.parse(raw);
        // Ensure all required collections exist
        if (!this.data.users) this.data.users = [];
        if (!this.data.verification_tokens) this.data.verification_tokens = [];
        if (!this.data.audit_logs) this.data.audit_logs = [];
        if (!this.data.workspaces) this.data.workspaces = [];
        if (!this.data.workspace_members) this.data.workspace_members = [];
        if (!this.data.applications) this.data.applications = [];
        if (!this.data.assets) this.data.assets = [];
        if (!this.data.sessions) this.data.sessions = [];
        if (!this.data.oauth_transactions) this.data.oauth_transactions = [];
      } else {
        this.saveJson();
      }
    } catch (err) {
      console.error("Database fallback initialization failed, using in-memory model:", err);
    }
  }

  /**
   * Persists database state to disk (JSON fallback mode)
   */
  private saveJson() {
    if (this.isPostgresActive) return;
    try {
      const tempPath = `${DB_FILE_PATH}.tmp`;
      fs.writeFileSync(tempPath, JSON.stringify(this.data, null, 2), "utf-8");
      fs.renameSync(tempPath, DB_FILE_PATH);
    } catch (err) {
      console.error("Database fallback failed to persist state:", err);
    }
  }

  /**
   * Translates common '?' parameters to PostgreSQL '$1, $2, $3...' parameters
   */
  private translateSql(sql: string): string {
    let index = 1;
    return sql.replace(/\?/g, () => `$${index++}`);
  }

  /**
   * Standardized query method (supports both Sync JSON and Async Promise)
   */
  public query<T = any>(sql: string, params: any[] = []): any {
    if (this.isPostgresActive && this.pgPool) {
      const translatedSql = this.translateSql(sql);
      return this.pgPool.query(translatedSql, params).then(res => res.rows);
    }

    // JSON fallback synchronous implementation
    const normalizedSql = sql.trim().replace(/\s+/g, " ").toLowerCase();

    // 1. SELECT FROM USERS
    if (normalizedSql.startsWith("select * from users")) {
      if (normalizedSql.includes("where email = ?") || normalizedSql.includes("where email = $1")) {
        const emailParam = String(params[0]).toLowerCase().trim();
        const found = this.data.users.filter(u => u.email === emailParam);
        return found as unknown as T[];
      }
      if (normalizedSql.includes("where id = ?") || normalizedSql.includes("where id = $1")) {
        const idParam = String(params[0]);
        const found = this.data.users.filter(u => u.id === idParam);
        return found as unknown as T[];
      }
      if (normalizedSql.includes("where provider_id = ?") || normalizedSql.includes("where provider_id = $1")) {
        const provId = String(params[0]);
        const found = this.data.users.filter(u => u.provider_id === provId);
        return found as unknown as T[];
      }
      return this.data.users as unknown as T[];
    }

    // 2. SELECT FROM VERIFICATION TOKENS
    if (normalizedSql.startsWith("select * from verification_tokens")) {
      if (normalizedSql.includes("where token_hash = ?") || normalizedSql.includes("where token_hash = $1")) {
        const hashParam = String(params[0]);
        const found = this.data.verification_tokens.filter(t => t.token_hash === hashParam && !t.used);
        return found as unknown as T[];
      }
      return this.data.verification_tokens as unknown as T[];
    }

    // 2b. SELECT FROM PASSWORD_RESET_TOKENS
    if (normalizedSql.startsWith("select * from password_reset_tokens")) {
      if (normalizedSql.includes("where token_hash = ?") || normalizedSql.includes("where token_hash = $1")) {
        const hashParam = String(params[0]);
        const found = this.data.password_reset_tokens.filter(t => t.token_hash === hashParam && !t.used);
        return found as unknown as T[];
      }
      return this.data.password_reset_tokens as unknown as T[];
    }

    // 3. SELECT FROM AUDIT LOGS
    if (normalizedSql.startsWith("select * from audit_logs")) {
      return this.data.audit_logs as unknown as T[];
    }

    // 4. SELECT FROM WORKSPACES
    if (normalizedSql.startsWith("select * from workspaces")) {
      if (normalizedSql.includes("where owner_id = ?") || normalizedSql.includes("where owner_id = $1")) {
        const ownerId = String(params[0]);
        const found = this.data.workspaces.filter(w => w.owner_id === ownerId);
        return found as unknown as T[];
      }
      if (normalizedSql.includes("where id = ?") || normalizedSql.includes("where id = $1")) {
        const id = String(params[0]);
        const found = this.data.workspaces.filter(w => w.id === id);
        return found as unknown as T[];
      }
      return this.data.workspaces as unknown as T[];
    }

    // 5. SELECT FROM APPLICATIONS
    if (normalizedSql.startsWith("select * from applications")) {
      if (normalizedSql.includes("where workspace_id = ?") || normalizedSql.includes("where workspace_id = $1")) {
        const wsId = String(params[0]);
        const found = this.data.applications.filter(a => a.workspace_id === wsId);
        return found as unknown as T[];
      }
      if (normalizedSql.includes("where id = ?") || normalizedSql.includes("where id = $1")) {
        const id = String(params[0]);
        const found = this.data.applications.filter(a => a.id === id);
        return found as unknown as T[];
      }
      return this.data.applications as unknown as T[];
    }

    // 6. SELECT FROM ASSETS
    if (normalizedSql.startsWith("select * from assets")) {
      if (normalizedSql.includes("where application_id = ?") || normalizedSql.includes("where application_id = $1")) {
        const appId = String(params[0]);
        const found = this.data.assets.filter(a => a.application_id === appId);
        return found as unknown as T[];
      }
      return this.data.assets as unknown as T[];
    }

    // 7. SELECT FROM AUTH_HANDOFF_CODES
    if (normalizedSql.startsWith("select * from auth_handoff_codes")) {
      if (normalizedSql.includes("where code_hash = ?") || normalizedSql.includes("where code_hash = $1")) {
        const hashParam = String(params[0]);
        const found = (this.data.auth_handoff_codes || []).filter(c => c.code_hash === hashParam);
        return found as unknown as T[];
      }
      return (this.data.auth_handoff_codes || []) as unknown as T[];
    }

    if (normalizedSql.startsWith("select * from sessions")) {
      if (normalizedSql.includes("where id = ?") || normalizedSql.includes("where id = $1")) {
        const idParam = String(params[0]);
        const found = (this.data.sessions || []).filter(s => s.id === idParam);
        return found as unknown as T[];
      }
      return (this.data.sessions || []) as unknown as T[];
    }

    if (normalizedSql.startsWith("select * from oauth_transactions")) {
      if (normalizedSql.includes("where state_hash = ?") || normalizedSql.includes("where state_hash = $1")) {
        const hashParam = String(params[0]);
        const found = (this.data.oauth_transactions || []).filter(t => t.state_hash === hashParam);
        return found as unknown as T[];
      }
      return (this.data.oauth_transactions || []) as unknown as T[];
    }

    if (normalizedSql.startsWith("update oauth_transactions")) {
      if (normalizedSql.includes("set callback_started_at = ?") || normalizedSql.includes("set callback_started_at = $1")) {
        const [callbackStartedAt, stateHash, expiresAtLimit] = params;
        const tx = (this.data.oauth_transactions || []).find(
          t => t.state_hash === stateHash && t.callback_started_at === null && t.expires_at > expiresAtLimit
        );
        if (tx) {
          tx.callback_started_at = callbackStartedAt;
          this.saveJson();
          return [{ id: tx.id }] as unknown as T[];
        }
        return [] as unknown as T[];
      }
      if (normalizedSql.includes("set token_exchange_completed_at = ?") || normalizedSql.includes("set token_exchange_completed_at = $1")) {
        const [tokenExchangeCompletedAt, consumedAt, stateHash] = params;
        const tx = (this.data.oauth_transactions || []).find(t => t.state_hash === stateHash);
        if (tx) {
          tx.token_exchange_completed_at = tokenExchangeCompletedAt;
          tx.consumed_at = consumedAt;
          this.saveJson();
          return [{ id: tx.id }] as unknown as T[];
        }
        return [] as unknown as T[];
      }
    }

    return [];
  }

  /**
   * Standardized execute/write method (supports both Sync JSON and Async Promise)
   */
  public execute(sql: string, params: any[] = []): any {
    if (this.isPostgresActive && this.pgPool) {
      const translatedSql = this.translateSql(sql);
      return this.pgPool.query(translatedSql, params).then(() => {});
    }

    // JSON fallback synchronous implementation
    const normalizedSql = sql.trim().replace(/\s+/g, " ").toLowerCase();

    // 1. INSERT INTO USERS
    if (normalizedSql.startsWith("insert into users")) {
      const email = params[1];
      const emailLower = String(email).toLowerCase().trim();
      const exists = this.data.users.some(u => u.email === emailLower);
      if (exists) {
        throw new Error("UNIQUE constraint failed: users.email");
      }

      let newUser: User;
      if (params.length === 13) {
        const [id, emailVal, password_hash, provider, provider_id, provider_email, email_verified, email_verified_at, created_at, updated_at, last_login_at, name, profile_image] = params;
        newUser = {
          id: String(id),
          email: emailLower,
          password_hash: password_hash ? String(password_hash) : null,
          provider: provider ? String(provider) : "email",
          provider_id: provider_id ? String(provider_id) : null,
          provider_email: provider_email ? String(provider_email) : null,
          email_verified: email_verified !== undefined ? !!email_verified : null,
          email_verified_at: email_verified_at || null,
          created_at: String(created_at),
          updated_at: String(updated_at),
          last_login_at: last_login_at || null,
          name: name ? String(name) : null,
          profile_image: profile_image ? String(profile_image) : null
        };
      } else if (params.length === 11) {
        const [id, emailVal, password_hash, provider, provider_id, email_verified_at, created_at, updated_at, last_login_at, name, profile_image] = params;
        newUser = {
          id: String(id),
          email: emailLower,
          password_hash: password_hash ? String(password_hash) : null,
          provider: provider ? String(provider) : "email",
          provider_id: provider_id ? String(provider_id) : null,
          email_verified_at: email_verified_at || null,
          created_at: String(created_at),
          updated_at: String(updated_at),
          last_login_at: last_login_at || null,
          name: name ? String(name) : null,
          profile_image: profile_image ? String(profile_image) : null
        };
      } else if (params.length === 9) {
        const [id, emailVal, password_hash, provider, provider_id, email_verified_at, created_at, updated_at, last_login_at] = params;
        newUser = {
          id: String(id),
          email: emailLower,
          password_hash: password_hash ? String(password_hash) : null,
          provider: provider ? String(provider) : "email",
          provider_id: provider_id ? String(provider_id) : null,
          email_verified_at: email_verified_at || null,
          created_at: String(created_at),
          updated_at: String(updated_at),
          last_login_at: last_login_at || null,
          name: null,
          profile_image: null
        };
      } else {
        const [id, emailVal, password_hash, email_verified_at, created_at, updated_at, last_login_at] = params;
        newUser = {
          id: String(id),
          email: emailLower,
          password_hash: password_hash ? String(password_hash) : null,
          provider: "email",
          provider_id: null,
          email_verified_at: email_verified_at || null,
          created_at: String(created_at),
          updated_at: String(updated_at),
          last_login_at: last_login_at || null,
          name: null,
          profile_image: null
        };
      }

      this.data.users.push(newUser);
      this.saveJson();
      return;
    }

    // 2. UPDATE USERS
    if (normalizedSql.startsWith("update users")) {
      if (normalizedSql.includes("set email_verified_at = ?") && normalizedSql.includes("where id = ?")) {
        const [emailVerifiedAt, id] = params;
        const user = this.data.users.find(u => u.id === id);
        if (user) {
          user.email_verified_at = emailVerifiedAt;
          user.updated_at = new Date().toISOString();
          this.saveJson();
        }
        return;
      }
      if (normalizedSql.includes("set last_login_at = ?") && normalizedSql.includes("where id = ?")) {
        const [lastLoginAt, id] = params;
        const user = this.data.users.find(u => u.id === id);
        if (user) {
          user.last_login_at = lastLoginAt;
          user.updated_at = new Date().toISOString();
          this.saveJson();
        }
        return;
      }
      if (normalizedSql.includes("set password_hash = ?") && normalizedSql.includes("where id = ?")) {
        const [passwordHash, id] = params;
        const user = this.data.users.find(u => u.id === id);
        if (user) {
          user.password_hash = passwordHash;
          user.updated_at = new Date().toISOString();
          this.saveJson();
        }
        return;
      }
      if (normalizedSql.includes("set provider = ?") && normalizedSql.includes("where id = ?")) {
        const [provider, provider_id, id] = params;
        const user = this.data.users.find(u => u.id === id);
        if (user) {
          user.provider = provider;
          user.provider_id = provider_id;
          user.updated_at = new Date().toISOString();
          this.saveJson();
        }
        return;
      }
    }

    // 3. INSERT INTO VERIFICATION_TOKENS
    if (normalizedSql.startsWith("insert into verification_tokens")) {
      const [id, user_id, token_hash, expires_at, used] = params;
      const newToken: VerificationToken = {
        id: String(id),
        user_id: String(user_id),
        token_hash: String(token_hash),
        expires_at: String(expires_at),
        used: !!used
      };
      this.data.verification_tokens.push(newToken);
      this.saveJson();
      return;
    }

    // 4. UPDATE VERIFICATION_TOKENS
    if (normalizedSql.startsWith("update verification_tokens")) {
      if (normalizedSql.includes("set used = ?") && normalizedSql.includes("where id = ?")) {
        const [used, id] = params;
        const token = this.data.verification_tokens.find(t => t.id === id);
        if (token) {
          token.used = !!used;
          this.saveJson();
        }
        return;
      }
    }

    // 4b. INSERT INTO PASSWORD_RESET_TOKENS
    if (normalizedSql.startsWith("insert into password_reset_tokens")) {
      const [id, user_id, token_hash, expires_at, used] = params;
      const newToken: PasswordResetToken = {
        id: String(id),
        user_id: String(user_id),
        token_hash: String(token_hash),
        expires_at: String(expires_at),
        used: !!used
      };
      this.data.password_reset_tokens.push(newToken);
      this.saveJson();
      return;
    }

    // 4c. UPDATE PASSWORD_RESET_TOKENS
    if (normalizedSql.startsWith("update password_reset_tokens")) {
      if (normalizedSql.includes("set used = ?") && normalizedSql.includes("where id = ?")) {
        const [used, id] = params;
        const token = this.data.password_reset_tokens.find(t => t.id === id);
        if (token) {
          token.used = !!used;
          this.saveJson();
        }
        return;
      }
    }

    // 5. INSERT INTO AUDIT_LOGS
    if (normalizedSql.startsWith("insert into audit_logs")) {
      const [id, event_type, email, ip_address, details, created_at] = params;
      const newLog: AuditLog = {
        id: String(id),
        event_type,
        email: email ? String(email) : null,
        ip_address: String(ip_address),
        details: String(details),
        created_at: String(created_at)
      };
      this.data.audit_logs.push(newLog);
      this.saveJson();
      return;
    }

    // 6. INSERT INTO WORKSPACES
    if (normalizedSql.startsWith("insert into workspaces")) {
      const [id, owner_id, name, industry, created_at, updated_at] = params;
      const newWs: Workspace = {
        id: String(id),
        owner_id: String(owner_id),
        name: String(name),
        industry: industry ? String(industry) : null,
        created_at: String(created_at),
        updated_at: String(updated_at)
      };
      this.data.workspaces.push(newWs);
      this.saveJson();
      return;
    }

    // 7. INSERT INTO WORKSPACE_MEMBERS
    if (normalizedSql.startsWith("insert into workspace_members")) {
      const [id, workspace_id, user_id, role, created_at, updated_at] = params;
      const newMember: WorkspaceMember = {
        id: String(id),
        workspace_id: String(workspace_id),
        user_id: String(user_id),
        role: String(role),
        created_at: String(created_at),
        updated_at: String(updated_at)
      };
      this.data.workspace_members.push(newMember);
      this.saveJson();
      return;
    }

    // 8. INSERT INTO APPLICATIONS
    if (normalizedSql.startsWith("insert into applications")) {
      const [id, workspace_id, name, website_url, status, created_at, updated_at] = params;
      const newApp: Application = {
        id: String(id),
        workspace_id: String(workspace_id),
        name: String(name),
        website_url: String(website_url),
        status: String(status),
        created_at: String(created_at),
        updated_at: String(updated_at)
      };
      this.data.applications.push(newApp);
      this.saveJson();
      return;
    }

    // 9. INSERT INTO ASSETS
    if (normalizedSql.startsWith("insert into assets")) {
      const [id, application_id, cloudinary_url, asset_type, created_at] = params;
      const newAsset: Asset = {
        id: String(id),
        application_id: String(application_id),
        cloudinary_url: String(cloudinary_url),
        asset_type: String(asset_type),
        created_at: String(created_at)
      };
      this.data.assets.push(newAsset);
      this.saveJson();
      return;
    }

    // 10. INSERT INTO AUTH_HANDOFF_CODES
    if (normalizedSql.startsWith("insert into auth_handoff_codes")) {
      const [id, code_hash, user_id, purpose, expires_at, used_at, created_at, request_id] = params;
      const newHandoff: AuthHandoffCode = {
        id: String(id),
        code_hash: String(code_hash),
        user_id: String(user_id),
        purpose: String(purpose),
        expires_at: String(expires_at),
        used_at: used_at ? String(used_at) : null,
        created_at: String(created_at),
        request_id: String(request_id)
      };
      if (!this.data.auth_handoff_codes) this.data.auth_handoff_codes = [];
      this.data.auth_handoff_codes.push(newHandoff);
      this.saveJson();
      return;
    }

    // 11. UPDATE AUTH_HANDOFF_CODES
    if (normalizedSql.startsWith("update auth_handoff_codes")) {
      if (normalizedSql.includes("set used_at = ?") && normalizedSql.includes("where id = ?")) {
        const [used_at, id] = params;
        const codeRec = this.data.auth_handoff_codes?.find(c => c.id === id);
        if (codeRec) {
          codeRec.used_at = used_at ? String(used_at) : null;
          this.saveJson();
        }
        return;
      }
    }

    // 12. INSERT INTO SESSIONS
    if (normalizedSql.startsWith("insert into sessions")) {
      const [id, user_id, expires_at, created_at] = params;
      const newSession = {
        id: String(id),
        user_id: String(user_id),
        expires_at: String(expires_at),
        created_at: String(created_at)
      };
      if (!this.data.sessions) this.data.sessions = [];
      this.data.sessions.push(newSession);
      this.saveJson();
      return;
    }

    // 13. DELETE FROM SESSIONS
    if (normalizedSql.startsWith("delete from sessions")) {
      if (normalizedSql.includes("where id = ?") || normalizedSql.includes("where id = $1")) {
        const idParam = String(params[0]);
        if (this.data.sessions) {
          this.data.sessions = this.data.sessions.filter(s => s.id !== idParam);
          this.saveJson();
        }
      }
      return;
    }

    // 14. INSERT INTO OAUTH_TRANSACTIONS
    if (normalizedSql.startsWith("insert into oauth_transactions")) {
      const [id, state_hash, created_at, expires_at] = params;
      const newTx = {
        id: String(id),
        state_hash: String(state_hash),
        created_at: String(created_at),
        expires_at: String(expires_at),
        consumed_at: null,
        callback_started_at: null,
        token_exchange_completed_at: null
      };
      if (!this.data.oauth_transactions) this.data.oauth_transactions = [];
      this.data.oauth_transactions.push(newTx);
      this.saveJson();
      return;
    }
  }

  /**
   * Resets database state (used for testing cleanups)
   */
  public truncateAll(): void {
    if (this.isPostgresActive && this.pgPool) {
      // In PostgreSQL mode, truncate tables safely
      this.pgPool.query(`
        TRUNCATE TABLE audit_logs, verification_tokens, password_reset_tokens, assets, applications, workspace_members, workspaces, users CASCADE;
      `).catch(err => console.error("Database: Failed to truncate PostgreSQL tables:", err));
      return;
    }
    this.data = {
      users: [],
      verification_tokens: [],
      password_reset_tokens: [],
      audit_logs: [],
      workspaces: [],
      workspace_members: [],
      applications: [],
      assets: []
    };
    this.saveJson();
  }

  /**
   * Performs an internal health query (SELECT 1) and safe diagnostics
   */
  public async checkHealth(): Promise<{ status: string; database: string; latencyMs?: number; reference?: string; currentDatabase?: string; currentSchema?: string }> {
    if (!this.isPostgresActive || !this.pgPool) {
      return { status: "ok", database: "connected", reference: "JSON_FALLBACK" };
    }
    const start = Date.now();
    try {
      await this.pgPool.query("SELECT 1 AS healthy");
      const latencyMs = Date.now() - start;
      
      let currentDb = "unknown";
      let currentSch = "unknown";
      try {
        const dbInfo = await this.pgPool.query("SELECT current_database(), current_schema()");
        currentDb = dbInfo.rows[0]?.current_database || "unknown";
        currentSch = dbInfo.rows[0]?.current_schema || "unknown";
      } catch (innerErr) {
        console.warn("Could not query current database/schema details:", innerErr);
      }
      
      return {
        status: "ok",
        database: "reachable",
        latencyMs,
        currentDatabase: currentDb,
        currentSchema: currentSch
      };
    } catch (err: any) {
      console.error("Database connection check failed:", err);
      // Generate a stable safe reference ID
      const refId = `DB-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
      return { status: "degraded", database: "unreachable", reference: refId };
    }
  }
}

// Export singleton database instance
export const db = new Database();
