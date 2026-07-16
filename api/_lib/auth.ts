import { betterAuth } from "better-auth";
import { bearer } from "better-auth/plugins";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

export const auth = betterAuth({
  database: pool, 
  plugins: [
    bearer() as any
  ],
  baseURL: "https://appos.onrender.com",
  
  // Synchronous resolution to perfectly align with better-auth's trustedOrigins type signature
  trustedOrigins: (request) => {
    const defaultOrigins = [
      "https://appos-ten.vercel.app",
      "http://localhost:5173",
      "http://localhost:3000"
    ];
    if (!request) return defaultOrigins;

    const originHeader = request.headers.get("origin");
    const refererHeader = request.headers.get("referer");
    let clientOrigin = originHeader || "";

    if (!clientOrigin && refererHeader) {
      try {
        clientOrigin = new URL(refererHeader).origin;
      } catch (_) {}
    }

    if (clientOrigin) {
      const lowerOrigin = clientOrigin.toLowerCase();
      const isAllowed = 
        lowerOrigin.includes("vercel.app") ||
        lowerOrigin.includes("google.com") ||
        lowerOrigin.includes("googleusercontent.com") ||
        lowerOrigin.includes("run.app") ||
        lowerOrigin.includes("localhost") ||
        lowerOrigin.includes("127.0.0.1");

      if (isAllowed) {
        return [...defaultOrigins, clientOrigin];
      }
    }
    return defaultOrigins;
  },
  
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
      disableImplicitLinking: false,
    },
  },
  advanced: {
    disableCSRFCheck: true,
    disableOriginCheck: true, 
    defaultCookieAttributes: {
      sameSite: "none",
      secure: true,
      partitioned: true
    }
  } as any,
});
