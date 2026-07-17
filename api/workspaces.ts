import { Router } from "express";
import { Pool } from "pg";
import { auth } from "./_lib/auth";
import { fromNodeHeaders } from "better-auth/node"; // CRITICAL: Better Auth headers adapter

if (!process.env.DATABASE_URL) {
  throw new Error("FATAL CONFIG: DATABASE_URL environment variable is missing.");
}

const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false
});

const router = Router();

// Helper to strip HTML tags to prevent XSS attacks
const sanitizeInput = (val: string): string => {
  if (!val) return "";
  return val.replace(/<[^>]*>/g, "").trim();
};

router.post("/workspaces", async (req, res) => {
  // CRITICAL: Wrap req.headers with fromNodeHeaders so getSession can parse cookies/bearer tokens
  const session = await auth.api.getSession({ 
    headers: fromNodeHeaders(req.headers) 
  });
  
  if (!session || !session.user) {
    return res.status(401).json({ error: "Unauthorized access: Missing or invalid session credentials" });
  }

  const name = sanitizeInput(req.body.name);
  const industry = sanitizeInput(req.body.industry);
  const rawAccountType = req.body.account_type;
  const rawTeamSize = req.body.team_size;

  if (!name || name.length < 2 || name.length > 100) {
    return res.status(400).json({ error: "Workspace name must be between 2 and 100 characters long" });
  }

  const allowedAccountTypes = ["business", "agency", "developer", "enterprise"];
  const account_type = allowedAccountTypes.includes(rawAccountType) ? rawAccountType : "business";

  const allowedTeamSizes = ["Just me (1)", "2-9 members", "10-49 members", "50+ members"];
  const team_size = allowedTeamSizes.includes(rawTeamSize) ? rawTeamSize : "Just me (1)";

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const workspaceQuery = `
      INSERT INTO workspaces (name, industry, account_type, team_size)
      VALUES ($1, $2, $3, $4)
      RETURNING id
    `;
    const workspaceResult = await client.query(workspaceQuery, [
      name,
      industry || null,
      account_type,
      team_size
    ]);
    const workspaceId = workspaceResult.rows[0].id;

    const memberQuery = `
      INSERT INTO workspace_members (workspace_id, user_id, role)
      VALUES ($1, $2, 'owner')
    `;
    await client.query(memberQuery, [workspaceId, session.user.id]);

    await client.query("COMMIT");
    res.status(201).json({ workspaceId, name });
  } catch (error: any) {
    await client.query("ROLLBACK");
    console.error("Workspace creation failure:", error);
    res.status(500).json({ error: "Internal server error", message: error.message });
  } finally {
    client.release();
  }
});

// GET /api/workspaces endpoint for Route Guard verification
router.get("/workspaces", async (req, res) => {
  const session = await auth.api.getSession({ 
    headers: fromNodeHeaders(req.headers) 
  });

  if (!session || !session.user) {
    return res.status(401).json({ error: "Unauthorized access" });
  }

  const client = await pool.connect();
  try {
    const query = `
      SELECT w.* FROM workspaces w
      JOIN workspace_members wm ON wm.workspace_id = w.id
      WHERE wm.user_id = $1
    `;
    const result = await client.query(query, [session.user.id]);
    res.json(result.rows);
  } catch (error: any) {
    console.error("Fetch workspaces failure:", error);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    client.release();
  }
});

export default router;
