import React, { useEffect, useState, useRef } from "react";
import { motion } from "motion/react";
import { Loader2, ShieldCheck, ShieldAlert, ArrowRight, Lock, Mail, CheckCircle, AlertTriangle } from "lucide-react";
import { authService } from "../lib/authService";
import { AuthLayout, AuthLogo, FormField, PasswordField, PrimaryButton } from "./AuthComponents";
import { cn } from "../lib/utils";

/**
 * ============================================================================
 * REUSABLE APPOS AUTHENTICATION SYSTEM STATE COMPONENTS
 * ============================================================================
 */

/**
 * 1. AuthStateLayout
 * Centered, safe visual frame for presenting system handshakes or validation results.
 */
export function AuthStateLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthLayout>
      <div className="flex flex-col items-center justify-center text-center">
        <AuthLogo className="mb-10 justify-center" />
        {children}
      </div>
    </AuthLayout>
  );
}

/**
 * 2. AuthStateCard
 * Framed container using sleek entrance translations and negative space.
 */
export function AuthStateCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className={cn("w-full max-w-sm space-y-6 flex flex-col items-center", className)}
    >
      {children}
    </motion.div>
  );
}

/**
 * 3. AuthStateIcon
 * Premium, state-reflective framed icons with custom neon glows.
 */
export function AuthStateIcon({ 
  type = "info", 
  icon: Icon 
}: { 
  type?: "success" | "error" | "warning" | "info"; 
  icon: React.ComponentType<{ className?: string }> 
}) {
  const styles = {
    success: "bg-emerald-50 text-emerald-600 border-emerald-100/80 shadow-emerald-500/5",
    error: "bg-rose-50 text-rose-600 border-rose-100/80 shadow-rose-500/5",
    warning: "bg-amber-50 text-amber-600 border-amber-100/80 shadow-amber-500/5",
    info: "bg-indigo-50 text-indigo-600 border-indigo-100/80 shadow-indigo-500/5"
  };

  return (
    <div className={cn(
      "relative flex h-16 w-16 items-center justify-center rounded-2xl border mx-auto shadow-md transition-all duration-300", 
      styles[type]
    )}>
      <Icon className="h-8 w-8" />
    </div>
  );
}

/**
 * 4. AuthStateTitle
 * Clean, medium tracking bold display typography.
 */
export function AuthStateTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xl font-bold tracking-tight text-slate-800 font-sans">
      {children}
    </h2>
  );
}

/**
 * 5. AuthStateDescription
 * High-legibility humanized copy with spacious vertical breathing room.
 */
export function AuthStateDescription({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-sm text-slate-500 leading-relaxed max-w-sm select-none">
      {children}
    </p>
  );
}

/**
 * 6. AuthStateReference
 * Non-repudiation tracing ref element to securely identify and resolve session issues.
 */
export function AuthStateReference({ code }: { code: string }) {
  return (
    <div className="bg-slate-50 border border-slate-100 rounded-lg p-2.5 max-w-xs mx-auto select-all text-center">
      <code className="font-mono text-[10px] text-slate-500 font-bold uppercase tracking-widest">
        REF ID: {code}
      </code>
    </div>
  );
}

/**
 * 7. AuthLoadingIndicator
 * Reusable animated circular loader with explicit state handshakes.
 */
export function AuthLoadingIndicator({ text }: { text?: string }) {
  return (
    <div className="space-y-4 text-center">
      <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50/50 border border-indigo-100/40 mx-auto shadow-sm">
        <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
      </div>
      {text && (
        <span className="font-mono text-[9px] font-extrabold text-indigo-600 tracking-widest uppercase bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full">
          {text}
        </span>
      )}
    </div>
  );
}

/**
 * 8. AuthStateActions
 * Safe click-targets and secondary routes container.
 */
export function AuthStateActions({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("pt-2 flex flex-col gap-2.5 w-full", className)}>
      {children}
    </div>
  );
}

/**
 * 9. AuthSupportAction
 * Clean action link pointing directly to technical Security Operations.
 */
export function AuthSupportAction() {
  return (
    <a
      href="mailto:support@appos.com?subject=AppOS%20Authentication%20Assistance"
      className="text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors mt-3 block"
    >
      Contact Security Operations Support
    </a>
  );
}

