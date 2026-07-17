import { Controller, Get, Post, Param, Query, Body, Req, UseGuards, BadRequestException, ForbiddenException, NotFoundException, InternalServerErrorException } from "@nestjs/common";
import { AuthGuard } from "./auth.guard";
import { DbService } from "./db.service";
import { applications, workspace_members, audit_logs } from "../../../src/db/schema";
import { eq, and } from "drizzle-orm";
import { queue } from "../../../src/lib/queue";
import crypto from "crypto";

const sanitizeInput = (val: string): string => {
  if (!val) return "";
  return val.replace(/<[^>]*>/g, "").trim();
};

@Controller()
@UseGuards(AuthGuard)
export class ApplicationsController {
  constructor(private readonly dbService: DbService) {}

  // Verification helper
  private async verifyWorkspaceMembership(userId: string, workspaceId: string): Promise<boolean> {
    const member = await this.dbService.db
      .select()
      .from(workspace_members)
      .where(
        and(
          eq(workspace_members.workspace_id, workspaceId),
          eq(workspace_members.user_id, userId)
        )
      );
    return member.length > 0;
  }

  @Get("api/v1/applications")
  async getApplications(@Query("workspace_id") workspaceId: string, @Req() req: any) {
    const userId = req.user.id;

    if (!workspaceId) {
      throw new BadRequestException("workspace_id query parameter is required.");
    }

    const isMember = await this.verifyWorkspaceMembership(userId, workspaceId);
    if (!isMember) {
      throw new ForbiddenException("You do not have access to this workspace.");
    }

    try {
      const apps = await this.dbService.db
        .select()
        .from(applications)
        .where(eq(applications.workspace_id, workspaceId));

      return { success: true, applications: apps };
    } catch (err: any) {
      console.error("v1/applications GET error:", err);
      throw new InternalServerErrorException("Failed to retrieve applications");
    }
  }

  @Post("api/v1/applications")
  async createApplication(@Body() body: any, @Req() req: any) {
    const userId = req.user.id;
    const { workspace_id, name, website_url } = body;

    if (!workspace_id || !name || !website_url) {
      throw new BadRequestException("workspace_id, name, and website_url are required.");
    }

    const isMember = await this.verifyWorkspaceMembership(userId, workspace_id);
    if (!isMember) {
      throw new ForbiddenException("You do not have access to this workspace.");
    }

    const cleanName = sanitizeInput(name);
    const cleanUrl = sanitizeInput(website_url);
    const appId = `app_${crypto.randomUUID().substring(0, 8)}`;

    try {
      await this.dbService.db.insert(applications).values({
        id: appId,
        workspace_id,
        name: cleanName,
        website_url: cleanUrl,
        status: "pending",
        created_at: new Date(),
        updated_at: new Date(),
      });

      // Enqueue background processing jobs automatically
      const crawlJob = queue.enqueue("website_crawl", { application_id: appId, website_url: cleanUrl });
      const analysisJob = queue.enqueue("ai_analysis", { application_id: appId, website_url: cleanUrl });

      return {
        success: true,
        message: "Application registered and queued for AI analysis.",
        application: { id: appId, name: cleanName, website_url: cleanUrl, status: "pending" },
        jobs: [crawlJob.id, analysisJob.id]
      };
    } catch (err: any) {
      console.error("v1/applications POST error in NestJS:", err);
      throw new InternalServerErrorException("Failed to register application");
    }
  }

  // Legacy route for matching current React frontend calls: POST /api/apps/analyze
  @Post("api/apps/analyze")
  async analyzeLegacy(@Body() body: any, @Req() req: any) {
    const userId = req.user.id;
    const { url, workspace_id, name } = body;

    if (!url || !workspace_id) {
      throw new BadRequestException("URL and workspace ID are required");
    }

    const isMember = await this.verifyWorkspaceMembership(userId, workspace_id);
    if (!isMember) {
      throw new ForbiddenException("You do not have access to this workspace.");
    }

    const appId = `app_${crypto.randomUUID().substring(0, 8)}`;
    const appName = name ? sanitizeInput(name) : (url.replace(/https?:\/\/(www\.)?/, "").split("/")[0] || "My Application");
    const cleanUrl = sanitizeInput(url);

    try {
      await this.dbService.db.insert(applications).values({
        id: appId,
        workspace_id,
        name: appName,
        website_url: cleanUrl,
        status: "pending",
        created_at: new Date(),
        updated_at: new Date()
      });

      // Enqueue actual job processing in the background
      queue.enqueue("website_crawl", { application_id: appId, website_url: cleanUrl });
      queue.enqueue("ai_analysis", { application_id: appId, website_url: cleanUrl });

      return { appId, status: "pending" };
    } catch (err: any) {
      console.error("api/apps/analyze POST error in NestJS:", err);
      throw new InternalServerErrorException("Failed to register legacy application");
    }
  }

  // Legacy route for matching current React frontend calls: GET /api/apps/:id/status
  @Get("api/apps/:id/status")
  async getLegacyStatus(@Param("id") appId: string, @Req() req: any) {
    const userId = req.user.id;

    try {
      const appRecord = await this.dbService.db
        .select()
        .from(applications)
        .where(eq(applications.id, appId))
        .limit(1);

      if (appRecord.length === 0) {
        throw new NotFoundException("App not found");
      }

      const isMember = await this.verifyWorkspaceMembership(userId, appRecord[0].workspace_id);
      if (!isMember) {
        throw new ForbiddenException("You do not have access to this application.");
      }

      return appRecord[0];
    } catch (err: any) {
      if (err instanceof NotFoundException || err instanceof ForbiddenException) {
        throw err;
      }
      console.error("api/apps/:id/status GET error in NestJS:", err);
      throw new InternalServerErrorException("Failed to lookup application status");
    }
  }
}
