import { Injectable, OnModuleInit } from "@nestjs/common";
import { drizzleDb, pool } from "./lib/db-client";
import { workspaces, workspace_members, applications, audit_logs } from "../../../src/db/schema";
import { eq, and } from "drizzle-orm";

@Injectable()
export class DbService implements OnModuleInit {
  public readonly db = drizzleDb;
  public readonly pool = pool;

  async onModuleInit() {
    try {
      if (!this.pool || this.pool.isMock || !process.env.DATABASE_URL) {
        console.warn("NestJS DbService: Running without a physical database connection.");
        return;
      }
      const client = await this.pool.connect();
      client.release();
      console.log("NestJS DbService: Canonical Database Pool verified.");
    } catch (err) {
      console.error("NestJS DbService Error: Database connection failed!", err);
    }
  }

  async checkHealth(): Promise<{ status: string; latencyMs?: number; error?: string }> {
    const start = Date.now();
    try {
      if (!this.pool || this.pool.isMock || !process.env.DATABASE_URL) {
        return { status: "failed", error: "Database unavailable (mock pool or missing DATABASE_URL)" };
      }
      await this.pool.query("SELECT 1");
      return { status: "ok", latencyMs: Date.now() - start };
    } catch (err: any) {
      return { status: "failed", error: err.message || "Unreachable" };
    }
  }
}