/**
 * 10. AuthSystemStatusIndicator
 * Displays an active APPOS AUTHENTICATION SYSTEM status bar on authentication error views.
 */
export function AuthSystemStatusIndicator() {
  return (
    <div className="flex items-center gap-1.5 justify-center bg-slate-50 border border-slate-100 rounded-lg px-3 py-1.5 text-slate-500 w-full max-w-xs mx-auto">
      <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" />
      <span className="font-mono text-[9px] font-bold uppercase tracking-widest">
        APPOS AUTHENTICATION SYSTEM
      </span>
    </div>
  );
}

/**
 * ============================================================================
 * APPOS STATE-BASED ROUTE VIEWS
 * ============================================================================
 */

/**
 * 1. AuthCallbackView
 * Renders during /auth/callback?status=success.
 * Validates the session, handles opener popups, and manages seamless routing.
 */
export function AuthCallbackView({
  onSuccess
}: {
  onSuccess: (user: any) => void;
}) {
  const [state, setState] = useState<
    "idle" | "checking_session" | "authenticated" | "unauthenticated" | "network_error" | "timed_out" | "failed"
  >("idle");
  const [errorDetails, setErrorDetails] = useState("");
  const startedRef = useRef(false);
  const attemptCountRef = useRef(0);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    setState("checking_session");

    let isFinished = false;

    // Maximum callback duration: 8 seconds
    const timeoutId = setTimeout(() => {
      if (!isFinished) {
        isFinished = true;
        setState("timed_out");
        setErrorDetails("Your secure sign-in session was not available. Please start again.");
      }
    }, 8000);

    const performSessionCheck = async () => {
      attemptCountRef.current += 1;
      try {
        const data = await authService.getMe();
        if (isFinished) return;

        if (data && data.user) {
          isFinished = true;
          clearTimeout(timeoutId);
          setState("authenticated");
          // Smooth transition before redirect
          setTimeout(() => {
            onSuccess(data.user);
          }, 800);
        } else {
          // Do not retry a 401 response (null user means unauthenticated)
          isFinished = true;
          clearTimeout(timeoutId);
          setState("unauthenticated");
          setErrorDetails("Your secure sign-in session was not available. Please start again.");
        }
      } catch (err: any) {
        if (isFinished) return;

        const isNetworkOr5xx = 
          !err.status || 
          err.status >= 500 || 
          err.message?.includes("fetch") || 
          err.name === "TypeError";

        if (isNetworkOr5xx && attemptCountRef.current < 2) {
          setState("network_error");
          // Attempt 2: after 600-800 milliseconds only for a temporary network or 5xx error
          setTimeout(() => {
            if (!isFinished) {
              setState("checking_session");
              performSessionCheck();
            }
          }, 700);
        } else {
          isFinished = true;
          clearTimeout(timeoutId);
          setState("failed");
          setErrorDetails("Your secure sign-in session was not available. Please start again.");
        }
      }
    };

    performSessionCheck();

    return () => {
      isFinished = true;
      clearTimeout(timeoutId);
    };
  }, [onSuccess]);

  const isLoading = ["idle", "checking_session", "network_error"].includes(state);
  const isSuccess = state === "authenticated";
  const isError = ["unauthenticated", "timed_out", "failed"].includes(state);

  return (
    <AuthStateLayout>
      <AuthStateCard>
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-4">
            <div className="w-9 h-9 border-[3px] border-slate-200 border-t-indigo-600 rounded-full animate-spin mb-4" />
            <div className="space-y-2 text-center">
              <span className="font-mono text-[10px] text-indigo-600 font-bold tracking-widest uppercase">
                SECURE SIGN-IN
              </span>
              <AuthStateTitle>Completing your sign-in</AuthStateTitle>
              <AuthStateDescription>
                We are confirming your AppOS account. This should only take a moment.
              </AuthStateDescription>
            </div>
          </div>
        )}

        {isSuccess && (
          <div className="flex flex-col items-center justify-center py-4">
            <AuthStateIcon type="success" icon={ShieldCheck} />
            <div className="space-y-2 text-center mt-3">
              <AuthStateTitle>Welcome to AppOS</AuthStateTitle>
              <AuthStateDescription>
                Your session has been successfully established. Launching your workspace...
              </AuthStateDescription>
            </div>
          </div>
        )}

        {isError && (
          <div className="flex flex-col items-center justify-center py-4">
            <AuthStateIcon type="error" icon={ShieldAlert} />
            <div className="space-y-2 text-center mt-3">
              <AuthStateTitle>We could not confirm your sign-in</AuthStateTitle>
              <AuthStateDescription>
                Your secure sign-in session was not available. Please start again.
              </AuthStateDescription>
            </div>
            <AuthStateActions className="mt-4">
              <div className="flex flex-col gap-2 w-full max-w-xs mx-auto">
                <a
                  href="/api/auth/google"
                  className="w-full inline-flex items-center justify-center gap-2 text-sm font-semibold text-white py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 transition-colors shadow-sm"
                >
                  Try Google Again
                </a>
                <a
                  href="/login"
                  className="w-full inline-flex items-center justify-center gap-2 text-sm font-semibold text-slate-700 hover:text-slate-900 py-2.5 px-4 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200/50 transition-colors"
                >
                  Back to Sign In
                </a>
              </div>
            </AuthStateActions>
          </div>
        )}
      </AuthStateCard>
    </AuthStateLayout>
  );
}

