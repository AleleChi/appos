import { betterAuth } from "better-auth";
import { bearer } from "better-auth/plugins"; // Required for sandbox environment header auth
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10, // Prevent database connection pool exhaustion
  idleTimeoutMillis: 30000,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

export const auth = betterAuth({
  database: pool,
  // Mount the bearer plugin to parse Authorization headers when browser cookies are blocked
  plugins: [
    bearer() as any
  ],
  // Lock our core URL to the consolidated Render backend service
  baseURL: "https://appos.onrender.com",
  
  // Security Boundary: Only allow redirects to our trusted domains
  trustedOrigins: [
    "https://appos-ten.vercel.app",
    "http://localhost:5173",
    "http://localhost:3000"
  ],

  // Enable standard email/password credentials alongside social logins
  emailAndPassword: {
    enabled: true,
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
    },
  },

  advanced: {
    disableCSRFCheck: true, // Necessary for cross-site preview testing
    cookies: {
      state: {
        attributes: {
          sameSite: "none",
          secure: true,
          partitioned: true,
        },
      },
    },
  },
});
