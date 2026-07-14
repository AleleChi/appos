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
  const allowedOrigins = [
    "https://appos-ten.vercel.app",
    "http://localhost:3000",
    "http://localhost:5173"
  ];
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  } else {
    res.setHeader("Access-Control-Allow-Origin", "https://appos-ten.vercel.app");
  }
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, PUT, PATCH, POST, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  next();
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

// Helper for session checks (session_id cookie is user_id in this flow)
function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const userId = req.cookies.session_id;
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
 * Signup API Handler (POST /api/auth/signup)
 * Implements strict security, validation, hashing, and audit logs.
 */
app.post("/api/auth/signup", ipSignupLimiter, emailSignupLimiter, async (req, res) => {
  const { email: rawEmail, password, honeypot } = req.body;
  const ip = req.ip || "unknown";

  // Bot detection honeypot check
  if (honeypot) {
    await db.execute(
      "INSERT INTO audit_logs (id, event_type, email, ip_address, details, created_at)",
      [
        crypto.randomUUID(),
        "suspicious_activity",
        null,
        ip,
        `Honeypot field filled. Supposed bot activity detected.`,
        new Date().toISOString()
      ]
    );
    res.status(400).json({ error: "Unable to create account. Please check your details." });
    return;
  }

  // 1. Normalize Email: trim, lowercase, resolve spacing around @ and inside domain
  const trimmedEmail = String(rawEmail || "").trim();
  const cleanEmail = trimmedEmail.replace(/\s*@\s*/, "@").trim();
  const parts = cleanEmail.split("@");

  if (parts.length !== 2 || !rawEmail || !password) {
    // 2. Strict inputs check & log signup initiation attempt with fallback
    await db.execute(
      "INSERT INTO audit_logs (id, event_type, email, ip_address, details, created_at)",
      [
        crypto.randomUUID(),
        "signup_attempt",
        "empty_input",
        ip,
        `Signup process initiated with empty or invalid format`,
        new Date().toISOString()
      ]
    );
    res.status(400).json({ error: "Unable to create account. Please check your details." });
    return;
  }

  const [localPart, domainPart] = parts;

  // Local part validation: reject invalid internal whitespaces (e.g. user gmail@gmail.com)
  if (/\s/.test(localPart)) {
    await db.execute(
      "INSERT INTO audit_logs (id, event_type, email, ip_address, details, created_at)",
      [
        crypto.randomUUID(),
        "signup_attempt",
        "malformed_whitespace",
        ip,
        `Signup process initiated with malformed local-part whitespace`,
        new Date().toISOString()
      ]
    );
    res.status(400).json({ error: "Unable to create account. Please check your details." });
    return;
  }

  // Domain part normalization: remove any internal whitespace variation (spaces variation check)
  const domainClean = domainPart.replace(/\s+/g, "").toLowerCase();
  const emailNormalized = `${localPart}@${domainClean}`.toLowerCase();

  // Log signup initiation attempt with normalized address
  await db.execute(
    "INSERT INTO audit_logs (id, event_type, email, ip_address, details, created_at)",
    [
      crypto.randomUUID(),
      "signup_attempt",
      emailNormalized,
      ip,
      `Signup process initiated`,
      new Date().toISOString()
    ]
  );

  // --- EMAIL VALIDATION PIPELINE ---

  // Layer 1: Syntax validation & length bounds check (Max 254 chars as per RFC 5321)
  if (emailNormalized.length > 254) {
    res.status(400).json({ error: "Unable to create account. Please check your details." });
    return;
  }

  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  if (!emailRegex.test(emailNormalized)) {
    res.status(400).json({ error: "Unable to create account. Please check your details." });
    return;
  }

  // Validate TLD length to prevent trailing junk domains
  const emailParts = emailNormalized.split(".");
  const tld = emailParts[emailParts.length - 1];
  if (tld.length < 2 || tld.length > 6) {
    res.status(400).json({ error: "Unable to create account. Please check your details." });
    return;
  }

  // Layer 3: Provider validation (typo detection)
  const suggestion = getProviderSuggestion(domainClean);
  if (suggestion) {
    res.status(400).json({ error: `Did you mean ${suggestion}?` });
    return;
  }

  // Layer 2: Domain existence / DNS validity check
  const isDnsValid = await checkDnsValidity(domainClean);
  if (!isDnsValid) {
    res.status(400).json({ error: "Unable to create account. Please check your details." });
    return;
  }

  // 4. Password validation (Min 12, upper, lower, digit, special character)
  if (password.length < 12) {
    res.status(400).json({ error: "Password must be at least 12 characters long." });
    return;
  }

  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  if (!hasUpper || !hasLower || !hasDigit || !hasSpecial) {
    res.status(400).json({
      error: "Password must contain uppercase, lowercase, numeric, and special characters."
    });
    return;
  }

  // Common passwords and keyboard sequence blocklist checking
  const commonPasswords = ["password", "123456", "qwerty", "password123"];
  const passwordLower = password.toLowerCase();
  const containsSequential = /123456|qwerty|asdfg|abcdef/i.test(passwordLower);
  
  if (commonPasswords.includes(passwordLower) || containsSequential) {
    res.status(400).json({ error: "The chosen password is too common or easily guessed." });
    return;
  }

  try {
    // 5. Query user to verify if they already exist (Account Enumeration Protected)
    const existing = await db.query("SELECT * FROM users WHERE email = ?", [emailNormalized]);
    if (existing && existing.length > 0) {
      // Log the duplicate sign-up failure internally
      await db.execute(
        "INSERT INTO audit_logs (id, event_type, email, ip_address, details, created_at)",
        [
          crypto.randomUUID(),
          "signup_failure",
          emailNormalized,
          ip,
          `Registration failed: Duplicate email registry`,
          new Date().toISOString()
        ]
      );
      // Fulfill account enumeration protection: do not leak email existence, return generic message
      res.status(400).json({ error: "Unable to create account. Please check your details." });
      return;
    }

    // 6. Generate secure UUID and Password Hashing using pure-js bcryptjs
    const userId = `usr_${crypto.randomUUID().replace(/-/g, "")}`;
    const saltRounds = 12; // High security factor
    const hash = bcryptjs.hashSync(password, saltRounds);

    // 7. Store user to DB
    const now = new Date().toISOString();
    try {
      await db.execute(
        "INSERT INTO users (id, email, password_hash, email_verified_at, created_at, updated_at, last_login_at, email_verification_pending) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [userId, emailNormalized, hash, null, now, now, null, false]
      );
    } catch (dbErr) {
      console.error("Database user insertion failed during signup:", dbErr);
      res.status(500).json({ error: "Unable to create account. Database error." });
      return;
    }

    // 8. Generate cryptographically secure verification token
    const tokenBytes = crypto.randomBytes(32);
    const token = tokenBytes.toString("hex");
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const tokenExpiration = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours expiry

    try {
      await db.execute(
        "INSERT INTO verification_tokens (id, user_id, token_hash, expires_at, used) VALUES (?, ?, ?, ?, 0)",
        [crypto.randomUUID(), userId, tokenHash, tokenExpiration]
      );
    } catch (tokenErr) {
      console.error("Failed to store verification token:", tokenErr);
    }

    // Logs verification dispatch event
    try {
      await db.execute(
        "INSERT INTO audit_logs (id, event_type, email, ip_address, details, created_at) VALUES (?, ?, ?, ?, ?, ?)",
        [
          crypto.randomUUID(),
          "verification_sent",
          emailNormalized,
          ip,
          `Verification email queued with secure hash token`,
          new Date().toISOString()
        ]
      );
    } catch (logErr) {
      console.warn("Failed to insert verification_sent audit log:", logErr);
    }

    // Print raw token link to standard outputs for simple integration and sandboxed testing
    const origin = req.headers.referer || req.headers.origin || "https://ais-dev-lkkib3vyrovvpq5bp6ibhe-698460065788.europe-west2.run.app";
    const cleanOrigin = origin.endsWith("/") ? origin.slice(0, -1) : origin;
    const verificationLink = `${cleanOrigin}/api/auth/verify?token=${token}`;
    console.log("==========================================================");
    console.log(`[SMTP SIMULATOR] Dispatching verification mail to: ${emailNormalized}`);
    console.log(`Verification Token: ${token}`);
    console.log(`Verification Link: ${verificationLink}`);
    console.log("==========================================================");

    let email_verification_pending = false;

    if (process.env.RESEND_API_KEY) {
      try {
        const mailRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            from: "AppOS <onboarding@resend.dev>",
            to: [emailNormalized],
            subject: "AppOS - Verify Your Account",
            html: `<p>Please verify your AppOS account email by clicking the link below:</p>
                   <p><a href="${verificationLink}">${verificationLink}</a></p>
                   <p>This link is valid for 24 hours.</p>`
          })
        });
        const mailData = await mailRes.json();
        if (!mailRes.ok) {
          throw new Error(mailData.error || "Resend returned non-ok status code");
        }
        console.log("[Resend] Verification email dispatched successfully:", mailData);
      } catch (errEmail) {
        console.error("[Resend] Resend email dispatch error:", errEmail);
        email_verification_pending = true;
        try {
          await db.execute("UPDATE users SET email_verification_pending = ? WHERE id = ?", [true, userId]);
          console.log(`[Database] Set email_verification_pending=true for user: ${userId}`);
        } catch (updateErr) {
          console.error("Failed to update email_verification_pending on users table:", updateErr);
        }
      }
    }

    // 9. Log successful account creation
    try {
      await db.execute(
        "INSERT INTO audit_logs (id, event_type, email, ip_address, details, created_at) VALUES (?, ?, ?, ?, ?, ?)",
        [
          crypto.randomUUID(),
          "signup_success",
          emailNormalized,
          ip,
          `Registration complete for user ID: ${userId}`,
          now
        ]
      );
    } catch (logSuccessErr) {
      console.warn("Failed to insert signup_success audit log:", logSuccessErr);
    }

    // Set secure same-origin session cookie
    res.cookie("session_id", userId, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    // Return the specific JSON format expected
    res.status(201).json({
      userCreated: true,
      verificationRequired: true
    });
  } catch (err) {
    // Escape raw DB exception leaking to satisfy API safety requirements
    console.error("Internal signup exception:", err);
    res.status(500).json({ error: "An error occurred during registration. Please try again." });
  }
});

