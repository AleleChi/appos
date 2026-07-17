import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { verifyPassword } from "better-auth/crypto";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { sendVerificationEmail, sendResetPasswordEmail } from "./auth-emails";
import { drizzleDb } from "./db-client";
import * as schema from "../../../../src/db/schema";

if (!process.env.BETTER_AUTH_SECRET) {
  throw new Error("FATAL: BETTER_AUTH_SECRET is required! Startup aborted.");
}

if (process.env.NODE_ENV === "production" && process.env.AUTH_PREVIEW_CROSS_SITE_COOKIES === "true") {
  throw new Error("FATAL: AUTH_PREVIEW_CROSS_SITE_COOKIES=true is strictly forbidden in production environments!");
}

const isPreviewCrossSite = process.env.NODE_ENV !== "production" && process.env.AUTH_PREVIEW_CROSS_SITE_COOKIES === "true";

const secret = process.env.BETTER_AUTH_SECRET;

// Determine the browser-facing public application origin.
// Priority: WEB_APP_URL (or APP_URL in dev/preview environments), falling back to local port 3000
const publicUrl = process.env.WEB_APP_URL || process.env.APP_URL || "http://localhost:3000";

// Ensure Better Auth uses the browser-facing origin for construction of callbacks
process.env.BETTER_AUTH_URL = publicUrl;

const trustedOrigins = [
  "https://appos-ten.vercel.app",
  "http://localhost:3000"
];

if (process.env.WEB_APP_URL && !trustedOrigins.includes(process.env.WEB_APP_URL)) {
  trustedOrigins.push(process.env.WEB_APP_URL);
}
if (process.env.APP_URL && !trustedOrigins.includes(process.env.APP_URL)) {
  trustedOrigins.push(process.env.APP_URL);
}

export const auth = betterAuth({
  database: drizzleAdapter(drizzleDb, {
    provider: "pg",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  secret: secret,
  baseURL: publicUrl,
  
  trustedOrigins: trustedOrigins,
  
  emailVerification: {
    sendOnSignUp: true,
    sendOnSignIn: true,
    autoSignInAfterVerification: false,
    expiresIn: 86400,
    sendVerificationEmail: async ({ user, url, token }) => {
      await sendVerificationEmail({
        email: user.email,
        url
      });
    }
  },
  
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    minPasswordLength: 12,
    autoSignIn: false,
    password: {
      verify: async ({ password, hash }) => {
        console.log(`[Better Auth Custom Verify] Initiating password verification. Password length: ${password?.length}`);
        if (!hash || typeof hash !== "string" || !password || typeof password !== "string") {
          console.warn("[Better Auth Custom Verify] Invalid input types for password verification.");
          return false;
        }
        if (hash.startsWith("$2a$") || hash.startsWith("$2b$") || hash.startsWith("$2y$")) {
          try {
            const isMatch = await bcrypt.compare(password, hash);
            console.log(`[Better Auth Custom Verify] Bcrypt comparison completed. Is Match: ${isMatch}`);
            return isMatch;
          } catch (err) {
            console.error("[Better Auth Custom Verify] Bcrypt compare failed:", err);
            return false;
          }
        }
        try {
          const isMatch = await verifyPassword({ hash, password });
          console.log(`[Better Auth Custom Verify] Native scrypt comparison completed. Is Match: ${isMatch}`);
          return isMatch;
        } catch (err) {
          console.error("[Better Auth Custom Verify] Native scrypt compare failed:", err);
          return false;
        }
      }
    },
    sendResetPassword: async ({ user, url }: { user: any; url: string }) => {
      await sendResetPasswordEmail({ email: user.email, url });
    },
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    },
  },
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["google"],
      disableImplicitLinking: true, // Disable unsafe implicit account linking as requested in Section 8
    },
  },
  advanced: {
    disableCSRFCheck: false,
    disableOriginCheck: false, 
    defaultCookieAttributes: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production" || isPreviewCrossSite,
      sameSite: isPreviewCrossSite ? "none" : "lax",
      path: "/",
    }
  } as any,
});