/**
 * 2. AuthErrorView
 * Translates the STRICT Allowlist of Safe Error Codes into high-fidelity screens.
 * Filters out arbitrary values to prevent reflection attacks or visual manipulation.
 */
export function AuthErrorView({
  onNavigate
}: {
  onNavigate: (page: any) => void;
}) {
  const params = new URLSearchParams(window.location.search);
  const rawCode = params.get("code") || "unknown_error";

  // Strict allowlist of safe authentication error codes
  const errorAllowlist = new Set([
    "oauth_cancelled",
    "invalid_state",
    "state_expired",
    "token_exchange_failed",
    "profile_invalid",
    "email_not_verified",
    "account_conflict",
    "session_failed",
    "provider_unavailable",
    "rate_limited",
    "database_unavailable",
    "service_configuration_error",
    "network_error",
    "access_denied",
    "unknown_error"
  ]);

  // Enforce resolution of arbitrary codes to unknown_error
  const errorCode = errorAllowlist.has(rawCode) ? rawCode : "unknown_error";

  useEffect(() => {
    if (window.opener) {
      try {
        window.opener.postMessage(
          {
            type: "APPOS_OAUTH_ERROR",
            code: errorCode
          },
          "https://appos-ten.vercel.app"
        );
      } catch (err) {
        console.warn("Could not post error message to opener", err);
      }
    }
  }, [errorCode]);

  const handleRetryGoogle = () => {
    const isIframe = window.self !== window.top;
    const isSandboxOrPreview = isIframe || window.location.hostname !== "appos-ten.vercel.app";
    if (isSandboxOrPreview) {
      window.open("https://appos-ten.vercel.app/login?provider=google", "_blank");
    } else {
      window.location.href = "/api/auth/google";
    }
  };

  return (
    <AuthStateLayout>
      <AuthStateCard>
        <AuthStateIcon type="error" icon={ShieldAlert} />
        
        <div className="space-y-3.5">
          <AuthStateTitle>Sign-In Encountered an Issue</AuthStateTitle>
          <AuthStateDescription>
            The authentication handoff was not completed successfully. Please verify your internet connection, confirm your account exists, and try signing in again.
          </AuthStateDescription>
        </div>

        <div className="bg-slate-50 border border-slate-100 rounded-lg p-2.5 max-w-xs mx-auto select-all text-center">
          <code className="font-mono text-[10px] text-slate-500 font-bold uppercase tracking-widest">
            Support Reference: {errorCode}
          </code>
        </div>

        <AuthSystemStatusIndicator />

        <AuthStateActions>
          {window.opener ? (
            <PrimaryButton onClick={() => window.close()}>
              Close Window
            </PrimaryButton>
          ) : (
            <>
              <PrimaryButton onClick={handleRetryGoogle}>
                Retry Google Sign-In
              </PrimaryButton>
              <button
                type="button"
                onClick={() => onNavigate("login")}
                className="w-full flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white py-2.5 text-sm font-semibold text-brand-dark shadow-sm hover:bg-slate-50 hover:border-slate-300 active:scale-[0.99] transition-all cursor-pointer min-h-[44px] px-4"
              >
                Return to Login
              </button>
            </>
          )}
        </AuthStateActions>
        <AuthSupportAction />
      </AuthStateCard>
    </AuthStateLayout>
  );
}

