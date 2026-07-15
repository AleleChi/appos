import { betterAuth } from "better-auth";
import { oAuthProxy } from "better-auth/plugins";
import { Pool } from "pg";
import { Kysely, PostgresDialect } from "kysely";
import bcryptjs from "bcryptjs";
import crypto from "crypto";
import {
  sendVerificationEmail,
  sendResetPasswordEmail
} from "./auth-emails";

function requireServerEnv(name: string, defaultValue?: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        `[AppOS Auth Configuration] CRITICAL: Missing required production environment variable: ${name}`
      );
    }
    if (defaultValue !== undefined) {
      console.warn(`[AppOS Auth Warning] Missing optional environment variable: ${name}. Using default fallback value.`);
      return defaultValue;
    }
    throw new Error(
      `[AppOS Auth Configuration] Missing required environment variable: ${name}`
    );
  }

  return value;
}

const databaseUrl = process.env.DATABASE_URL?.trim() || "";
if (!databaseUrl) {
  console.warn("[AppOS Auth Warning] DATABASE_URL is not set. Falling back to persistent MockPool for local development.");
}

const betterAuthSecret = requireServerEnv("BETTER_AUTH_SECRET", "appos-default-better-auth-secret-key-32-chars-long");
const betterAuthUrl = requireServerEnv("BETTER_AUTH_URL", "http://localhost:3000");

const globalForAuth = globalThis as unknown as {
  apposAuthPool?: Pool;
};

import { MockPool } from "./mock-pool";

const pool = databaseUrl
  ? (globalForAuth.apposAuthPool ??
    new Pool({
      connectionString: databaseUrl,
      max: 3,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 15000
    }))
  : (new MockPool() as any);

if (databaseUrl) {
  globalForAuth.apposAuthPool = pool;
}

const kyselyDb = new Kysely<any>({
  dialect: new PostgresDialect({
    pool: pool
  }),
  log(event) {
    if (event.level === "query") {
      console.log(`[Kysely SQL] ${event.query.sql} params: ${JSON.stringify(event.query.parameters)}`);
    } else if (event.level === "error") {
      console.error(`[Kysely ERROR] ${event.error}`);
    }
  }
});

const staticTrustedOrigins: string[] = [
  "https://appos-ten.vercel.app",
  "https://appos.onrender.com",
  "http://localhost:3000",
  "http://localhost:5173",
  "https://*.run.app",
  "https://*.googleusercontent.com",
  "https://*.google.com",
  "*.run.app",
  "*.googleusercontent.com",
  "*.google.com"
];

if (process.env.APP_URL) {
  const appUrl = process.env.APP_URL.trim();
  if (appUrl && !staticTrustedOrigins.includes(appUrl)) {
    staticTrustedOrigins.push(appUrl);
    if (appUrl.includes("ais-dev-")) {
      const preUrl = appUrl.replace("ais-dev-", "ais-pre-");
      if (!staticTrustedOrigins.includes(preUrl)) {
        staticTrustedOrigins.push(preUrl);
      }
    }
  }
}

if (process.env.BETTER_AUTH_TRUSTED_ORIGINS) {
  process.env.BETTER_AUTH_TRUSTED_ORIGINS.split(",").forEach(o => {
    const trimmed = o.trim();
    if (trimmed && !staticTrustedOrigins.includes(trimmed)) {
      staticTrustedOrigins.push(trimmed);
    }
  });
}

console.log("[AppOS Auth] Evaluated staticTrustedOrigins:", staticTrustedOrigins);

const getDynamicTrustedOrigins = (request?: Request): string[] => {
  const list = [...staticTrustedOrigins];
  if (!request) return list;

  const addOrigin = (val: string | null) => {
    if (!val) return;
    try {
      const trimmed = val.trim();
      if (!trimmed || trimmed === "null") return;
      
      let originVal = trimmed;
      if (originVal.includes("://")) {
        originVal = new URL(originVal).origin;
      } else {
        originVal = new URL(`https://${originVal}`).origin;
      }
      
      if (originVal && !list.includes(originVal)) {
        list.push(originVal);
        console.log(`[Dynamic Origin] Added trustedOrigin: ${originVal}`);
      }
    } catch {
      // ignore parsing failures
    }
  };

  addOrigin(request.headers.get("x-original-origin"));
  addOrigin(request.headers.get("x-original-referer"));
  addOrigin(request.headers.get("origin"));
  addOrigin(request.headers.get("referer"));

  return list;
};

