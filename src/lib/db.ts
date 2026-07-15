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
  name: string;
  email: string;
  emailVerified: boolean;
  email_verified?: boolean;
  image: string | null;
  profile_image?: string | null;
  createdAt: string;
  created_at?: string;
  updatedAt: string;
  updated_at?: string;
}

export interface Session {
  id: string;
  expiresAt: string;
  expires_at?: string;
  token: string;
  createdAt: string;
  created_at?: string;
  updatedAt: string;
  updated_at?: string;
  ipAddress: string | null;
  ip_address?: string | null;
  userAgent: string | null;
  user_agent?: string | null;
  userId: string;
  user_id?: string;
}

export interface Account {
  id: string;
  accountId: string;
  account_id?: string;
  providerId: string;
  provider_id?: string;
  userId: string;
  user_id?: string;
  accessToken: string | null;
  access_token?: string | null;
  refreshToken: string | null;
  refresh_token?: string | null;
  idToken: string | null;
  id_token?: string | null;
  accessTokenExpiresAt: string | null;
  access_token_expires_at?: string | null;
  refreshTokenExpiresAt: string | null;
  refresh_token_expires_at?: string | null;
  scope: string | null;
  password: string | null;
  createdAt: string;
  created_at?: string;
  updatedAt: string;
  updated_at?: string;
}