/**
 * 3. AuthVerifyEmailView
 * Renders during /auth/verify-email?token=...
 * Authenticates cryptographic registration verification tokens safely.
 */
export function AuthVerifyEmailView({
  onNavigate
}: {
  onNavigate: (page: any) => void;
}) {
  const params = new URLSearchParams(window.location.search);
  const token = params.get("token") || "";
  const email = params.get("email") || "";
  
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorDetails, setErrorDetails] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setErrorDetails("No active verification token was provided in the deep link routing request.");
      return;
    }

    const performVerification = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 1500));
        const res = await authService.verifyEmail(token);
        if (res.success) {
          setStatus("success");
        } else {
          setStatus("error");
          setErrorDetails(res.message || "The verification link has expired, is invalid, or was already consumed.");
        }
      } catch (err: any) {
        setStatus("error");
        setErrorDetails(err?.message || "An unexpected network error occurred during verification.");
      }
    };

    performVerification();
  }, [token]);

  return (
    <AuthStateLayout>
      <AuthStateCard>
        {status === "loading" && (
          <>
            <AuthLoadingIndicator text="Handshake: EMAIL_VALIDATION" />
            <div className="space-y-2">
              <AuthStateTitle>Verifying Email Address</AuthStateTitle>
              <AuthStateDescription>
                Validating your email ownership token against the AppOS cryptographic registries...
              </AuthStateDescription>
            </div>
          </>
        )}

        {status === "success" && (
          <>
            <AuthStateIcon type="success" icon={CheckCircle} />
            <div className="space-y-2">
              <AuthStateTitle>Email Verified Successfully</AuthStateTitle>
              <AuthStateDescription>
                Thank you for verifying your email {email ? <strong className="text-slate-800">({email})</strong> : ""}. Your system status has been upgraded to active.
              </AuthStateDescription>
            </div>
            <AuthStateActions>
              <PrimaryButton onClick={() => onNavigate("login")}>
                Sign In to AppOS
              </PrimaryButton>
            </AuthStateActions>
          </>
        )}

        {status === "error" && (
          <>
            <AuthStateIcon type="error" icon={ShieldAlert} />
            <div className="space-y-2">
              <AuthStateTitle>Verification Failed</AuthStateTitle>
              <AuthStateDescription>{errorDetails}</AuthStateDescription>
            </div>
            {token && <AuthStateReference code={token.substring(0, 16) + "..."} />}
            <div className="my-1.5 w-full">
              <AuthSystemStatusIndicator />
            </div>
            <AuthStateActions>
              <PrimaryButton onClick={() => onNavigate("login")}>
                Return to Sign In
              </PrimaryButton>
              <button
                onClick={() => onNavigate("register")}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
              >
                Create a New Account
              </button>
            </AuthStateActions>
          </>
        )}
        <AuthSupportAction />
      </AuthStateCard>
    </AuthStateLayout>
  );
}

/**
 * 4. AuthLinkAccountView
 * Clean secure verification screen for linking Google accounts.
 */
