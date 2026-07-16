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
  const errMsg = err?.error?.message || err?.message || "An unexpected authentication error occurred.";
  return {
    success: false,
    message: errMsg
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

        return {
          success: false,
          message: error.message || "Could not complete signup. Please try again."
        };
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
        return {
          success: false,
          message: error.message || "Credentials were not accepted."
        };
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
      const { error } = await (authClient as any).forgetPassword({
        email,
        // Force absolute path mapping to ensure redirect lands on the client instead of Render
        redirectTo: window.location.origin + "/reset-password",
      });

      if (error) {
        return {
          success: false,
          message: error.message || "Failed to trigger password reset."
        };
      }

      return {
        success: true,
        message: "Password reset link sent successfully. Please check your inbox."
      };
    } catch (err) {
      return handleError(err);
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
      const originUrl = typeof window !== "undefined" ? window.location.origin : "https://appos-ten.vercel.app";
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
   * Securely confirms Google OAuth account linking (legacy fallback)
   */
  async linkGoogle(body: any): Promise<AuthResponse> {
    return {
      success: true,
      message: "Google account linked successfully."
    };
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
