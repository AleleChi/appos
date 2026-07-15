import { betterAuth } from "better-auth";
import { Pool } from "pg";
import bcryptjs from "bcryptjs";
import {
  sendVerificationEmail,
  sendResetPasswordEmail
} from "./auth-emails";

function requireServerEnv(name: string, defaultValue?: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
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
const betterAuthUrl = (() => {
  const envUrl = process.env.BETTER_AUTH_URL?.trim();
  if (process.env.NODE_ENV === "production" && envUrl) {
    return envUrl;
  }
  return envUrl || "http://localhost:3000";
})();
const googleClientId = process.env.GOOGLE_CLIENT_ID?.trim() || "";
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim() || "";

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

const trustedOrigins: string[] = [
  "https://appos-ten.vercel.app",
  "https://appos.onrender.com",
  "http://localhost:3000",
  "http://localhost:5173",
  "https://*.run.app",
  "https://*.googleusercontent.com",
  "https://*.google.com"
];

if (process.env.APP_URL) {
  const appUrl = process.env.APP_URL.trim();
  if (appUrl && !trustedOrigins.includes(appUrl)) {
    trustedOrigins.push(appUrl);
    if (appUrl.includes("ais-dev-")) {
      const preUrl = appUrl.replace("ais-dev-", "ais-pre-");
      if (!trustedOrigins.includes(preUrl)) {
        trustedOrigins.push(preUrl);
      }
    }
  }
}

if (process.env.BETTER_AUTH_TRUSTED_ORIGINS) {
  process.env.BETTER_AUTH_TRUSTED_ORIGINS.split(",").forEach(o => {
    const trimmed = o.trim();
    if (trimmed && !trustedOrigins.includes(trimmed)) {
      trustedOrigins.push(trimmed);
    }
  });
}

console.log("[AppOS Auth] Evaluated trustedOrigins:", trustedOrigins);

export const auth = betterAuth({
  database: pool,

  baseURL: betterAuthUrl,

  secret: betterAuthSecret,

  trustedOrigins,

  advanced: {
    defaultCookieAttributes: {
      sameSite: "none",
      secure: true
    }
  },

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
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
      const result = await sendResetPasswordEmail({
        email: user.email,
        url
      });

      if (!result.success) {
        console.error(
          "[AppOS Auth] Password-reset email delivery failed."
        );
      }
    }
  },

  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      const result = await sendVerificationEmail({
        email: user.email,
        url
      });

      if (!result.success) {
        console.error(
          "[AppOS Auth] Verification email delivery failed."
        );
      }
    }
  },

  socialProviders: {
    ...(googleClientId && googleClientSecret ? {
      google: {
        clientId: googleClientId,
        clientSecret: googleClientSecret
      }
    } : {})
  },

  account: {
    accountLinking: {
      enabled: true,
      disableImplicitLinking: true
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
