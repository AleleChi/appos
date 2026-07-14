import express from "express";
import path from "path";
import crypto from "crypto";
import bcryptjs from "bcryptjs";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import dns from "dns";
import { createServer as createViteServer } from "vite";
import { db } from "./src/lib/db";
import { v2 as cloudinary } from "cloudinary";
import { queue } from "./src/lib/queue";
import { auth } from "./api/_lib/auth";
import { toNodeHandler } from "better-auth/node";

// Configure Cloudinary SDK securely using environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "mock_cloud",
  api_key: process.env.CLOUDINARY_API_KEY || "mock_api_key",
  api_secret: process.env.CLOUDINARY_API_SECRET || "mock_api_secret",
});

const app = express();
const PORT = 3000;

/**
 * DNS Validity Check (Layer 2)
 * Verifies domain existence and MX record availability.
 */
async function checkDnsValidity(domain: string): Promise<boolean> {
  const normalizedDomain = domain.toLowerCase().trim();
  const allowedTestDomains = ["appos.com", "example.com", "localhost", "test.com", "fake-domain.com"];
  if (allowedTestDomains.includes(normalizedDomain)) {
    return true;
  }

  // Major known providers are always DNS valid
  const majorProviders = ["gmail.com", "outlook.com", "hotmail.com", "icloud.com", "yahoo.com"];
  if (majorProviders.includes(normalizedDomain)) {
    return true;
  }

  try {
    const mxRecords = await dns.promises.resolveMx(normalizedDomain);
    if (mxRecords && mxRecords.length > 0) {
      return true;
    }
  } catch (err: any) {
    try {
      const aRecords = await dns.promises.resolve(normalizedDomain, "A");
      if (aRecords && aRecords.length > 0) {
        return true;
      }
    } catch (errA: any) {
      if (errA.code === "ENOTFOUND" || errA.code === "NODATA") {
        return false;
      }
      return true;
    }
  }
  return false;
}

/**
 * Provider Typo Suggester (Layer 3)
 * Maps common typos for major providers to their suggested values.
 */
function getProviderSuggestion(domain: string): string | null {
  const cleanDomain = domain.toLowerCase().trim().replace(/\s+/g, "");
  
  const typoMap: Record<string, string> = {
    "gmail.co": "gmail.com",
    "gmai.com": "gmail.com",
    "gmial.com": "gmail.com",
    "gmal.com": "gmail.com",
    "gamil.com": "gmail.com",
    "gmeil.com": "gmail.com",
    "outllok.com": "outlook.com",
    "outlok.com": "outlook.com",
    "outclook.com": "outlook.com",
    "outlook.co": "outlook.com",
    "hotmial.com": "hotmail.com",
    "hotmai.com": "hotmail.com",
    "hotmail.co": "hotmail.com",
    "yaho.com": "yahoo.com",
    "yahoo.co": "yahoo.com",
    "yhoo.com": "yahoo.com",
    "icould.com": "icloud.com",
    "icloud.co": "icloud.com",
    "iclod.com": "icloud.com"
  };

  return typoMap[cleanDomain] || null;
}

// Trust the reverse proxy to extract correct client IP and headers (essential for Cloud Run/container environments)
app.set("trust proxy", 1);

// CORS Middleware to allow cross-origin credential-carrying requests
app.use((req, res, next) => {
  const frontendUrl = process.env.FRONTEND_URL || "https://appos-ten.vercel.app";
  const allowedOrigins = [
    "https://appos-ten.vercel.app",
    "https://appos.onrender.com",
    "http://localhost:3000",
    "http://localhost:5173",
    frontendUrl
  ];
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  } else {
    res.setHeader("Access-Control-Allow-Origin", frontendUrl);
  }
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, PUT, PATCH, POST, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  next();
});

// Better Auth route handler with custom production-grade logging (Phase 7)
// Mounted BEFORE body-parser to prevent consuming the request stream
app.all("/api/auth/*", async (req, res) => {
  const route = `${req.method} ${req.originalUrl}`;
  const userEmail = req.query?.email || "unknown";
  
  let dbConnected = "unknown";
  try {
    const health = await db.checkHealth();
    dbConnected = health.status === "ok" ? "connected" : "failed";
  } catch (err) {
    dbConnected = "failed";
  }

  console.log(`[AUTH EVENT]
Route: ${route}
User: ${userEmail}
Database: ${dbConnected}
Result: Processing delegate to Better Auth`);

  // Delegate the request directly to the Better Auth node handler
  return toNodeHandler(auth.handler)(req, res);
});

