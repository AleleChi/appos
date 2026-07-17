import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from "@nestjs/common";
import { Request } from "express";

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

@Injectable()
export class RateLimiterGuard implements CanActivate {
  private tracker = new Map<string, RateLimitRecord>();

  canActivate(context: ExecutionContext): boolean {
    const http = context.switchToHttp();
    const req = http.getRequest<Request>();
    
    // Express req.ip is secure and proxy-aware when 'trust proxy' is enabled
    const ip = req.ip || "unknown-ip";
    const path = req.path || "";
    
    // Determine limit and window based on the endpoint path
    let limit = 100; // Default limit per minute
    let windowMs = 60 * 1000; // 1 minute window
    
    const isAuthAction = 
      path.includes("/sign-up") || 
      path.includes("/signup") ||
      path.includes("/sign-in") || 
      path.includes("/login") ||
      path.includes("/social");
      
    if (isAuthAction) {
      limit = 15; // Max 15 login/signup/OAuth initiation attempts per minute
      windowMs = 60 * 1000;
    } else if (path.includes("/status") || path.includes("/me") || path.includes("/get-session")) {
      limit = 120; // Max 120 session check requests per minute
      windowMs = 60 * 1000;
    }
    
    const trackerKey = `${ip}:${path}`;
    const now = Date.now();
    const record = this.tracker.get(trackerKey);
    
    if (!record) {
      this.tracker.set(trackerKey, {
        count: 1,
        resetTime: now + windowMs
      });
      return true;
    }
    
    if (now > record.resetTime) {
      // Window expired, reset tracker
      record.count = 1;
      record.resetTime = now + windowMs;
      return true;
    }
    
    if (record.count >= limit) {
      throw new HttpException(
        "Too many requests from this IP. Please try again later.",
        HttpStatus.TOO_MANY_REQUESTS
      );
    }
    
    record.count++;
    return true;
  }
}