export interface Verification {
  id: string;
  identifier: string;
  value: string;
  expiresAt: string;
  expires_at?: string;
  createdAt: string | null;
  created_at?: string | null;
  updatedAt: string | null;
  updated_at?: string | null;
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

export interface PasswordResetToken {
  id: string;
  token_hash: string;
  user_id: string;
  expires_at: string;
  created_at?: string;
}

interface DatabaseSchema {
  user: User[];
  session: Session[];
  account: Account[];
  verification: Verification[];
  workspaces: Workspace[];
  workspace_members: WorkspaceMember[];
  applications: Application[];
  assets: Asset[];
  auth_handoff_codes?: AuthHandoffCode[];
  password_reset_tokens?: PasswordResetToken[];
  audit_logs: AuditLog[];
}

const DB_FILE_PATH = path.join(process.cwd(), "app_database.json");

export class Database {
  private data: DatabaseSchema = {
    user: [],
    session: [],
    account: [],
    verification: [],
    workspaces: [],
    workspace_members: [],
    applications: [],
    assets: [],
    auth_handoff_codes: [],
    password_reset_tokens: [],
    audit_logs: []
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
        
        // Non-blocking asynchronous background execution for database bootstrapping
        Promise.resolve()
          .then(async () => {
            await this.bootstrapPostgres();
          })
          .catch((err) => {
            console.error("Database background bootstrapping encountered an error:", err);
          });
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
        // 1. "user" Table
        await client.query(`
          CREATE TABLE IF NOT EXISTS "user" (
            id VARCHAR(255) PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            email_verified BOOLEAN NOT NULL,
            profile_image TEXT,
            created_at TIMESTAMP WITH TIME ZONE NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL
          );
        `);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_user_email ON "user" (email);`);

        // 2. "session" Table
        await client.query(`
          CREATE TABLE IF NOT EXISTS "session" (
            id VARCHAR(255) PRIMARY KEY,
            expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
            token TEXT UNIQUE NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
            ip_address TEXT,
            user_agent TEXT,
            user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE
          );
        `);

        // 3. "account" Table
        await client.query(`
          CREATE TABLE IF NOT EXISTS "account" (
            id VARCHAR(255) PRIMARY KEY,
            account_id TEXT NOT NULL,
            provider_id TEXT NOT NULL,
            user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
            access_token TEXT,
            refresh_token TEXT,
            id_token TEXT,
            access_token_expires_at TIMESTAMP WITH TIME ZONE,
            refresh_token_expires_at TIMESTAMP WITH TIME ZONE,
            scope TEXT,
            password TEXT,
            created_at TIMESTAMP WITH TIME ZONE NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL
          );
        `);

        // 4. "verification" Table
        await client.query(`
          CREATE TABLE IF NOT EXISTS "verification" (
            id VARCHAR(255) PRIMARY KEY,
            identifier TEXT NOT NULL,
            value TEXT NOT NULL,
            expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE,
            updated_at TIMESTAMP WITH TIME ZONE
          );
        `);

        // 5. workspaces Table
        await client.query(`
          CREATE TABLE IF NOT EXISTS workspaces (
            id VARCHAR(255) PRIMARY KEY,
            owner_id VARCHAR(255) NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
            name VARCHAR(255) NOT NULL,
            industry VARCHAR(255),
            created_at VARCHAR(255) NOT NULL,
            updated_at VARCHAR(255) NOT NULL
          );
        `);

        // 6. workspace_members Table
        await client.query(`
          CREATE TABLE IF NOT EXISTS workspace_members (
            id VARCHAR(255) PRIMARY KEY,
            workspace_id VARCHAR(255) NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
            user_id VARCHAR(255) NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
            role VARCHAR(50) NOT NULL DEFAULT 'member',
            created_at VARCHAR(255) NOT NULL,
            updated_at VARCHAR(255) NOT NULL,
            UNIQUE(workspace_id, user_id)
          );
        `);

        // 7. applications Table
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

        // 8. assets Table
        await client.query(`
          CREATE TABLE IF NOT EXISTS assets (
            id VARCHAR(255) PRIMARY KEY,
            application_id VARCHAR(255) NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
            cloudinary_url TEXT NOT NULL,
            asset_type VARCHAR(100) NOT NULL,
            created_at VARCHAR(255) NOT NULL
          );
        `);

        // 9. audit_logs Table
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

        // 10. auth_handoff_codes Table
        await client.query(`
          CREATE TABLE IF NOT EXISTS auth_handoff_codes (
            id VARCHAR(255) PRIMARY KEY,
            code_hash VARCHAR(255) NOT NULL,
            user_id VARCHAR(255) NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
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

        // 11. password_reset_tokens Table
        await client.query(`
          CREATE TABLE IF NOT EXISTS password_reset_tokens (
            id VARCHAR(255) PRIMARY KEY,
            token_hash VARCHAR(255) UNIQUE NOT NULL,
            user_id VARCHAR(255) NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
            expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );
        `);
        await client.query(`
          CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token_hash ON password_reset_tokens (token_hash);
        `);

        console.log("Database: PostgreSQL tables checked and bootstrapped successfully.");
        try {
          const checkUsersRes = await client.query(
            "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user') as exists"
          );
          console.log(`DATABASE_USERS_TABLE_EXISTS=${checkUsersRes.rows[0].exists}`);
        } catch (checkErr) {
          console.warn("Failed to check if user table exists:", checkErr);
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
        if (!this.data.user) this.data.user = [];
        if (!this.data.session) this.data.session = [];
        if (!this.data.account) this.data.account = [];
        if (!this.data.verification) this.data.verification = [];
        if (!this.data.workspaces) this.data.workspaces = [];
        if (!this.data.workspace_members) this.data.workspace_members = [];
        if (!this.data.applications) this.data.applications = [];
        if (!this.data.assets) this.data.assets = [];
        if (!this.data.auth_handoff_codes) this.data.auth_handoff_codes = [];
        if (!this.data.password_reset_tokens) this.data.password_reset_tokens = [];
        if (!this.data.audit_logs) this.data.audit_logs = [];
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

    // 1. SELECT FROM USER
    if (normalizedSql.startsWith("select * from user") || normalizedSql.startsWith("select * from \"user\"")) {
      if (normalizedSql.includes("where email = ?") || normalizedSql.includes("where email = $1")) {
        const emailParam = String(params[0]).toLowerCase().trim();
        const found = this.data.user.filter(u => u.email === emailParam);
        return found as unknown as T[];
      }
      if (normalizedSql.includes("where id = ?") || normalizedSql.includes("where id = $1")) {
        const idParam = String(params[0]);
        const found = this.data.user.filter(u => u.id === idParam);
        return found as unknown as T[];
      }
      return this.data.user as unknown as T[];
    }

    // 2. SELECT FROM WORKSPACES
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

    // 3. SELECT FROM APPLICATIONS
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

    // 4. SELECT FROM ASSETS
    if (normalizedSql.startsWith("select * from assets")) {
      if (normalizedSql.includes("where application_id = ?") || normalizedSql.includes("where application_id = $1")) {
        const appId = String(params[0]);
        const found = this.data.assets.filter(a => a.application_id === appId);
        return found as unknown as T[];
      }
      return this.data.assets as unknown as T[];
    }

    // 5. SELECT FROM AUDIT LOGS
    if (normalizedSql.startsWith("select * from audit_logs")) {
      return this.data.audit_logs as unknown as T[];
    }

    // 6. SELECT FROM AUTH_HANDOFF_CODES
    if (normalizedSql.startsWith("select * from auth_handoff_codes")) {
      if (normalizedSql.includes("where code_hash = ?") || normalizedSql.includes("where code_hash = $1")) {
        const hashParam = String(params[0]);
        const found = (this.data.auth_handoff_codes || []).filter(c => c.code_hash === hashParam);
        return found as unknown as T[];
      }
      return (this.data.auth_handoff_codes || []) as unknown as T[];
    }

    // 7. SELECT FROM SESSION
    if (normalizedSql.startsWith("select * from session") || normalizedSql.startsWith("select * from \"session\"")) {
      if (normalizedSql.includes("where id = ?") || normalizedSql.includes("where id = $1")) {
        const idParam = String(params[0]);
        const found = (this.data.session || []).filter(s => s.id === idParam);
        return found as unknown as T[];
      }
      return (this.data.session || []) as unknown as T[];
    }

    // 8. SELECT FROM ACCOUNT
    if (normalizedSql.startsWith("select * from account") || normalizedSql.startsWith("select * from \"account\"")) {
      return (this.data.account || []) as unknown as T[];
    }

    // 9. SELECT FROM VERIFICATION
    if (normalizedSql.startsWith("select * from verification") || normalizedSql.startsWith("select * from \"verification\"")) {
      return (this.data.verification || []) as unknown as T[];
    }

    // 10. SELECT FROM PASSWORD_RESET_TOKENS
    if (normalizedSql.startsWith("select * from password_reset_tokens")) {
      if (normalizedSql.includes("where token_hash = ?") || normalizedSql.includes("where token_hash = $1")) {
        const hashParam = String(params[0]);
        const found = (this.data.password_reset_tokens || []).filter(c => c.token_hash === hashParam);
        return found as unknown as T[];
      }
      return (this.data.password_reset_tokens || []) as unknown as T[];
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

    // 1. INSERT INTO USER
    if (normalizedSql.startsWith("insert into user") || normalizedSql.startsWith("insert into \"user\"")) {
      const email = params[2];
      const emailLower = String(email).toLowerCase().trim();
      const exists = this.data.user.some(u => u.email === emailLower);
      if (exists) {
        throw new Error("UNIQUE constraint failed: user.email");
      }

      const [id, name, emailVal, emailVerified, image, createdAt, updatedAt] = params;
      const newUser: User = {
        id: String(id),
        name: String(name),
        email: emailLower,
        emailVerified: !!emailVerified,
        image: image ? String(image) : null,
        createdAt: String(createdAt),
        updatedAt: String(updatedAt)
      };

      this.data.user.push(newUser);
      this.saveJson();
      return;
    }

    // 2. INSERT INTO SESSION
    if (normalizedSql.startsWith("insert into session") || normalizedSql.startsWith("insert into \"session\"")) {
      const [id, expiresAt, token, createdAt, updatedAt, ipAddress, userAgent, userId] = params;
      const newSession: Session = {
        id: String(id),
        expiresAt: String(expiresAt),
        token: String(token),
        createdAt: String(createdAt),
        updatedAt: String(updatedAt),
        ipAddress: ipAddress ? String(ipAddress) : null,
        userAgent: userAgent ? String(userAgent) : null,
        userId: String(userId)
      };
      this.data.session.push(newSession);
      this.saveJson();
      return;
    }

    // 3. INSERT INTO ACCOUNT
    if (normalizedSql.startsWith("insert into account") || normalizedSql.startsWith("insert into \"account\"")) {
      const [id, accountId, providerId, userId, accessToken, refreshToken, idToken, accessTokenExpiresAt, refreshTokenExpiresAt, scope, password, createdAt, updatedAt] = params;
      const newAccount: Account = {
        id: String(id),
        accountId: String(accountId),
        providerId: String(providerId),
        userId: String(userId),
        accessToken: accessToken ? String(accessToken) : null,
        refreshToken: refreshToken ? String(refreshToken) : null,
        idToken: idToken ? String(idToken) : null,
        accessTokenExpiresAt: accessTokenExpiresAt ? String(accessTokenExpiresAt) : null,
        refreshTokenExpiresAt: refreshTokenExpiresAt ? String(refreshTokenExpiresAt) : null,
        scope: scope ? String(scope) : null,
        password: password ? String(password) : null,
        createdAt: String(createdAt),
        updatedAt: String(updatedAt)
      };
      this.data.account.push(newAccount);
      this.saveJson();
      return;
    }

    // 4. INSERT INTO VERIFICATION
    if (normalizedSql.startsWith("insert into verification") || normalizedSql.startsWith("insert into \"verification\"")) {
      const [id, identifier, value, expiresAt, createdAt, updatedAt] = params;
      const newVerification: Verification = {
        id: String(id),
        identifier: String(identifier),
        value: String(value),
        expiresAt: String(expiresAt),
        createdAt: createdAt ? String(createdAt) : null,
        updatedAt: updatedAt ? String(updatedAt) : null
      };
      this.data.verification.push(newVerification);
      this.saveJson();
      return;
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

    // 12. DELETE FROM SESSION
    if (normalizedSql.startsWith("delete from session") || normalizedSql.startsWith("delete from \"session\"")) {
      if (normalizedSql.includes("where id = ?") || normalizedSql.includes("where id = $1")) {
        const idParam = String(params[0]);
        this.data.session = this.data.session.filter(s => s.id !== idParam);
        this.saveJson();
      }
      return;
    }

    // 13. INSERT INTO PASSWORD_RESET_TOKENS
    if (normalizedSql.startsWith("insert into password_reset_tokens")) {
      const [id, token_hash, user_id, expires_at, created_at] = params;
      const newToken: PasswordResetToken = {
        id: String(id),
        token_hash: String(token_hash),
        user_id: String(user_id),
        expires_at: String(expires_at),
        created_at: created_at ? String(created_at) : new Date().toISOString()
      };
      if (!this.data.password_reset_tokens) this.data.password_reset_tokens = [];
      this.data.password_reset_tokens.push(newToken);
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
        TRUNCATE TABLE audit_logs, assets, applications, workspace_members, workspaces, "session", "account", "verification", "user", auth_handoff_codes, password_reset_tokens CASCADE;
      `).catch(err => console.error("Database: Failed to truncate PostgreSQL tables:", err));
      return;
    }
    this.data = {
      user: [],
      session: [],
      account: [],
      verification: [],
      workspaces: [],
      workspace_members: [],
      applications: [],
      assets: [],
      auth_handoff_codes: [],
      password_reset_tokens: [],
      audit_logs: []
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
      const refId = `DB-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
      return { status: "degraded", database: "unreachable", reference: refId };
    }
  }
}

// Export singleton database instance
export const db = new Database();
