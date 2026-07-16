import { Router } from "express";
import { auth } from "./_lib/auth";
import { Pool } from "pg";

const router = Router();
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

router.post("/workspaces", async (req, res) => {
  // Try to parse headers to Headers class for better-auth
  const headers = new Headers();
  for (const [key, val] of Object.entries(req.headers)) {
    if (Array.isArray(val)) {
      val.forEach(v => headers.append(key, v));
    } else if (val !== undefined) {
      headers.set(key, val);
    }
  }

  const session = await auth.api.getSession({ headers });
  if (!session || !session.user) {
    return res.status(401).json({ error: "Unauthorized access" });
  }

  const { name, industry, account_type, team_size } = req.body;
  if (!name) {
    return res.status(400).json({ error: "Workspace name is required" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Insert Workspace
    const workspaceQuery = `
      INSERT INTO workspaces (id, name, industry, account_type, team_size, created_at, updated_at)
      VALUES (gen_random_uuid(), $1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING id
    `;
    const workspaceResult = await client.query(workspaceQuery, [
      name,
      industry || null,
      account_type || "business",
      team_size || "1"
    ]);
    const workspaceId = workspaceResult.rows[0].id;

    // Link current user as Owner
    const memberQuery = `
      INSERT INTO workspace_members (workspace_id, user_id, role, joined_at)
      VALUES ($1, $2, 'owner', CURRENT_TIMESTAMP)
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

router.get("/auth/status", async (req, res) => {
  const headers = new Headers();
  for (const [key, val] of Object.entries(req.headers)) {
    if (Array.isArray(val)) {
      val.forEach(v => headers.append(key, v));
    } else if (val !== undefined) {
      headers.set(key, val);
    }
  }

  const session = await auth.api.getSession({ headers });
  if (!session || !session.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    // Check if user has any workspaces
    const query = `
      SELECT w.id, w.name, wm.role 
      FROM workspaces w
      JOIN workspace_members wm ON w.id = wm.workspace_id
      WHERE wm.user_id = $1
      ORDER BY w.created_at DESC
    `;
    const result = await pool.query(query, [session.user.id]);

    res.status(200).json({
      authenticated: true,
      user: session.user,
      workspaces: result.rows
    });
  } catch (error: any) {
    console.error("Auth status query failure:", error);
    res.status(500).json({ error: "Database lookup failed" });
  }
});

export default router;