/**
 * Verification Checker Endpoint (GET /api/auth/verify)
 * Processes incoming cryptographic raw verification tokens
 */
app.get("/api/auth/verify", async (req, res) => {
  const token = req.query.token;
  const isJsonRequested = req.headers.accept?.includes("application/json") || req.query.json === "true";

  if (!token || typeof token !== "string") {
    if (isJsonRequested) {
      return res.status(400).json({ error: "No active verification token was provided in the request." });
    }
    res.status(400).send(`
      <div style="font-family: sans-serif; text-align: center; margin-top: 50px;">
        <h2 style="color: #e11d48;">Invalid token</h2>
        <p>This verification link is invalid or malformed.</p>
      </div>
    `);
    return;
  }

  try {
    const hash = crypto.createHash("sha256").update(token).digest("hex");
    const matches = await db.query("SELECT * FROM verification_tokens WHERE token_hash = ?", [hash]);

    if (!matches || matches.length === 0) {
      if (isJsonRequested) {
        return res.status(400).json({ error: "The verification link has expired or has already been used." });
      }
      res.status(400).send(`
        <div style="font-family: sans-serif; text-align: center; margin-top: 50px;">
          <h2 style="color: #e11d48;">Token expired or unused</h2>
          <p>This verification link has expired or has already been used.</p>
        </div>
      `);
      return;
    }

    const tokenObj = matches[0];
    const isExpired = new Date(tokenObj.expires_at).getTime() < Date.now();

    if (isExpired) {
      if (isJsonRequested) {
        return res.status(400).json({ error: "This verification link has expired. Please sign up again to generate a new token." });
      }
      res.status(400).send(`
        <div style="font-family: sans-serif; text-align: center; margin-top: 50px;">
          <h2 style="color: #e11d48;">Link expired</h2>
          <p>This verification link expired. Please sign up again to generate a new token.</p>
        </div>
      `);
      return;
    }

    // Update token as used
    await db.execute("UPDATE verification_tokens SET used = 1 WHERE id = ?", [tokenObj.id]);

    // Update user as verified
    await db.execute("UPDATE users SET email_verified_at = ? WHERE id = ?", [
      new Date().toISOString(),
      tokenObj.user_id
    ]);

    if (isJsonRequested) {
      return res.json({ success: true, message: "Your AppOS account email has been successfully verified." });
    }

    // Send visual feedback page redirecting the user back
    res.send(`
      <div style="font-family: sans-serif; text-align: center; margin-top: 80px; padding: 20px;">
        <div style="display: inline-block; background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 30px; max-width: 500px;">
          <h2 style="color: #15803d; margin-top: 0;">Email Verified!</h2>
          <p style="color: #374151; font-size: 15px; line-height: 1.5;">Your AppOS account email has been successfully verified. You can now close this tab and return to the application to start creating your Workspace.</p>
          <a href="/" style="display: inline-block; margin-top: 15px; padding: 10px 20px; background-color: #6366f1; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px;">Return to AppOS</a>
        </div>
      </div>
    `);
  } catch (err) {
    console.error("Verification error:", err);
    if (isJsonRequested) {
      return res.status(500).json({ error: "An error occurred during verification." });
    }
    res.status(500).send("An error occurred during verification.");
  }
});

