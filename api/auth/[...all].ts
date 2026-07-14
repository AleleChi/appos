import { auth } from "../_lib/auth";
import { toNodeHandler } from "better-auth/node";
import { ensureAuthSchema } from "../_lib/db-init";

let isSchemaEnsured = false;

export default async function handler(req: any, res: any) {
  // Ensure the Neon PostgreSQL database has the correct Better Auth tables
  if (!isSchemaEnsured) {
    try {
      await ensureAuthSchema();
      isSchemaEnsured = true;
    } catch (err) {
      console.error("[Vercel CatchAll] Database schema auto-provisioning failure:", err);
    }
  }

  // Delegate processing directly to Better Auth's standard Node/Express adapter
  const nodeHandler = toNodeHandler(auth);
  return nodeHandler(req, res);
}