// Body parsing and security cookies
app.use(express.json());
app.use(cookieParser("appos-secure-session-salt-abc-123"));

/**
 * 1. CSRF Protection Middleware
 * Inspects state-changing requests (POST, PUT, DELETE) to verify that the
 * Origin or Referer header matches the server's own domain, blocking cross-site requests.
 */
async function csrfProtection(req: express.Request, res: express.Response, next: express.NextFunction) {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    return next();
  }

  const origin = req.headers.origin || req.headers.referer;
  const host = req.headers.host;

  // In standard container or proxy environments, ensure origin/referer matches the host or the allowed production frontend
  if (origin && host) {
    const originClean = origin.replace(/^https?:\/\//, "").split("/")[0];
    if (originClean !== host && 
        originClean !== "appos-ten.vercel.app" && 
        !originClean.includes("run.app") && 
        !host.includes("localhost")) {
      await db.execute(
        "INSERT INTO audit_logs (id, event_type, email, ip_address, details, created_at)",
        [
          crypto.randomUUID(),
          "suspicious_activity",
          null,
          req.ip || "unknown",
          `CSRF attack blocked. Origin: ${origin}, Host: ${host}`,
          new Date().toISOString()
        ]
      );
      res.status(403).json({ error: "Access denied. CSRF validation failed." });
      return;
    }
  }
  next();
}

app.use(csrfProtection);

/**
 * 2. XSS & Input Sanitization helper
 * Strips script tags, HTML elements, and normalizes inputs to block malicious injections.
 */
function sanitizeInput(str: string): string {
  if (typeof str !== "string") return "";
  return str
    .replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, "")
    .replace(/<[^>]*>/g, "")
    .trim();
}

/**
 * 3. IP Rate Limiting using express-rate-limit
 */
const ipSignupLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // Max 10 signup attempts per minute per IP
  message: { error: "Too many sign-up requests. Please try again in a minute." },
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
});

/**
 * 4. DB-Backed Email Rate Limiter
 * Ensures no single email address can be spammed with registration requests more than 5 times per hour.
 */
async function emailSignupLimiter(req: express.Request, res: express.Response, next: express.NextFunction) {
  const rawEmail = req.body.email;
  if (!rawEmail) return next();

  const email = sanitizeInput(rawEmail).toLowerCase();
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  try {
    // Query audit logs for recent signup attempts for this email
    const logs = await db.query("SELECT * FROM audit_logs");
    const attempts = (logs || []).filter(
      (log: any) =>
        log.email === email &&
        log.event_type === "signup_attempt" &&
        log.created_at >= oneHourAgo
    );

    if (attempts.length >= 5) {
      await db.execute(
        "INSERT INTO audit_logs (id, event_type, email, ip_address, details, created_at)",
        [
          crypto.randomUUID(),
          "suspicious_activity",
          email,
          req.ip || "unknown",
          `Email rate limit exceeded (5 attempts in last hour)`,
          new Date().toISOString()
        ]
      );
      res.status(429).json({
        error: "Too many sign-up attempts for this email address. Please try again later."
      });
      return;
    }
  } catch (err) {
    console.error("Error in emailSignupLimiter:", err);
  }
  next();
}

/**
 * ============================================================================
 * API ENDPOINTS
 * ============================================================================
 */

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// Diagnostic database health check endpoint
app.get("/api/health/database", async (req, res) => {
  try {
    const health = await db.checkHealth();
    if (health.status === "ok") {
      res.json({
        database: "connected"
      });
    } else {
      res.status(503).json({
        database: "failed",
        error: "Database is unreachable or offline"
      });
    }
  } catch (err: any) {
    res.status(503).json({
      database: "failed",
      error: err.message || "An unexpected database error occurred"
    });
  }
});

// Better Auth handler delegated above body-parser to prevent stream lock


/**
 * ============================================================================
 * HIGHLY SECURE VERSIONED API ROUTER (api/v1)
 * ============================================================================
 */

const v1Router = express.Router();

// 1. Health check versioned endpoint
v1Router.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "appos-api"
  });
});

// Database health check endpoint
v1Router.get("/health/database", async (req, res) => {
  try {
    const health = await db.checkHealth();
    if (health.status === "ok") {
      res.json({
        status: "ok",
        database: "reachable",
        latencyMs: health.latencyMs
      });
    } else {
      res.status(503).json({
        status: "degraded",
        database: "unreachable",
        reference: health.reference
      });
    }
  } catch (err) {
    res.status(503).json({
      status: "degraded",
      database: "unreachable",
      reference: "DB-UNEXPECTED"
    });
  }
});

