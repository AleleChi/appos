import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../../../api/_lib/auth";

@Injectable()
export class AuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    try {
      // Validate session via Better Auth
      const headers = fromNodeHeaders(request.headers);
      const session = await auth.api.getSession({ headers });

      if (session && session.user) {
        request.user = session.user;
        request.session = session;
        return true;
      }
    } catch (err) {
      console.error("AuthGuard session validation failure:", err);
    }

    throw new UnauthorizedException("Unauthorized access. Active session required.");
  }
}
