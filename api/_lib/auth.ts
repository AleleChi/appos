import { betterAuth } from "better-auth";
import { Pool } from "pg";
import bcryptjs from "bcryptjs";
import {
  sendVerificationEmail,
  sendResetPasswordEmail
} from "./auth-emails";

function requireServerEnv(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(
      `[AppOS Auth Configuration] Missing required environment variable: ${name}`
    );
  }

  return value;
}

const databaseUrl = requireServerEnv("DATABASE_URL");
const betterAuthSecret = requireServerEnv("BETTER_AUTH_SECRET");
const betterAuthUrl = requireServerEnv("BETTER_AUTH_URL");
const googleClientId = requireServerEnv("GOOGLE_CLIENT_ID");
const googleClientSecret = requireServerEnv("GOOGLE_CLIENT_SECRET");

const globalForAuth = globalThis as unknown as {
  apposAuthPool?: Pool;
};

const pool =
  globalForAuth.apposAuthPool ??
  new Pool({
    connectionString: databaseUrl,
    max: 3,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 15000
  });

globalForAuth.apposAuthPool = pool;

export const auth = betterAuth({
  database: pool,

  baseURL: betterAuthUrl,

  secret: betterAuthSecret,

  trustedOrigins: [
    "https://appos-ten.vercel.app",
    "http://localhost:3000",
    "http://localhost:5173"
  ],

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
    google: {
      clientId: googleClientId,
      clientSecret: googleClientSecret
    }
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
  }
});
