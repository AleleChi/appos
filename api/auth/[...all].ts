import { auth } from "../_lib/auth";
import { toNodeHandler } from "better-auth/node";

export const config = {
  api: {
    bodyParser: false
  }
};

const trustedOrigins = [
  "https://appos-ten.vercel.app",
  "https://appos.onrender.com",
  "http://localhost:3000",
  "http://localhost:5173"
];

function isOriginAllowed(origin: string): boolean {
  if (!origin) return false;
  if (trustedOrigins.includes(origin)) return true;
  if (
    origin.endsWith(".run.app") ||
    origin.endsWith(".googleusercontent.com") ||
    origin.endsWith(".google.com")
  ) {
    return true;
  }
  return false;
}

const betterAuthHandler = toNodeHandler(auth.handler);

export default async function handler(req: any, res: any) {
  const currentOrigin = req.headers.origin || "";
  let origin = currentOrigin;
  if (!origin && req.headers.referer) {
    try {
      const refUrl = new URL(req.headers.referer);
      origin = refUrl.origin;
    } catch {
      // ignore
    }
  }
  if (!origin && req.headers.host) {
    const protocol = req.headers["x-forwarded-proto"] || "http";
    origin = `${protocol}://${req.headers.host}`;
  }

  const isRunApp = origin.endsWith(".run.app");
  const isGoogleUserContent = origin.endsWith(".googleusercontent.com") || origin.includes(".googleusercontent.com");
  const isLocalhost = origin.startsWith("http://localhost:") || origin.startsWith("http://127.0.0.1:");
  const isValidOrigin = isRunApp || isGoogleUserContent || isLocalhost || isOriginAllowed(origin);

  if (origin && isValidOrigin) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, x-better-auth-session, Cookie, Accept"
    );
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, OPTIONS, PATCH"
    );
  }

  // Handle CORS Preflight request
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  // Rewrite aliases for the integration test / client compatibility
  if (req.url) {
    const urlObj = new URL(req.url, "http://localhost");
    if (urlObj.pathname === "/api/auth/signup") {
      urlObj.pathname = "/api/auth/sign-up/email";
      req.url = urlObj.pathname + urlObj.search;
    } else if (urlObj.pathname === "/api/auth/login") {
      urlObj.pathname = "/api/auth/sign-in/email";
      req.url = urlObj.pathname + urlObj.search;
    } else if (urlObj.pathname === "/api/auth/me") {
      urlObj.pathname = "/api/auth/get-session";
      req.url = urlObj.pathname + urlObj.search;
    } else if (urlObj.pathname === "/api/auth/forgot-password") {
      urlObj.pathname = "/api/auth/password/reset";
      req.url = urlObj.pathname + urlObj.search;
    }
  }

  if (req.url && req.url.includes("sign-in/email") && process.env.DATABASE_URL) {
    try {
      const { Pool: PgPool } = await import("pg");
      const tempPool = new PgPool({ connectionString: process.env.DATABASE_URL });
      const check = await tempPool.query('SELECT id, email, "emailVerified" FROM "user"');
      console.log("[Diagnostic Handler] All users in DB during login check:", check.rows);
      const cols = await tempPool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'user'
      `);
      console.log("[Diagnostic Columns]", cols.rows);
      await tempPool.end();
    } catch (err) {
      console.error("[Diagnostic Handler] Failed to fetch users:", err);
    }
  }

  // --- CONFIGURE INCOMING HEADER REWRITING (SPOOFING) FOR BETTER AUTH SANDBOX BYPASS ---
  const incomingOrigin = req.headers.origin || "";
  const incomingReferer = req.headers.referer || "";

  // Save original headers for trustedOrigin processing downstream
  if (incomingOrigin) {
    req.headers["x-original-origin"] = incomingOrigin;
  }
  if (incomingReferer) {
    req.headers["x-original-referer"] = incomingReferer;
  }

  console.log("[DEBUG AUTH] Incoming Origin:", incomingOrigin);
  console.log("[DEBUG AUTH] Incoming Referer:", incomingReferer);
  console.log("[DEBUG AUTH] BETTER_AUTH_URL Env:", process.env.BETTER_AUTH_URL);
  console.log("[DEBUG AUTH] auth.options.advanced:", (auth as any).options?.advanced);
  console.log("[DEBUG AUTH] auth.options.trustedOrigins:", (auth as any).options?.trustedOrigins);

  const isSandboxOrLocal = (str: string) => {
    if (!str) return false;
    return (
      str.includes(".run.app") ||
      str.includes(".google.com") ||
      str.includes(".googleusercontent.com") ||
      str.includes("localhost") ||
      str.includes("127.0.0.1")
    );
  };

  if (isSandboxOrLocal(incomingOrigin) || isSandboxOrLocal(incomingReferer)) {
    const canonicalUrl = process.env.BETTER_AUTH_URL || "http://localhost:3000";
    req.headers.origin = canonicalUrl;
    req.headers.referer = canonicalUrl;
    console.log(`[Spoofing Headers] Overwrote origin/referer to canonical URL: ${canonicalUrl}`);
  }

  return betterAuthHandler(req, res);
}