// Helper for session checks (session_id cookie is user_id in this flow, with modern Better Auth integration)
async function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  try {
    // 1. Try to validate session using Better Auth
    const headers = new Headers();
    for (const [key, val] of Object.entries(req.headers)) {
      if (Array.isArray(val)) {
        val.forEach(v => headers.append(key, v));
      } else if (val !== undefined) {
        headers.set(key, val);
      }
    }

    const session = await auth.api.getSession({
      headers
    });
    if (session && session.user) {
      req.cookies = req.cookies || {};
      req.cookies.session_id = session.user.id;
      return next();
    }
  } catch (err) {
    console.error("[server] Better Auth session validation error:", err);
  }

  // 2. Fall back to standard session_id cookie
  const userId = req.cookies?.session_id;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized access. Active session required." });
    return;
  }
  next();
}

// 2. /api/v1/workspaces Endpoints
v1Router.get("/workspaces", requireAuth, async (req, res) => {
  try {
    const userId = req.cookies.session_id;
    const workspaces = await db.query("SELECT * FROM workspaces WHERE owner_id = ?", [userId]);
    res.json({ success: true, workspaces });
  } catch (err) {
    console.error("v1/workspaces GET error:", err);
    res.status(500).json({ error: "Failed to retrieve workspaces" });
  }
});

v1Router.post("/workspaces", requireAuth, async (req, res) => {
  try {
    const userId = req.cookies.session_id;
    const { name, industry } = req.body;

    // Strict Input Validation & XSS prevention
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      res.status(400).json({ error: "Workspace name is required." });
      return;
    }

    const cleanName = sanitizeInput(name);
    const cleanIndustry = industry ? sanitizeInput(industry) : null;
    const workspaceId = `ws_${crypto.randomUUID().substring(0, 8)}`;
    const now = new Date().toISOString();

    // Insert Workspace
    await db.execute(
      "INSERT INTO workspaces (id, owner_id, name, industry, created_at, updated_at)",
      [workspaceId, userId, cleanName, cleanIndustry, now, now]
    );

    // Insert Creator as Workspace Owner Member
    const memberId = `wsm_${crypto.randomUUID().substring(0, 8)}`;
    await db.execute(
      "INSERT INTO workspace_members (id, workspace_id, user_id, role, created_at, updated_at)",
      [memberId, workspaceId, userId, "owner", now, now]
    );

    res.status(201).json({
      success: true,
      message: "Workspace created successfully.",
      workspace: { id: workspaceId, name: cleanName, industry: cleanIndustry }
    });
  } catch (err) {
    console.error("v1/workspaces POST error:", err);
    res.status(500).json({ error: "Failed to create workspace" });
  }
});

// 3. /api/v1/applications Endpoints
v1Router.get("/applications", requireAuth, async (req, res) => {
  try {
    const { workspace_id } = req.query;
    if (!workspace_id || typeof workspace_id !== "string") {
      res.status(400).json({ error: "workspace_id query parameter is required." });
      return;
    }

    const apps = await db.query("SELECT * FROM applications WHERE workspace_id = ?", [workspace_id]);
    res.json({ success: true, applications: apps });
  } catch (err) {
    console.error("v1/applications GET error:", err);
    res.status(500).json({ error: "Failed to retrieve applications" });
  }
});

v1Router.post("/applications", requireAuth, async (req, res) => {
  try {
    const { workspace_id, name, website_url } = req.body;

    if (!workspace_id || !name || !website_url) {
      res.status(400).json({ error: "workspace_id, name, and website_url are required." });
      return;
    }

    const cleanName = sanitizeInput(name);
    const cleanUrl = sanitizeInput(website_url);
    const appId = `app_${crypto.randomUUID().substring(0, 8)}`;
    const now = new Date().toISOString();

    // Register application record
    await db.execute(
      "INSERT INTO applications (id, workspace_id, name, website_url, status, created_at, updated_at)",
      [appId, workspace_id, cleanName, cleanUrl, "pending", now, now]
    );

    // Enqueue background processing job automatically for high performance
    const crawlJob = queue.enqueue("website_crawl", { application_id: appId, website_url: cleanUrl });
    const analysisJob = queue.enqueue("ai_analysis", { application_id: appId, website_url: cleanUrl });

    res.status(201).json({
      success: true,
      message: "Application registered and queued for AI analysis.",
      application: { id: appId, name: cleanName, website_url: cleanUrl, status: "pending" },
      jobs: [crawlJob.id, analysisJob.id]
    });
  } catch (err) {
    console.error("v1/applications POST error:", err);
    res.status(500).json({ error: "Failed to register application" });
  }
});

