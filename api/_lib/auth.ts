import { betterAuth } from "better-auth";
import { sendVerificationEmail, sendResetPasswordEmail } from "./auth-emails";

// Cryptographic secret generation fallback for development safety
const getAuthSecret = () => {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret) {
    console.warn("[BetterAuth] BETTER_AUTH_SECRET is not configured in environment! Falling back to temporary local secret.");
    return "development-fallback-secret-31b7976b-b404-4b38-a1a6";
  }
  return secret;
};

export const auth = betterAuth({
  database: {
    provider: "postgres",
    connectionString: process.env.DATABASE_URL || "",
  },
  
  // Base configuration
  baseURL: process.env.BETTER_AUTH_URL || "https://appos-ten.vercel.app",
  secret: getAuthSecret(),
  
  // Domain constraints and trusted origins
  trustedOrigins: [
    "https://appos-ten.vercel.app",
    "http://localhost:3000",
    // Also support local development container address
    "http://127.0.0.1:3000",
  ],

  // 1. Email & Password Provider configuration
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    
    // Core email flow handlers using AppOS Resend implementation
    sendVerificationEmail: async ({ user, url, token }) => {
      console.log(`[BetterAuth] Triggering verification email for ${user.email}`);
      await sendVerificationEmail({ email: user.email, url });
    },
    
    sendResetPassword: async ({ user, url, token }) => {
      console.log(`[BetterAuth] Triggering password-reset email for ${user.email}`);
      await sendResetPasswordEmail({ email: user.email, url });
    },
  },

  // 2. Google OAuth Provider configuration
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "mock-client-id",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "mock-client-secret",
    },
  },

  // 3. Advanced session settings
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes cache
    },
    expiresIn: 7 * 24 * 60 * 60, // 7 days session
    updateAge: 24 * 60 * 60, // Update session once a day
  },

  // 4. Account Linking Policy & Rate Limiting
  accountLinking: {
    enabled: true,
    // When a user logs in with Google using an existing verified email, link accounts safely
    autoLink: true,
  },
});
