import { Controller, Get, Res, ServiceUnavailableException, Inject } from "@nestjs/common";
import { Response } from "express";
import { DbService } from "./db.service";

@Controller()
export class HealthController {
  constructor(@Inject(DbService) private readonly dbService: DbService) {}

  @Get(["api/health", "api/v1/health"])
  getGeneralHealth() {
    return { status: "ok", time: new Date().toISOString() };
  }

  @Get("api/health/live")
  getLive() {
    return { status: "live", service: "appos-api" };
  }

  @Get("api/health/ready")
  async getReady() {
    const dbHealth = await this.dbService.checkHealth();
    if (dbHealth.status !== "ok") {
      throw new ServiceUnavailableException({ status: "not_ready", db: "offline" });
    }
    return { status: "ready", service: "appos-api", db: "online" };
  }

  @Get(["api/health/database", "api/v1/health/database"])
  async getDatabaseHealth() {
    const health = await this.dbService.checkHealth();
    if (health.status === "ok") {
      return {
        status: "ok",
        database: "reachable",
        latencyMs: health.latencyMs
      };
    } else {
      throw new ServiceUnavailableException({
        status: "degraded",
        database: "unreachable",
        error: health.error
      });
    }
  }
}