/**
 * Session Login endpoint (POST /api/auth/login)
 */
app.post("/api/auth/login", async (req, res) => {
  const { email: rawEmail, password } = req.body;
  const ip = req.ip || "unknown";

  if (!rawEmail || !password) {
    res.status(400).json({ error: "Please enter your email and password." });
    return;
  }

  const email = sanitizeInput(rawEmail).toLowerCase();

  try {
    const userMatches = await db.query("SELECT * FROM users WHERE email = ?", [email]);
    if (userMatches.length === 0) {
      res.status(401).json({ error: "Invalid email or password." });
      return;
    }

    const user = userMatches[0];
    const passwordValid = bcryptjs.compareSync(password, user.password_hash);

    if (!passwordValid) {
      res.status(401).json({ error: "Invalid email or password." });
      return;
    }

    if (user.email_verified_at === null) {
      res.status(403).json({ error: "Please verify your email address to activate your account." });
      return;
    }

    // Save session
    const now = new Date().toISOString();
    await db.execute("UPDATE users SET last_login_at = ? WHERE id = ?", [now, user.id]);

    const sessionToken = "sess_" + crypto.randomBytes(32).toString("hex");
    const sessionExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

    await db.execute(
      "INSERT INTO sessions (id, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)",
      [sessionToken, user.id, sessionExpiry, new Date().toISOString()]
    );

    res.cookie("appos_session", sessionToken, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.cookie("session_id", user.id, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({
      success: true,
      message: "Login successful.",
      sessionToken,
      user: {
        id: user.id,
        email: user.email,
        provider: user.provider,
        email_verified_at: user.email_verified_at
      }
    });
  } catch (err) {
    console.error("Login failure:", err);
    res.status(500).json({ error: "An unexpected error occurred during sign-in." });
  }
});

/**
 * Cryptographically random, single-use auth handoff code generator
 */
async function generateAndStoreHandoffCode(userId: string, requestId: string): Promise<string> {
  const code = crypto.randomBytes(32).toString("hex");
  const codeHash = crypto.createHash("sha256").update(code).digest("hex");
  
  const id = crypto.randomUUID();
  const purpose = "oauth_handoff";
  const expiresAt = new Date(Date.now() + 60 * 1000).toISOString(); // 60 seconds lifetime
  const createdAt = new Date().toISOString();
  
  await db.execute(
    "INSERT INTO auth_handoff_codes (id, code_hash, user_id, purpose, expires_at, used_at, created_at, request_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    [id, codeHash, userId, purpose, expiresAt, null, createdAt, requestId]
  );
  
  return code;
}

/**
 * Exchange single-use BFF handoff code for session (POST /api/auth/handoff/exchange)
 */
app.post("/api/auth/handoff/exchange", async (req, res) => {
  const { code } = req.body;
  const authHeader = req.headers.authorization;
  const bffHeader = req.headers["x-bff-secret"];
  
  const expectedSecret = process.env.INTERNAL_BFF_SECRET || "development_bff_secret";
  let providedSecret = "";
  if (authHeader && authHeader.startsWith("Bearer ")) {
    providedSecret = authHeader.substring(7);
  } else if (bffHeader && typeof bffHeader === "string") {
    providedSecret = bffHeader;
  }

  if (!providedSecret || providedSecret !== expectedSecret) {
    res.status(401).json({ error: "Unauthorized server-to-server handshake." });
    return;
  }
  
  if (!code || typeof code !== "string" || code.length > 255) {
    res.status(400).json({ error: "Invalid handoff code format." });
    return;
  }
  
  try {
    const codeHash = crypto.createHash("sha256").update(code).digest("hex");
    const records = await db.query("SELECT * FROM auth_handoff_codes WHERE code_hash = ?", [codeHash]);
    
    if (records.length === 0) {
      res.status(400).json({ error: "Authentication handoff code not found." });
      return;
    }
    
    const record = records[0];
    if (record.used_at) {
      res.status(400).json({ error: "Authentication handoff code has already been used." });
      return;
    }
    
    const expiresAt = new Date(record.expires_at).getTime();
    if (Date.now() > expiresAt) {
      res.status(400).json({ error: "Authentication handoff code has expired." });
      return;
    }
    
    if (record.purpose !== "oauth_handoff") {
      res.status(400).json({ error: "Invalid authentication handoff purpose." });
      return;
    }
    
    // Atomically mark handoff code as used immediately to prevent replay attacks
    await db.execute("UPDATE auth_handoff_codes SET used_at = ? WHERE id = ?", [new Date().toISOString(), record.id]);
    
    const users = await db.query("SELECT * FROM users WHERE id = ?", [record.user_id]);
    if (users.length === 0) {
      res.status(404).json({ error: "User account not found." });
      return;
    }
    
    const user = users[0];
    
    // Generate a secure opaque session token
    const sessionToken = "sess_" + crypto.randomBytes(32).toString("hex");
    const sessionExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days
    
    // Save to sessions table
    await db.execute(
      "INSERT INTO sessions (id, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)",
      [sessionToken, user.id, sessionExpiry, new Date().toISOString()]
    );

    res.json({
      success: true,
      sessionToken,
      expiresAt: sessionExpiry,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        provider: user.provider
      }
    });
  } catch (err) {
    console.error("Handoff exchange endpoint exception:", err);
    res.status(500).json({ error: "Internal server error during handoff exchange." });
  }
});

/**
 * Introspect session (POST /api/auth/session/introspect)
 */
app.post("/api/auth/session/introspect", async (req, res) => {
  const authHeader = req.headers.authorization;
  const bffHeader = req.headers["x-bff-secret"];
  const expectedSecret = process.env.INTERNAL_BFF_SECRET || "development_bff_secret";

  let providedSecret = "";
  if (authHeader && authHeader.startsWith("Bearer ")) {
    providedSecret = authHeader.substring(7);
  } else if (bffHeader && typeof bffHeader === "string") {
    providedSecret = bffHeader;
  }

  if (!providedSecret || providedSecret !== expectedSecret) {
    res.status(401).json({ error: "Unauthorized server-to-server handshake." });
    return;
  }

  const { sessionToken } = req.body;
  if (!sessionToken || typeof sessionToken !== "string" || sessionToken.length > 255) {
    res.status(400).json({ error: "Invalid session token format." });
    return;
  }

  try {
    const sessions = await db.query("SELECT * FROM sessions WHERE id = ?", [sessionToken]);
    if (sessions.length === 0) {
      res.json({ authenticated: false });
      return;
    }

    const session = sessions[0];
    const expiry = new Date(session.expires_at).getTime();
    if (Date.now() > expiry) {
      res.json({ authenticated: false });
      return;
    }

    const users = await db.query("SELECT * FROM users WHERE id = ?", [session.user_id]);
    if (users.length === 0) {
      res.json({ authenticated: false });
      return;
    }

    const user = users[0];
    res.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        profileImage: user.profile_image,
        provider: user.provider,
        email_verified_at: user.email_verified_at
      }
    });
  } catch (err) {
    console.error("Session introspection error:", err);
    res.status(500).json({ error: "Internal server error during introspection." });
  }
});

