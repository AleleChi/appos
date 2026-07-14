/**
 * AppOS Authentication Service Layer
 * Prepared for real API integration with backend endpoints
 */

import { AUTH_ENDPOINTS, API_URL } from "../config/api";

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

/**
 * Standard HTTP error mapper to translate technical errors into human-friendly, secure messages.
 */
async function mapResponseError(response: Response): Promise<string> {
  try {
    const result = await response.json().catch(() => ({}));
    if (response.status === 400) {
      return result.error || "Please check your input details and try again.";
    }
    if (response.status === 401) {
      return "Credentials were not accepted.";
    }
    if (response.status === 409) {
      return "Unable to create this account. Try signing in instead.";
    }
    if (response.status === 429) {
      return "Too many attempts. Please wait before trying again.";
    }
    if (response.status === 500) {
      return "AppOS could not complete the request.";
    }
    if (response.status === 502 || response.status === 503) {
      return "AppOS is temporarily unavailable.";
    }
    return result.error || "An unexpected error occurred.";
  } catch (err) {
    return "AppOS could not complete the request.";
  }
}

const FETCH_FAIL_MSG = "We could not reach AppOS. Check your connection and try again.";

export const authService = {
  /**
   * Submits user signup data to the registration pipeline
   * @param data The user credentials and signup method
   */
  async signup(data: SignupData): Promise<AuthResponse> {
    try {
      const response = await fetch(AUTH_ENDPOINTS.signup, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorMsg = await mapResponseError(response);
        return {
          success: false,
          message: errorMsg
        };
      }

      const result = await response.json();
      return {
        success: true,
        message: "Your AppOS account has been successfully created. Please check your email to verify your address.",
        userCreated: result.userCreated,
        verificationRequired: result.verificationRequired
      };
    } catch (err) {
      return {
        success: false,
        message: FETCH_FAIL_MSG
      };
    }
  },

  /**
   * Performs real user login requests
   */
  async login(data: { email: string; password?: string }): Promise<AuthResponse> {
    try {
      const response = await fetch(AUTH_ENDPOINTS.login, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorMsg = await mapResponseError(response);
        return {
          success: false,
          message: errorMsg
        };
      }

      return {
        success: true,
        message: "Successfully signed in. Redirecting you..."
      };
    } catch (err) {
      return {
        success: false,
        message: FETCH_FAIL_MSG
      };
    }
  },

  /**
   * Fetches details of currently authenticated user session
   */
  async getMe(): Promise<{ user: any } | null> {
    try {
      const response = await fetch(AUTH_ENDPOINTS.me, {
        credentials: "include"
      });
      if (!response.ok) return { user: null };
      return await response.json();
    } catch (err) {
      return { user: null };
    }
  },

  /**
   * Clears session cookie and logs out
   */
  async logout(): Promise<boolean> {
    try {
      const response = await fetch(AUTH_ENDPOINTS.logout, {
        method: "POST",
        credentials: "include"
      });
      return response.ok;
    } catch (err) {
      return false;
    }
  },

  /**
   * Triggers password reset email link
   */
  async forgotPassword(email: string): Promise<AuthResponse> {
    try {
      const response = await fetch(AUTH_ENDPOINTS.forgotPassword, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email })
      });
      if (!response.ok) {
        const errorMsg = await mapResponseError(response);
        return { success: false, message: errorMsg };
      }
      const result = await response.json();
      return { success: true, message: result.message };
    } catch (err) {
      return { success: false, message: FETCH_FAIL_MSG };
    }
  },

  /**
   * Verifies token and changes user password
   */
  async resetPassword(token: string, password?: string): Promise<AuthResponse> {
    try {
      const response = await fetch(AUTH_ENDPOINTS.resetPassword, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ token, password })
      });
      if (!response.ok) {
        const errorMsg = await mapResponseError(response);
        return { success: false, message: errorMsg };
      }
      const result = await response.json();
      return { success: true, message: result.message };
    } catch (err) {
      return { success: false, message: FETCH_FAIL_MSG };
    }
  },

  /**
   * Resends verification email
   */
  async resendVerification(email: string): Promise<AuthResponse> {
    try {
      const response = await fetch(AUTH_ENDPOINTS.resendVerification, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email })
      });
      if (!response.ok) {
        const errorMsg = await mapResponseError(response);
        return { success: false, message: errorMsg };
      }
      const result = await response.json();
      return { success: true, message: result.message };
    } catch (err) {
      return { success: false, message: FETCH_FAIL_MSG };
    }
  },

  /**
   * Securely confirms Google OAuth account linking
   */
  async linkGoogle(body: any): Promise<AuthResponse> {
    try {
      const response = await fetch(AUTH_ENDPOINTS.linkGoogle, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body)
      });
      if (!response.ok) {
        const errorMsg = await mapResponseError(response);
        return { success: false, message: errorMsg };
      }
      const result = await response.json();
      return { success: true, message: result.message };
    } catch (err) {
      return { success: false, message: FETCH_FAIL_MSG };
    }
  },

  /**
   * Fetches Google OAuth authorization url
   */
  async getGoogleUrl(): Promise<{ url: string } | null> {
    try {
      const response = await fetch(`${API_URL}/api/auth/google/url`, {
        credentials: "include"
      });
      if (!response.ok) return null;
      return await response.json();
    } catch (err) {
      return null;
    }
  },

  /**
   * Verifies account email using secure cryptographic token
   */
  async verifyEmail(token: string): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_URL}/api/auth/verify?token=${encodeURIComponent(token)}&json=true`, {
        headers: { "Accept": "application/json" },
        credentials: "include"
      });
      if (!response.ok) {
        const errorMsg = await mapResponseError(response);
        return { success: false, message: errorMsg };
      }
      const result = await response.json();
      return { success: true, message: result.message || "Email verified successfully!" };
    } catch (err) {
      return { success: false, message: "A network error occurred during verification." };
    }
  }
};