export const auth = betterAuth({
  debug: true,
  database: {
    db: kyselyDb,
    provider: "postgres",
    type: "postgres",
    usePlural: false
  },

  baseURL: betterAuthUrl,

  secret: betterAuthSecret,

  trustedOrigins: getDynamicTrustedOrigins,

  plugins: [
    oAuthProxy({
      productionURL: "https://appos-ten.vercel.app",
    }) as any
  ],

  advanced: {
    disableCSRFCheck: true,
    cookies: {
      state: {
        attributes: {
          sameSite: "none",
          secure: true
        }
      }
    } as any,
    defaultCookieAttributes: {
      sameSite: "none",
      secure: true
    }
  },

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    minPasswordLength: 12,
    maxPasswordLength: 128,
    revokeSessionsOnPasswordReset: true,

    password: {
      hash: async (password: string) => {
        return bcryptjs.hash(password, 12);
      },

      verify: async ({
        password,
        hash
      }: {
        password: string;
        hash: string;
      }) => {
        return bcryptjs.compare(password, hash);
      }
    },

    sendResetPassword: async ({ user, url }) => {
      console.log(`[AppOS Auth] Intercepted password reset request. User: ${user.email}, Name: ${user.name || "N/A"}. Verification URL: ${url}`);
      
      // Extract, hash and store password reset token securely
      try {
        const urlObj = new URL(url);
        const token = urlObj.searchParams.get("token") || "";
        if (token) {
          const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
          const tokenId = crypto.randomUUID();
          const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24-hour TTL
          
          if (databaseUrl) {
            console.log(`[AppOS Auth] PostgreSQL Mode: Writing unique reset token hash to 'password_reset_tokens' table for user_id ${user.id}`);
            await pool.query(
              'INSERT INTO password_reset_tokens (id, token_hash, user_id, expires_at) VALUES ($1, $2, $3, $4)',
              [tokenId, tokenHash, user.id, expiresAt]
            );
          } else {
            console.log(`[AppOS Auth] JSON Fallback Mode: Writing unique reset token hash to in-memory/file storage`);
            const { db } = await import("../../src/lib/db");
            db.execute(
              "INSERT INTO password_reset_tokens (id, token_hash, user_id, expires_at) VALUES (?, ?, ?, ?)",
              [tokenId, tokenHash, user.id, expiresAt.toISOString()]
            );
          }
        }
      } catch (err) {
        console.error("[AppOS Auth] Failed to securely write unique reset token hash to database:", err);
      }

      const result = await sendResetPasswordEmail({
        email: user.email,
        url
      });

      if (!result.success) {
        console.error(
          `[AppOS Auth] CRITICAL: Password-reset email delivery failed for user ${user.email}. Error:`,
          result.error || "Unknown outbound mailer exception"
        );
      } else {
        console.log(`[AppOS Auth] Password-reset email successfully dispatched to ${user.email}`);
      }
    }
  },

  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      console.log(`[AppOS Auth] Intercepted user registration lifecycle hook. User: ${user.email}, Name: ${user.name || "N/A"}. Generated Token URL: ${url}`);
      if (typeof global !== "undefined") {
        (global as any).lastVerificationUrl = url;
      }
      const result = await sendVerificationEmail({
        email: user.email,
        url
      });

      if (!result.success) {
        console.error(
          `[AppOS Auth] CRITICAL: Verification email delivery failed for user ${user.email}. Error:`,
          result.error || "Unknown outbound mailer exception"
        );
      } else {
        console.log(`[AppOS Auth] Verification email successfully dispatched to ${user.email}`);
      }
    }
  },

  socialProviders: {
    google: {
      clientId: (() => {
        const id = process.env.GOOGLE_CLIENT_ID?.trim();
        if (!id) {
          throw new Error("[AppOS Auth Configuration] CRITICAL: Missing required environment variable GOOGLE_CLIENT_ID for Google OAuth initialization.");
        }
        return id;
      })(),
      clientSecret: (() => {
        const secret = process.env.GOOGLE_CLIENT_SECRET?.trim();
        if (!secret) {
          throw new Error("[AppOS Auth Configuration] CRITICAL: Missing required environment variable GOOGLE_CLIENT_SECRET for Google OAuth initialization.");
        }
        return secret;
      })(),
      redirectURI: process.env.NODE_ENV === "production"
        ? "https://appos.onrender.com/api/auth/callback/google"
        : undefined
    }
  },

  account: {
    modelName: "accounts",
    fields: {
      userId: "user_id",
      providerId: "provider_id",
      accountId: "account_id",
      accessToken: "access_token",
      refreshToken: "refresh_token",
      idToken: "id_token",
      accessTokenExpiresAt: "access_token_expires_at",
      refreshTokenExpiresAt: "refresh_token_expires_at",
      password: "password"
    },
    accountLinking: {
      enabled: true,
      trustedProviders: ["google"],
      disableImplicitLinking: false
    } as any
  },

  verification: {
    modelName: "verification",
    fields: {
      expiresAt: "expires_at",
      createdAt: "created_at",
      updatedAt: "updated_at"
    }
  },

  session: {
    expiresIn: 7 * 24 * 60 * 60,
    updateAge: 24 * 60 * 60,
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60
    }
  },

  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          console.log(`[AppOS Auth] AUTH SIGNUP REQUEST RECEIVED
EMAIL: ${user.email}
DATABASE: Connection active, starting transaction
BETTER_AUTH: Processing user insertion`);
        },
        after: async (user) => {
          console.log(`[AppOS Auth] AUTH SIGNUP SUCCESS
USER CREATED: ID: ${user.id}, Name: ${user.name}, Email: ${user.email}
SESSION CREATED: Awaiting verification`);
        }
      }
    }
  }
});
