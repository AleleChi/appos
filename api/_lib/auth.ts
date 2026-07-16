import { betterAuth } from "better-auth";
import { Pool } from "pg";

// Ensure we utilize a secure, limited connection pool for our persistent container
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10, // Prevent database connection exhaustion
  idleTimeoutMillis: 30000,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

export const auth = betterAuth({
  database: pool,
  // Securely lock our core URL to the Render backend service
  baseURL: "https://appos.onrender.com",
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
      disableImplicitLinking: false,
    },
  },
  advanced: {
    disableCSRFCheck: true, // Required for dynamic preview domains
    cookies: {
      state: {
        attributes: {
          sameSite: "none", // Allows cross-origin authentication handshakes
          secure: true,     // Requires HTTPS
          partitioned: true // Modern browser cookie protection isolation
        }
      }
    }
  }
});