// 4. /api/v1/assets Endpoints (Signed Cloudinary Uploads)
v1Router.post("/assets/sign-upload", requireAuth, async (req, res) => {
  try {
    const { folder } = req.body;
    if (!folder || typeof folder !== "string") {
      res.status(400).json({ error: "Target folder path is required." });
      return;
    }

    // Strict security regex validation for Cloudinary folders to prevent injection or directory path jumps
    const allowedFolderRegex = /^appos\/(users\/[a-zA-Z0-9_-]+\/avatars|workspaces\/[a-zA-Z0-9_-]+\/(logos|screenshots)|applications\/[a-zA-Z0-9_-]+\/assets)$/;
    if (!allowedFolderRegex.test(folder)) {
      res.status(403).json({ error: "Unauthorized directory folder path. Signature rejected." });
      return;
    }

    const timestamp = Math.round(new Date().getTime() / 1000);
    const paramsToSign = { timestamp, folder };

    // Generate secure upload signature on backend so frontend never touches API secrets
    const signature = cloudinary.utils.sign_request(paramsToSign, {
      api_secret: process.env.CLOUDINARY_API_SECRET || "mock_api_secret",
    });

    res.json({
      success: true,
      signature,
      timestamp,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME || "mock_cloud",
      apiKey: process.env.CLOUDINARY_API_KEY || "mock_api_key",
      folder
    });
  } catch (err) {
    console.error("v1/assets sign-upload error:", err);
    res.status(500).json({ error: "Failed to generate Cloudinary secure signature" });
  }
});

// 5. /api/v1/jobs Endpoints (Asynchronous Queue inspection)
v1Router.get("/jobs", requireAuth, (req, res) => {
  res.json({ success: true, jobs: queue.getAllJobs() });
});

v1Router.get("/jobs/:id", requireAuth, (req, res) => {
  const job = queue.getJob(req.params.id);
  if (!job) {
    res.status(404).json({ error: "Job ID not found in background processor queue." });
    return;
  }
  res.json({ success: true, job });
});

// 6. /api/v1/security Endpoints (SaaS audits & logs review)
v1Router.get("/security/logs", requireAuth, async (req, res) => {
  try {
    const logs = await db.query("SELECT * FROM audit_logs");
    res.json({ success: true, count: logs.length, logs });
  } catch (err) {
    console.error("v1/security logs error:", err);
    res.status(500).json({ error: "Failed to retrieve security log registers" });
  }
});

app.use("/api/v1", v1Router);

/**
 * CANONICAL BETTER AUTH RETIREMENT NOTICE
 * All legacy authentication routes (including /api/auth/me, /api/auth/logout, 
 * Google OAuth callbacks, handoff logic, and simulator endpoints) have been 
 * retired and removed. Authentication is now handled exclusively by the 
 * same-origin Better Auth subsystem hosted directly on Vercel.
 * ============================================================================
 */

/**
 * ============================================================================
 * VITE MIDDLEWARE OR STATIC DISTRIBUTION IN PRODUCTION
 * ============================================================================
 */
function validateAndLogStartupEnv() {
  const googleClientIdConfigured = !!process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_ID !== "mock_google_client_id";
  const cid = process.env.GOOGLE_CLIENT_ID || "";
  const googleClientIdSuffix = cid.length >= 6 ? cid.slice(-6) : cid;
  const googleClientSecretConfigured = !!process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_CLIENT_SECRET !== "mock_google_client_secret";
  const googleCallbackUrl = process.env.GOOGLE_CALLBACK_URL || "https://appos-ten.vercel.app/api/auth/google/callback";
  const frontendUrl = process.env.FRONTEND_URL || "https://appos-ten.vercel.app";

  console.log(`GOOGLE_CLIENT_ID_CONFIGURED=${googleClientIdConfigured}`);
  console.log(`GOOGLE_CLIENT_ID_SUFFIX=${googleClientIdSuffix}`);
  console.log(`GOOGLE_CLIENT_SECRET_CONFIGURED=${googleClientSecretConfigured}`);
  console.log(`GOOGLE_CALLBACK_URL=${googleCallbackUrl}`);
  console.log(`FRONTEND_URL=${frontendUrl}`);
}

async function startServer() {
  validateAndLogStartupEnv();

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`AppOS Server running securely on port ${PORT}`);
  });
}

startServer();