export function AuthLinkAccountView({
  onSuccess,
  onNavigate
}: {
  onSuccess: (user: any) => void;
  onNavigate: (page: any) => void;
}) {
  const params = new URLSearchParams(window.location.search);
  const conflictEmail = params.get("conflict_email") || "";
  const providerId = params.get("provider_id") || "";

  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError("Please enter your current AppOS password.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await authService.linkGoogle({
        email: conflictEmail,
        password,
        provider: "google",
        provider_id: providerId
      });

      if (res.success) {
        setSuccess(true);
        setTimeout(async () => {
          const userRes = await authService.getMe();
          if (userRes && userRes.user) {
            onSuccess(userRes.user);
          } else {
            onNavigate("login");
          }
        }, 1500);
      } else {
        setError(res.message);
      }
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="flex flex-col text-center">
        <AuthLogo className="mb-8 justify-center" />

        {success ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6 py-6 flex flex-col items-center"
          >
            <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 mx-auto">
              <CheckCircle className="h-8 w-8" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold tracking-tight text-slate-800">
                Accounts Linked Successfully
              </h2>
              <p className="text-sm text-slate-500 max-w-sm">
                Your standard AppOS account is now safely connected to Google Sign-In. Redirecting...
              </p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 text-center flex flex-col items-center"
          >
            <div className="text-left space-y-2 w-full">
              <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 font-display">
                Confirm your identity
              </h2>
              <p className="text-sm text-slate-500 leading-relaxed">
                An AppOS account already exists for <strong className="text-slate-800">{conflictEmail}</strong>. Confirm your current password to link Google securely.
              </p>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 text-xs font-semibold rounded-lg text-left select-none w-full">
                {error}
              </div>
            )}

            <form onSubmit={handleLink} className="space-y-4 w-full text-left">
              <FormField
                label="Email address"
                id="conflict_email"
                type="email"
                value={conflictEmail}
                disabled
                className="bg-slate-50 border-slate-200 cursor-not-allowed font-medium text-slate-500"
                icon={<Mail className="h-4 w-4" />}
              />

              <PasswordField
                label="Current AppOS Password"
                id="confirm_password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password to authorize linking"
              />

              <div className="pt-2">
                <PrimaryButton type="submit" loading={loading}>
                  Confirm Identity & Connect
                </PrimaryButton>
              </div>
            </form>

            <div className="border-t border-slate-100 pt-4 flex justify-between text-xs select-none w-full">
              <button
                type="button"
                onClick={() => onNavigate("login")}
                className="font-semibold text-slate-500 hover:text-slate-800 transition-colors"
              >
                Cancel linking
              </button>
              <button
                type="button"
                onClick={() => onNavigate("forgot-password")}
                className="font-semibold text-indigo-600 hover:text-indigo-500 transition-colors"
              >
                Forgot Password?
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </AuthLayout>
  );
}

/**
 * 5. AuthNotFoundView
 * Global 404 - Renders when deep links resolve to unrecognized paths.
 */
export function AuthNotFoundView({
  onNavigate
}: {
  onNavigate: (page: any) => void;
}) {
  return (
    <AuthStateLayout>
      <AuthStateCard>
        <AuthStateIcon type="warning" icon={AlertTriangle} />
        <div className="space-y-2 text-center">
          <AuthStateTitle>Page Not Found</AuthStateTitle>
          <AuthStateDescription>
            The requested AppOS system route does not exist or has been relocated to another security zone.
          </AuthStateDescription>
        </div>
        <AuthStateReference code="ERR_ROUTE_404" />
        <AuthSystemStatusIndicator />
        <AuthStateActions>
          <PrimaryButton onClick={() => onNavigate("home")}>
            Return to Home Page
          </PrimaryButton>
        </AuthStateActions>
        <AuthSupportAction />
      </AuthStateCard>
    </AuthStateLayout>
  );
}

/**
 * 6. AuthServerErrorView
 * Global 500 - Renders when major system exceptions are captured.
 */
export function AuthServerErrorView({
  onNavigate,
  error
}: {
  onNavigate: (page: any) => void;
  error?: string;
}) {
  return (
    <AuthStateLayout>
      <AuthStateCard>
        <AuthStateIcon type="error" icon={ShieldAlert} />
        <div className="space-y-2 text-center">
          <AuthStateTitle>Internal System Interruption</AuthStateTitle>
          <AuthStateDescription>
            An unexpected administrative or structural exception was detected. AppOS security systems have blocked the transaction.
          </AuthStateDescription>
        </div>
        <AuthStateReference code={error || "ERR_SYSTEM_500"} />
        <AuthSystemStatusIndicator />
        <AuthStateActions>
          <PrimaryButton onClick={() => onNavigate("home")}>
            Restart Application
          </PrimaryButton>
        </AuthStateActions>
        <AuthSupportAction />
      </AuthStateCard>
    </AuthStateLayout>
  );
}