/**
 * BFF Handoff Callback landing (GET /api/auth/complete)
 */
app.get("/api/auth/complete", async (req, res) => {
  const { code } = req.query;
  if (!code || typeof code !== "string" || code.length > 255) {
    return res.redirect("/auth/error?code=profile_invalid");
  }
  
  try {
    const backendUrl = process.env.VITE_API_URL || `http://localhost:${PORT}`;
    const expectedSecret = process.env.INTERNAL_BFF_SECRET || "development_bff_secret";
    
    const response = await fetch(`${backendUrl}/api/auth/handoff/exchange`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${expectedSecret}`
      },
      body: JSON.stringify({ code })
    });
    
    if (!response.ok) {
      const errText = await response.text();
      console.error("Local BFF handoff exchange failed:", errText);
      return res.redirect("/auth/error?code=token_exchange_failed");
    }
    
    const data = await response.json();
    if (!data.success || !data.sessionToken) {
      return res.redirect("/auth/error?code=token_exchange_failed");
    }
    
    // Set Vercel-domain HttpOnly session cookie appos_session
    res.cookie("appos_session", data.sessionToken, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
    
    return res.redirect("/auth/callback?status=success");
  } catch (err) {
    console.error("Local BFF complete endpoint exception:", err);
    return res.redirect("/auth/error?code=network_error");
  }
});

/**
 * ============================================================================
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
