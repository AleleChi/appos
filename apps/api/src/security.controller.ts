import { Controller, Get, UseGuards, InternalServerErrorException } from "@nestjs/common";
import { AuthGuard } from "./auth.guard";
import { DbService } from "./db.service";
import { audit_logs } from "../../../src/db/schema";
import { desc } from "drizzle-orm";

@Controller("api/v1/security")
@UseGuards(AuthGuard)
export class SecurityController {
  constructor(private readonly dbService: DbService) {}

  @Get("logs")
  async getLogs() {
    try {
      const logs = await this.dbService.db
        .select()
        .from(audit_logs)
        .orderBy(desc(audit_logs.created_at))
        .limit(100);

      return { success: true, count: logs.length, logs };
    } catch (err: any) {
      console.error("logs GET error in NestJS:", err);
      throw new InternalServerErrorException("Failed to retrieve security logs");
    }
  }
}
