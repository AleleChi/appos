import { Controller, All, Req, Res, Get, UseGuards } from "@nestjs/common";
import * as express from "express";
import { toNodeHandler, fromNodeHeaders } from "better-auth/node";
import { auth } from "./lib/auth";
import { DbService } from "./db.service";
import { RateLimiterGuard } from "./rate-limiter.guard";

@Controller("api/auth")
@UseGuards(RateLimiterGuard)
export class AuthController {
  constructor(private readonly dbService: DbService) {}

  @Get("status")
  async getStatus(@Req() req: express.Request, @Res() res: express.Response) {
    const session = await auth.api.getSession({ 
      headers: fromNodeHeaders(req.headers) 
    });

    if (!session || !session.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    try {
      // Query workspace membership using the canonical pg pool
      const userWorkspaces = await this.dbService.pool.query(
        `SELECT w.id, w.name, wm.role 
         FROM workspaces w
         JOIN workspace_members wm ON w.id = wm.workspace_id
         WHERE wm.user_id = $1
         ORDER BY w.created_at DESC`,
        [session.user.id]
      );

      return res.status(200).json({
        authenticated: true,
        user: session.user,
        workspaces: userWorkspaces.rows || []
      });
    } catch (error: any) {
      console.error("Auth status query failure in NestJS:", error);
      return res.status(200).json({
        authenticated: true,
        user: session.user,
        workspaces: []
      });
    }
  }

  @All("*")
  async handleAuth(@Req() req: express.Request, @Res() res: express.Response) {
    // Inject headers overrides if required by better-auth sandbox setup
    const isSandboxOrLocal = (str: string) => {
      if (!str) return false;
      return (
        str.includes(".run.app") ||
        str.includes(".google.com") ||
        str.includes(".googleusercontent.com") ||
        str.includes("localhost") ||
        str.includes("127.0.0.1")
      );
    };

    const currentOrigin = (req.headers.origin as string) || "";
    if (currentOrigin) {
      req.headers["x-original-origin"] = currentOrigin;
    }
    if (req.headers.referer) {
      req.headers["x-original-referer"] = req.headers.referer;
    }

    if (isSandboxOrLocal(currentOrigin) || isSandboxOrLocal((req.headers.referer as string) || "")) {
      const canonicalUrl = process.env.BETTER_AUTH_URL || "http://localhost:3000";
      req.headers.origin = canonicalUrl;
      req.headers.referer = canonicalUrl;
    }

    // Rewrite aliases for client compatibility
    let rewrittenUrl = req.url || "";
    if (rewrittenUrl) {
      const urlObj = new URL(rewrittenUrl, "http://localhost");
      if (urlObj.pathname === "/signup") {
        rewrittenUrl = "/sign-up/email" + urlObj.search;
      } else if (urlObj.pathname === "/login") {
        rewrittenUrl = "/sign-in/email" + urlObj.search;
      } else if (urlObj.pathname === "/me") {
        rewrittenUrl = "/get-session" + urlObj.search;
      } else if (urlObj.pathname === "/forgot-password") {
        rewrittenUrl = "/password/reset" + urlObj.search;
      }
    }

    const publicUrl = process.env.WEB_APP_URL || process.env.APP_URL || "http://localhost:3000";
    const base = publicUrl.endsWith("/") ? publicUrl.slice(0, -1) : publicUrl;
    let pathAndQuery = rewrittenUrl;
    if (pathAndQuery.startsWith("/api/auth")) {
      pathAndQuery = pathAndQuery.substring("/api/auth".length);
    }
    if (!pathAndQuery.startsWith("/")) {
      pathAndQuery = "/" + pathAndQuery;
    }
    const absoluteUrl = `${base}/api/auth${pathAndQuery}`;

    // Map Express headers to Fetch Headers safely
    const fetchHeaders = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
      if (value !== undefined) {
        if (Array.isArray(value)) {
          for (const val of value) {
            fetchHeaders.append(key, val);
          }
        } else {
          fetchHeaders.set(key, value);
        }
      }
    }

    // Set host same-origin header safely for Fetch API parser validation
    fetchHeaders.set("host", new URL(base).host);

    let body: any = undefined;
    if (req.method !== "GET" && req.method !== "HEAD") {
      if (req.body && typeof req.body === "object") {
        body = JSON.stringify(req.body);
        fetchHeaders.set("content-type", "application/json");
      } else if (req.body) {
        body = req.body;
      }
    }

    try {
      const fetchRequest = new Request(absoluteUrl, {
        method: req.method,
        headers: fetchHeaders,
        body: body,
      });

      const fetchResponse = await auth.handler(fetchRequest);

      res.status(fetchResponse.status);

      // Extract cookies and standard headers
      fetchResponse.headers.forEach((value, name) => {
        if (name.toLowerCase() === "set-cookie") {
          // Skip to handle it explicitly using getSetCookie if available
          if (typeof fetchResponse.headers.getSetCookie !== "function") {
            res.append("Set-Cookie", value);
          }
        } else {
          res.setHeader(name, value);
        }
      });

      if (typeof fetchResponse.headers.getSetCookie === "function") {
        const cookies = fetchResponse.headers.getSetCookie();
        for (const cookie of cookies) {
          res.append("Set-Cookie", cookie);
        }
      }

      const responseText = await fetchResponse.text();
      return res.send(responseText);
    } catch (error: any) {
      console.error("Better Auth Fetch Handler failure inside NestJS:", error);
      return res.status(500).json({ error: "Internal Server Error", message: error.message });
    }
  }
}
