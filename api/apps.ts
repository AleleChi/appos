import { Router } from "express";
import { auth } from "./_lib/auth";
import { Pool } from "pg";
import { fromNodeHeaders } from "better-auth/node";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "FATAL DATABASE CONFIGURATION ERROR: 'DATABASE_URL' environment variable is missing. " +
    "Verify environment variables in your Render service dashboard."
  );
}

const router = Router();
// Instantiate database pool safely
const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false
});

// Mock deep scanner background job
const runBackgroundAnalysis = async (appId: string) => {
  const steps = [
    { status: 'analyzing_structure', pages: 12, assets: 4, score: 30 },
    { status: 'analyzing_navigation', pages: 24, assets: 12, score: 65 },
    { status: 'extracting_assets', pages: 24, assets: 18, score: 85 },
    { status: 'completed', pages: 24, assets: 18, score: 92 }
  ];

  for (const step of steps) {
    await new Promise((resolve) => setTimeout(resolve, 2500)); // 2.5s per pipeline state
    await pool.query(
      `UPDATE apps 
       SET status = $1, pages_count = $2, assets_count = $3, mobile_readiness = $4, updated_at = NOW() 
       WHERE id = $5`,
      [step.status, step.pages, step.assets, step.score, appId]
    );
  }
};

router.post("/api/apps/analyze", async (req, res) => {
  const session = await auth.api.getSession({ 
    headers: fromNodeHeaders(req.headers) 
  });
  if (!session || !session.user) return res.status(401).json({ error: "Unauthorized" });

  const { url, workspace_id } = req.body;
  if (!url || !workspace_id) return res.status(400).json({ error: "URL and workspace ID are required" });

  try {
    const insertResult = await pool.query(
      `INSERT INTO apps (workspace_id, url, status) VALUES ($1, $2, 'pending') RETURNING id`,
      [workspace_id, url]
    );
    const appId = insertResult.rows[0].id;

    // Trigger asynchronous background scan thread
    runBackgroundAnalysis(appId).catch(err => console.error("Async analysis crashed:", err));

    res.status(202).json({ appId, status: "pending" });
  } catch (error: any) {
    res.status(500).json({ error: "Database registration failed", message: error.message });
  }
});

router.get("/api/apps/:id/status", async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM apps WHERE id = $1`, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: "App not found" });
    res.status(200).json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: "Database lookup failed" });
  }
});

export default router;
