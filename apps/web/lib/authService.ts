/**
 * AppOS Authentication Service Layer
 * Re-implemented as a clean adapter to the Better Auth client.
 */

import { authClient } from "./auth-client";

export interface SignupData {
  email: string;
  password?: string;
  provider?: "email" | "google" | "apple";
  honeypot?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  userCreated?: boolean;
  verificationRequired?: boolean;
}

const FETCH_FAIL_MSG = "We could not reach AppOS. Check your connection and try again.";

function handleError(err: any): AuthResponse {
  console.error("[authService error]", err);
  const errMsg = err?.error?.message || err?.message || "";
  const lower = errMsg.toLowerCase();
  
  if (
    lower.includes("cors") ||
    lower.includes("network") ||
    lower.includes("fetch") ||
    lower.includes("socket") ||
    lower.includes("failed to fetch") ||
    lower.includes("connect") ||
    lower.includes("unavailable") ||
    lower.includes("dns") ||
    lower.includes("502") ||
    lower.includes("503") ||
    lower.includes("504") ||
    lower.includes("econnrefused")
  ) {
    return {
      success: false,
      message: "AppOS sign-in is temporarily unavailable. Please try again in a moment."
    };
  }

  if (
    lower.includes("invalid combination") ||
    lower.includes("user matching error") ||
    lower.includes("invalid_credentials") ||
    lower.includes("invalid credentials") ||
    lower.includes("incorrect password") ||
    lower.includes("invalid password") ||
    lower.includes("invalid email or password") ||
    lower.includes("authentication failed") ||
    lower.includes("invalid email") ||
    lower.includes("credential")
  ) {
    return {
      success: false,
      message: "We couldn’t sign you in with those details. Check your email and password, or create an account."
    };
  }

  if (
    lower.includes("sql unique") ||
    lower.includes("unique index") ||
    lower.includes("already exists") ||
    lower.includes("user_already_exists") ||
    lower.includes("email_already_in_use") ||
    lower.includes("already in use") ||
    lower.includes("email already")
  ) {
    return {
      success: false,
      message: "An account may already exist for this email. Sign in or reset your password."
    };
  }

  return {
    success: false,
    message: "AppOS sign-in is temporarily unavailable. Please try again in a moment."
  };
}

