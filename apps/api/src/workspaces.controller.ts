import { Controller, Get, Post, Param, Body, Req, UseGuards, BadRequestException, ForbiddenException, NotFoundException, InternalServerErrorException } from "@nestjs/common";
import { AuthGuard } from "./auth.guard";
import { DbService } from "./db.service";
import { workspaces, workspace_members, audit_logs } from "../../../src/db/schema";
import { eq, and } from "drizzle-orm";
import crypto from "crypto";

// Helper to strip HTML tags to prevent XSS attacks
const sanitizeInput = (val: string): string => {
  if (!val) return "";
  return val.replace(/<[^>]*>/g, "").trim();
};

@Controller()
@UseGuards(AuthGuard)
export class WorkspacesController {
  constructor(private readonly dbService: DbService) {}

  @Post(["api/workspaces", "api/v1/workspaces"])
  async createWorkspace(@Body() body: any, @Req() req: any) {
    const userId = req.user.id;
    const userEmail = req.user.email;

    const name = sanitizeInput(body.name);
    const industry = sanitizeInput(body.industry);

    if (!name || name.length < 2 || name.length > 100) {
      throw new BadRequestException({
        error: {
          code: "VALIDATION_FAILED",
          message: "Workspace name must be between 2 and 100 characters long",
          requestId: crypto.randomUUID()
        }
      });
    }

    const cleanName = sanitizeInput(name);
    const cleanIndustry = industry ? sanitizeInput(industry) : null;
    const workspaceId = `ws_${crypto.randomUUID().substring(0, 8)}`;
    const memberId = `wsm_${crypto.randomUUID().substring(0, 8)}`;
    const auditId = `aud_${crypto.randomUUID().substring(0, 8)}`;

    try {
      // Create workspace and member atomically inside a transaction
      const result = await this.dbService.db.transaction(async (tx) => {
        // 1. Insert Workspace
        await tx.insert(workspaces).values({
          id: workspaceId,
          owner_id: userId,
          name: cleanName,
          industry: cleanIndustry,
          created_at: new Date(),
          updated_at: new Date(),
        });

        // 2. Insert workspace member as owner
        await tx.insert(workspace_members).values({
          id: memberId,
          workspace_id: workspaceId,
          user_id: userId,
          role: "owner",
          created_at: new Date(),
          updated_at: new Date(),
        });

        // 3. Create Audit Log
        await tx.insert(audit_logs).values({
          id: auditId,
          event_type: "workspace created",
          email: userEmail,
          ip_address: req.ip || "127.0.0.1",
          details: `Workspace "${cleanName}" (${workspaceId}) was created by user ${userId}.`,
          created_at: new Date(),
        });

        return { workspaceId, name: cleanName, industry: cleanIndustry };
      });

      return {
        success: true,
        message: "Workspace created successfully.",
        workspace: { id: result.workspaceId, name: result.name, industry: result.industry }
      };
    } catch (error: any) {
      console.error("Workspace creation failure in NestJS:", error);
      throw new InternalServerErrorException({
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create workspace",
          requestId: crypto.randomUUID()
        }
      });
    }
  }

  @Get(["api/workspaces", "api/v1/workspaces"])
  async getWorkspaces(@Req() req: any) {
    const userId = req.user.id;

    try {
      // Fetch workspaces where user is a member
      const userWorkspaces = await this.dbService.db
        .select({
          id: workspaces.id,
          owner_id: workspaces.owner_id,
          name: workspaces.name,
          industry: workspaces.industry,
          created_at: workspaces.created_at,
          updated_at: workspaces.updated_at,
        })
        .from(workspaces)
        .innerJoin(workspace_members, eq(workspaces.id, workspace_members.workspace_id))
        .where(eq(workspace_members.user_id, userId));

      return userWorkspaces;
    } catch (error: any) {
      console.error("Fetch workspaces failure in NestJS:", error);
      throw new InternalServerErrorException({
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve workspaces",
          requestId: crypto.randomUUID()
        }
      });
    }
  }

  @Get(["api/workspaces/:workspaceId", "api/v1/workspaces/:workspaceId"])
  async getWorkspaceById(@Param("workspaceId") workspaceId: string, @Req() req: any) {
    const userId = req.user.id;

    try {
      // Validate workspace membership
      const memberAccess = await this.dbService.db
        .select()
        .from(workspace_members)
        .where(
          and(
            eq(workspace_members.workspace_id, workspaceId),
            eq(workspace_members.user_id, userId)
          )
        );

      if (memberAccess.length === 0) {
        throw new ForbiddenException({
          error: {
            code: "WORKSPACE_ACCESS_DENIED",
            message: "You do not have access to this workspace.",
            requestId: crypto.randomUUID()
          }
        });
      }

      const ws = await this.dbService.db
        .select()
        .from(workspaces)
        .where(eq(workspaces.id, workspaceId))
        .limit(1);

      if (ws.length === 0) {
        throw new NotFoundException({
          error: {
            code: "WORKSPACE_NOT_FOUND",
            message: "The requested workspace was not found.",
            requestId: crypto.randomUUID()
          }
        });
      }

      return {
        success: true,
        workspace: ws[0]
      };
    } catch (error: any) {
      if (error instanceof ForbiddenException || error instanceof NotFoundException) {
        throw error;
      }
      console.error("Fetch workspace by ID failure in NestJS:", error);
      throw new InternalServerErrorException({
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve workspace details",
          requestId: crypto.randomUUID()
        }
      });
    }
  }
}