export const authService = {
  /**
   * Submits user signup data to the Better Auth registration pipeline
   */
  async signup(data: SignupData): Promise<AuthResponse> {
    try {
      const email = data.email;
      const password = data.password || "";
      const name = email.split("@")[0];

      console.log(`[AUTH CLIENT] AUTH SIGNUP REQUEST RECEIVED
EMAIL: ${email}
DATABASE: (Database insertion requested via Better Auth API)
BETTER_AUTH: Initiating registration flow`);

      const { data: signUpData, error } = await (authClient as any).signUp.email({
        name,
        email,
        password,
        callbackURL: "/verify-email"
      });

      if (error) {
        console.error(`[AUTH CLIENT] AUTH SIGNUP FAILURE
ERROR TYPE: ${error.status || "signUpError"}
ERROR MESSAGE: ${error.message || "Could not complete signup. Please try again."}`);

        return handleError({ message: error.message || "Could not complete signup. Please try again." });
      }

      console.log(`[AUTH CLIENT] AUTH SIGNUP SUCCESS
USER CREATED: ID: ${signUpData?.user?.id || "N/A"}, Email: ${signUpData?.user?.email || email}
SESSION CREATED: Active session pending verification`);

      return {
        success: true,
        message: "Your AppOS account has been successfully created. Please check your email to verify your address.",
        userCreated: true,
        verificationRequired: true
      };
    } catch (err: any) {
      console.error(`[AUTH CLIENT] AUTH SIGNUP FAILURE
ERROR TYPE: Exception
ERROR MESSAGE: ${err.message || String(err)}`);
      return handleError(err);
    }
  },

  /**
   * Performs user login via Better Auth email provider
   */
  async login(data: { email: string; password?: string }): Promise<AuthResponse> {
    try {
      const { error } = await (authClient as any).signIn.email({
        email: data.email,
        password: data.password || "",
        rememberMe: true,
        callbackURL: "/dashboard"
      });

      if (error) {
        return handleError({ message: error.message || "Credentials were not accepted." });
      }

      return {
        success: true,
        message: "Successfully signed in. Redirecting you..."
      };
    } catch (err: any) {
      return handleError(err);
    }
  },

  /**
   * Fetches details of currently authenticated Better Auth session
   */
  async getMe(): Promise<{ user: any } | null> {
    try {
      const result = await (authClient as any).getSession();
      return {
        user: result.data?.user || null
      };
    } catch (err) {
      return { user: null };
    }
  },

  /**
   * Triggers Better Auth signOut and clears session cookies
   */
  async logout(): Promise<boolean> {
    try {
      await (authClient as any).signOut();
      return true;
    } catch (err) {
      return false;
    }
  },

  /**
   * Triggers password reset email link
   */
  async forgotPassword(email: string): Promise<AuthResponse> {
    try {
      const origin = typeof window !== "undefined" ? window.location.origin : (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000");
      await (authClient as any).forgetPassword({
        email,
        // Force absolute path mapping to ensure redirect lands on the client instead of Render
        redirectTo: origin + "/reset-password",
      }).catch((e: any) => {
        console.warn("Silent forgetPassword error caught for privacy:", e);
      });

      return {
        success: true,
        message: "If an account exists for this email, we’ll send password reset instructions."
      };
    } catch (err) {
      return {
        success: true,
        message: "If an account exists for this email, we’ll send password reset instructions."
      };
    }
  },

  /**
   * Verifies token and changes user password
   */
  async resetPassword(token: string, password?: string): Promise<AuthResponse> {
    try {
      const { error } = await (authClient as any).resetPassword({
        token,
        newPassword: password || ""
      });

      if (error) {
        return {
          success: false,
          message: error.message || "Failed to reset password. The link may have expired."
        };
      }

      return {
        success: true,
        message: "Password has been successfully reset. You can now log in with your new password."
      };
    } catch (err) {
      return handleError(err);
    }
  },

  /**
   * Resends verification email
   */
  async resendVerification(email: string): Promise<AuthResponse> {
    try {
      const originUrl = typeof window !== "undefined" ? window.location.origin : (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000");
      const { error } = await (authClient as any).sendVerificationEmail({
        email,
        callbackURL: `${originUrl}/login?verified=true`
      });

      if (error) {
        return {
          success: false,
          message: error.message || "Failed to resend verification email."
        };
      }

      return {
        success: true,
        message: "Verification email sent successfully."
      };
    } catch (err) {
      return handleError(err);
    }
  },

  /**
   * Securely confirms Google OAuth account linking using official Better Auth client
   */
  async linkGoogle(body: any): Promise<AuthResponse> {
    try {
      const { error } = await (authClient as any).linkSocial({
        provider: "google",
        callbackURL: "/dashboard"
      });

      if (error) {
        return {
          success: false,
          message: error.message || "Failed to link Google account."
        };
      }

      return {
        success: true,
        message: "Google account linked successfully."
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.message || "Failed to link Google account."
      };
    }
  },

  /**
   * Fetches Google OAuth authorization url (legacy fallback)
   */
  async getGoogleUrl(): Promise<{ url: string } | null> {
    return null;
  },

  /**
   * Verifies account email using secure token
   */
  async verifyEmail(token: string): Promise<AuthResponse> {
    try {
      const { error } = await (authClient as any).verifyEmail({
        query: {
          token
        }
      });

      if (error) {
        return {
          success: false,
          message: error.message || "Failed to verify email. The token may be invalid or expired."
        };
      }

      return {
        success: true,
        message: "Email verified successfully! You can now log in."
      };
    } catch (err) {
      return handleError(err);
    }
  }
};
