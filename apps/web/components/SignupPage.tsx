"use client";

import React, { useState, useEffect } from "react";
import { Mail, ShieldCheck, CheckCircle2, Lock, ArrowLeft } from "lucide-react";
import {
  AuthLayout,
  AuthLogo,
  FormField,
  PasswordField,
  SocialAuthButton,
  Divider,
  PrimaryButton
} from "./AuthComponents";
import { authService } from "../lib/authService";
import { authClient } from "../lib/auth-client";
import { cn } from "../lib/utils";

// Translate technical database/server errors to elegant, actionable human language
const translateError = (err: any): string => {
  if (!err) return "AppOS sign-in is temporarily unavailable. Please try again in a moment.";
  
  const message = typeof err === "string" ? err : err.message || "";
  const lower = message.toLowerCase();
  
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
    return "AppOS sign-in is temporarily unavailable. Please try again in a moment.";
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
    return "We couldn’t sign you in with those details. Check your email and password, or create an account.";
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
    return "An account may already exist for this email. Sign in or reset your password.";
  }
  
  return "AppOS sign-in is temporarily unavailable. Please try again in a moment.";
};

// Rate-limiting resend verification email countdown component
function SignupVerificationActions({
  email,
  onResend,
  onSignIn
}: {
  email: string;
  onResend: () => Promise<void>;
  onSignIn: () => void;
}) {
  const [countdown, setCountdown] = useState(0);
  const [resending, setResending] = useState(false);
  const [statusText, setStatusText] = useState("");

  useEffect(() => {
    let timer: any;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [countdown]);

  const handleResendClick = async () => {
    if (countdown > 0 || resending) return;
    setResending(true);
    setStatusText("");
    try {
      await onResend();
      setCountdown(60);
      setStatusText("Verification link sent.");
    } catch (err) {
      setStatusText("Failed to resend. Please try again.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      <div className="flex items-center gap-1.5 text-slate-500 font-bold mb-2">
        <span className="h-2.5 w-2.5 rounded-full bg-indigo-500 animate-pulse" />
        <span>What if I didn't get it?</span>
      </div>
      <div className="flex gap-4 w-full">
        <button
          type="button"
          disabled={countdown > 0 || resending}
          onClick={handleResendClick}
          className={cn(
            "flex-1 rounded-lg border py-2.5 text-center text-xs font-bold transition-all cursor-pointer min-h-[44px]",
            countdown > 0
              ? "bg-slate-50 text-slate-400 border-slate-100 cursor-not-allowed"
              : "border-slate-200 text-slate-700 hover:bg-slate-50"
          )}
        >
          {countdown > 0 ? `Resend in ${countdown}s` : resending ? "Sending..." : "Resend verification link"}
        </button>
        <button
          type="button"
          onClick={onSignIn}
          className="flex-1 rounded-lg bg-indigo-600 text-white py-2.5 text-center text-xs font-bold hover:bg-indigo-700 transition-all cursor-pointer min-h-[44px]"
        >
          Sign In
        </button>
      </div>
      {statusText && (
        <p className="text-[11px] font-medium text-indigo-600 mt-1 select-none animate-fade-in">
          {statusText}
        </p>
      )}
    </div>
  );
}

interface SignupPageProps {
  onBackToHome?: () => void;
  onSignupSuccess?: (user: any) => void;
  initialMode?: "signup" | "login" | "forgot-password" | "reset-password" | "link-conflict";
}

export default function SignupPage({ onBackToHome, onSignupSuccess, initialMode = "signup" }: SignupPageProps) {
  // Modes: "signup" | "login" | "forgot-password" | "reset-password" | "link-conflict"
  const [mode, setMode] = useState<"signup" | "login" | "forgot-password" | "reset-password" | "link-conflict">(
    initialMode
  );

  // Synchronize internal mode with initialMode prop when it changes (e.g. on route change)
  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  // Synchronize browser address bar with internal mode changes
  useEffect(() => {
    const currentPath = window.location.pathname;
    if (mode === "login" && currentPath !== "/login") {
      window.history.pushState(null, "", "/login" + window.location.search);
    } else if (mode === "signup" && currentPath !== "/signup") {
      window.history.pushState(null, "", "/signup" + window.location.search);
    } else if (mode === "forgot-password" && currentPath !== "/forgot-password") {
      window.history.pushState(null, "", "/forgot-password" + window.location.search);
    } else if (mode === "reset-password" && currentPath !== "/reset-password") {
      window.history.pushState(null, "", "/reset-password" + window.location.search);
    }
  }, [mode]);

  // Input states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [resetToken, setResetToken] = useState("");

  // Conflict state
  const [conflictData, setConflictData] = useState<{
    email: string;
    provider: string;
    provider_id: string;
  } | null>(null);

  // UI state management
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [googleState, setGoogleState] = useState<"default" | "launching" | "redirecting" | "popup_blocked" | "failed">("default");

  // Detect iframe or sandbox preview
  useEffect(() => {
    const isIframe = window.self !== window.top;
    if (isIframe) {
      setIsPreviewMode(true);
    }
  }, []);

  // Automatic trigger if provider=google is in the query params on production
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("provider") === "google") {
      const isIframe = window.self !== window.top;
      if (!isIframe) {
        setGoogleState("launching");
        (authClient as any).signIn.social({
          provider: "google",
          callbackURL: "/dashboard",
          errorCallbackURL: "/login?oauthError=google"
        }).catch((err: any) => {
          console.error("Google social sign-in failed", err);
          setGoogleState("failed");
          setErrors({ general: "Google sign-in is temporarily unavailable." });
        });
      }
    }
  }, []);

  // Parse token from URL if present
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (token) {
      setResetToken(token);
      setMode("reset-password");
    }

    const conflictEmail = params.get("conflict_email");
    const providerId = params.get("provider_id");
    const oauthError = params.get("oauthError") || params.get("error");
    if (conflictEmail && providerId) {
      setConflictData({
        email: conflictEmail,
        provider: "google",
        provider_id: providerId
      });
      setMode("link-conflict");
      setPassword("");
      setErrors({});
    } else if (oauthError) {
      let displayError = "Google sign-in is temporarily unavailable. Use email and password, or try again later.";
      const errLower = oauthError.toLowerCase();
      if (errLower.includes("cancel") || errLower.includes("cancelled") || errLower.includes("user_cancelled")) {
        displayError = "Google sign-in was cancelled. Please try again.";
      } else if (
        errLower.includes("configuration") ||
        errLower.includes("client_id") ||
        errLower.includes("client_secret") ||
        errLower.includes("provider_unavailable") ||
        errLower.includes("missing_configuration") ||
        errLower.includes("configuration_not_found") ||
        errLower.includes("google")
      ) {
        displayError = "Google sign-in is temporarily unavailable. Use email and password, or try again later.";
      }
      setErrors({ general: displayError });
    }
  }, []);

  // Automatic redirect back to login after forgot-password success state
  useEffect(() => {
    if (isSuccess && mode === "forgot-password") {
      const timer = setTimeout(() => {
        setIsSuccess(false);
        setMode("login");
        setEmail("");
        setPassword("");
        setErrors({});
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isSuccess, mode]);



  // Input changes
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    setErrors((prev) => ({ ...prev, email: undefined, general: undefined }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    setErrors((prev) => ({ ...prev, password: undefined, general: undefined }));
  };

  // Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (mode === "forgot-password") {
      if (!email) {
        setErrors({ email: "Email address is required." });
        return;
      }
      setIsLoading(true);
      try {
        const response = await authService.forgotPassword(email);
        if (response.success) {
          setIsSuccess(true);
          setSuccessMsg(response.message);
        } else {
          setErrors({ general: translateError(response.message) });
        }
      } catch (err) {
        setErrors({ general: translateError(err) });
      } finally {
        setIsLoading(false);
      }
      return;
    }

    if (mode === "reset-password") {
      if (!password) {
        setErrors({ password: "New password is required." });
        return;
      }
      setIsLoading(true);
      try {
        const response = await authService.resetPassword(resetToken, password);
        if (response.success) {
          setIsSuccess(true);
          setSuccessMsg(response.message);
        } else {
          setErrors({ general: translateError(response.message) });
        }
      } catch (err) {
        setErrors({ general: translateError(err) });
      } finally {
        setIsLoading(false);
      }
      return;
    }

    if (mode === "link-conflict") {
      if (!password || !conflictData) {
        setErrors({ password: "Enter your current account password to authorize linking." });
        return;
      }
      setIsLoading(true);
      try {
        const response = await authService.linkGoogle({
          email: conflictData.email,
          password,
          provider: conflictData.provider,
          provider_id: conflictData.provider_id
        });
        if (response.success) {
          setIsSuccess(true);
          setSuccessMsg(response.message);
          
          const details = await authService.getMe();
          if (onSignupSuccess && details && details.user) {
            setTimeout(() => {
              onSignupSuccess(details.user);
            }, 1800);
          }
        } else {
          setErrors({ general: translateError(response.message) });
        }
      } catch (err) {
        setErrors({ general: translateError(err) });
      } finally {
        setIsLoading(false);
      }
      return;
    }

    const newErrors: { email?: string; password?: string } = {};
    const normalizedEmail = email.trim().toLowerCase();

    if (!email) {
      newErrors.email = mode === "login" ? "Email is required." : "Work email address is required.";
    } else if (normalizedEmail.length > 254) {
      newErrors.email = "Email address cannot exceed 254 characters.";
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(normalizedEmail)) {
        newErrors.email = "Please enter a valid email address (e.g., name@company.com).";
      }
    }

    if (!password) {
      newErrors.password = "Password is required.";
    } else if (mode === "signup" && password.length < 12) {
      newErrors.password = "Password must be at least 12 characters long.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);

    try {
      if (mode === "login") {
        const response = await authService.login({
          email: normalizedEmail,
          password
        });

        if (response.success) {
          setIsSuccess(true);
          setSuccessMsg("Welcome back to AppOS! Authenticating session...");
          const details = await authService.getMe();
          if (onSignupSuccess && details && details.user) {
            setTimeout(() => {
              onSignupSuccess(details.user);
            }, 1500);
          }
        } else {
          setErrors({ general: translateError(response.message) });
        }
      } else {
        const response = await authService.signup({
          email: normalizedEmail,
          password,
          provider: "email",
          honeypot: honeypot || undefined
        });

        if (response.success) {
          setIsSuccess(true);
          setSuccessMsg(response.message);
        } else {
          setErrors({ general: translateError(response.message) });
        }
      }
    } catch (err) {
      setErrors({ general: translateError(err) });
    } finally {
      setIsLoading(false);
    }
  };

  // Google OAuth Trigger
  const handleGoogleOAuth = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
    }
    if (googleState === "launching" || googleState === "redirecting") return;

    setErrors({});
    const isIframe = typeof window !== "undefined" && window.self !== window.top;

    if (isIframe) {
      setGoogleState("launching");
      // Use approved NEXT_PUBLIC_APP_URL value to avoid using iframe's window.location.origin
      const canonicalAppUrl = process.env.NEXT_PUBLIC_APP_URL || "https://appos-ten.vercel.app";
      const targetUrl = `${canonicalAppUrl.replace(/\/+$/, "")}/login?provider=google`;
      const newWin = window.open(targetUrl, "_blank");
      if (!newWin || newWin.closed || typeof newWin.closed === "undefined") {
        setGoogleState("popup_blocked");
        setErrors({ general: "Google sign-in was blocked by a popup blocker. Please allow popups or open the app in a new tab." });
      } else {
        setGoogleState("redirecting");
      }
      return;
    }

    setGoogleState("launching");
    try {
      await authClient.signIn.social({
        provider: "google",
        callbackURL: "/dashboard",
        errorCallbackURL: "/login?oauthError=google"
      });
    } catch (err: any) {
      console.error(err);
      setErrors({ general: "Google sign-in is temporarily unavailable. Use email and password, or try again later." });
      setGoogleState("failed");
    }
  };

  const handleResendVerification = async () => {
    if (!email) {
      setErrors({ general: "Please enter your email to resend verification link." });
      return;
    }
    setIsLoading(true);
    setErrors({});
    try {
      const res = await authService.resendVerification(email);
      setErrors({ general: translateError(res.message) });
    } catch (err) {
      setErrors({ general: translateError(err) });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      {/* Logo Header */}
      <div className="flex lg:hidden justify-between items-center mb-8 select-none">
        <AuthLogo />
        {onBackToHome && (
          <button 
            onClick={onBackToHome}
            className="text-xs font-bold text-slate-500 hover:text-brand-primary transition-colors cursor-pointer border-0 bg-transparent"
          >
            Back to site
          </button>
        )}
      </div>

      {/* Desktop absolute back to site link */}
      {onBackToHome && (
        <button
          onClick={onBackToHome}
          className="hidden lg:flex absolute top-12 right-12 items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-brand-primary transition-colors cursor-pointer border-0 bg-transparent p-0 focus:outline-none"
        >
          <span>Back to site</span>
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </button>
      )}

      {!isSuccess ? (
        <div className="flex flex-col text-left">
          {mode !== "signup" && mode !== "login" && (
            <button
              onClick={() => {
                setMode("login");
                setErrors({});
              }}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-brand-dark mb-6 transition-colors border-0 bg-transparent cursor-pointer p-0"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Login</span>
            </button>
          )}

          {/* Header */}
          <h2 className="font-display text-3xl md:text-3.5xl font-extrabold tracking-tight text-brand-dark mb-2.5">
            {mode === "signup" && "Create your account"}
            {mode === "login" && "Sign in to your account"}
            {mode === "forgot-password" && "Reset your password"}
            {mode === "reset-password" && "Set new password"}
            {mode === "link-conflict" && "Secure Account Linking"}
          </h2>
          
          <p className="text-sm text-brand-text-secondary leading-relaxed mb-8">
            {mode === "signup" && "Start converting your website into native iOS & Android applications."}
            {mode === "login" && "Access your workspace to compile and deploy native applications."}
            {mode === "forgot-password" && "Enter your email address and we'll dispatch a secure recovery link."}
            {mode === "reset-password" && "Set a cryptographically strong, new password to secure your account."}
            {mode === "link-conflict" && `An account with ${conflictData?.email} already exists. Enter password to link Google login.`}
          </p>

          {errors.general && (
            <div className="mb-5 p-3.5 bg-rose-50 border border-rose-100 rounded-lg text-xs font-medium text-rose-600">
              <div>{errors.general}</div>
              {mode === "login" && errors.general === "We couldn’t sign you in with those details. Check your email and password, or create an account." && (
                <div className="mt-2.5 flex items-center gap-3 border-t border-rose-100 pt-2 text-[11px]">
                  <button
                    type="button"
                    onClick={() => {
                      setMode("signup");
                      setPassword("");
                      setErrors({});
                      window.history.pushState(null, "", "/signup" + window.location.search);
                    }}
                    className="font-bold text-indigo-600 hover:text-indigo-700 hover:underline bg-transparent border-0 p-0 cursor-pointer"
                  >
                    Create an account
                  </button>
                  <span className="text-rose-200">|</span>
                  <button
                    type="button"
                    onClick={() => {
                      setMode("forgot-password");
                      setErrors({});
                      window.history.pushState(null, "", "/forgot-password" + window.location.search);
                    }}
                    className="font-bold text-indigo-600 hover:text-indigo-700 hover:underline bg-transparent border-0 p-0 cursor-pointer"
                  >
                    Reset password
                  </button>
                </div>
              )}
              {mode === "signup" && errors.general === "An account may already exist for this email. Sign in or reset your password." && (
                <div className="mt-2.5 flex items-center gap-3 border-t border-rose-100 pt-2 text-[11px]">
                  <button
                    type="button"
                    onClick={() => {
                      setMode("login");
                      setPassword("");
                      setErrors({});
                      window.history.pushState(null, "", "/login" + window.location.search);
                    }}
                    className="font-bold text-indigo-600 hover:text-indigo-700 hover:underline bg-transparent border-0 p-0 cursor-pointer"
                  >
                    Sign in
                  </button>
                  <span className="text-rose-200">|</span>
                  <button
                    type="button"
                    onClick={() => {
                      setMode("forgot-password");
                      setErrors({});
                      window.history.pushState(null, "", "/forgot-password" + window.location.search);
                    }}
                    className="font-bold text-indigo-600 hover:text-indigo-700 hover:underline bg-transparent border-0 p-0 cursor-pointer"
                  >
                    Reset password
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Honeypot */}
            <input
              type="text"
              name="website_url_honeypot"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
              className="hidden"
              tabIndex={-1}
              autoComplete="off"
            />

            {/* Email Field */}
            {(mode === "signup" || mode === "login" || mode === "forgot-password") && (
              <FormField
                label="Email Address"
                id="email"
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={handleEmailChange}
                error={errors.email}
                disabled={isLoading}
                icon={<Mail className="h-4 w-4" />}
              />
            )}

            {/* Password Login Field */}
            {mode === "login" && (
              <div className="flex flex-col gap-1.5 w-full text-left">
                <div className="flex justify-between items-center select-none">
                  <label htmlFor="password-login" className="text-xs font-bold text-slate-700 tracking-wide">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setMode("forgot-password");
                      setErrors({});
                    }}
                    className="text-[11px] font-bold text-brand-primary hover:underline cursor-pointer bg-transparent border-0 p-0 focus:outline-none"
                  >
                    Forgot?
                  </button>
                </div>
                <div className="relative rounded-lg shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    id="password-login"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={handlePasswordChange}
                    disabled={isLoading}
                    className="block w-full rounded-lg border border-slate-200 hover:border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm transition-all focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 placeholder-slate-400 text-brand-dark min-h-[44px]"
                  />
                </div>
                {errors.password && (
                  <span className="text-[11px] font-medium text-rose-500 mt-1">
                    {errors.password}
                  </span>
                )}
              </div>
            )}

            {/* Password Signup Field */}
            {mode === "signup" && (
              <PasswordField
                label="Password"
                id="password"
                placeholder="••••••••"
                value={password}
                onChange={handlePasswordChange}
                error={errors.password}
                disabled={isLoading}
              />
            )}

            {/* Password Reset Field */}
            {mode === "reset-password" && (
              <PasswordField
                label="New Password"
                id="new-password"
                placeholder="••••••••"
                value={password}
                onChange={handlePasswordChange}
                error={errors.password}
                disabled={isLoading}
              />
            )}

            {/* Link Confirmation Password Field */}
            {mode === "link-conflict" && (
              <PasswordField
                label="Account Password"
                id="confirm-link-password"
                placeholder="••••••••"
                value={password}
                onChange={handlePasswordChange}
                error={errors.password}
                disabled={isLoading}
              />
            )}

            {/* Submit CTA */}
            <div className="pt-2">
              <PrimaryButton type="submit" loading={isLoading} disabled={isLoading}>
                {isLoading ? (
                  <>
                    {mode === "signup" && "Creating account…"}
                    {mode === "login" && "Signing in…"}
                    {mode === "forgot-password" && "Sending reset link…"}
                    {mode === "reset-password" && "Updating password…"}
                    {mode === "link-conflict" && "Linking account…"}
                  </>
                ) : (
                  <>
                    {mode === "signup" && "Create Account"}
                    {mode === "login" && "Sign In"}
                    {mode === "forgot-password" && "Send Reset Link"}
                    {mode === "reset-password" && "Reset Password"}
                    {mode === "link-conflict" && "Link Account Securely"}
                  </>
                )}
              </PrimaryButton>
            </div>
          </form>

          {/* Social and Toggles for login/signup modes */}
          {(mode === "signup" || mode === "login") && (
            <>
              <Divider />
              <div className="space-y-3">
                <SocialAuthButton
                  provider="google"
                  onClick={handleGoogleOAuth}
                  loading={googleState === "launching" || googleState === "redirecting"}
                  disabled={googleState === "launching" || googleState === "redirecting"}
                />
                {isPreviewMode && (
                  <div className="text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-100 rounded-lg p-3 space-y-2 mt-2 leading-normal animate-fade-in text-center">
                    {googleState === "launching" || googleState === "redirecting" ? (
                      <p className="font-semibold text-indigo-600">
                        Connecting to Google…
                      </p>
                    ) : (
                      <p>
                        We couldn’t open Google sign-in here.
                      </p>
                    )}
                    <a
                      href={typeof window !== "undefined" ? `${window.location.origin}${window.location.pathname}?provider=google` : "/login?provider=google"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block mt-1 font-bold text-indigo-600 hover:text-indigo-500 underline cursor-pointer"
                    >
                      Open AppOS Sign-In
                    </a>
                  </div>
                )}
              </div>

              <div className="mt-8 text-center text-xs font-semibold text-slate-500">
                {mode === "login" ? "New to AppOS? " : "Already have an account? "}
                <button
                  onClick={() => {
                    setMode(mode === "login" ? "signup" : "login");
                    setErrors({});
                  }}
                  className="text-brand-primary hover:underline font-bold cursor-pointer bg-transparent border-0 p-0 focus:outline-none"
                >
                  {mode === "login" ? "Create an account" : "Sign in"}
                </button>
              </div>
            </>
          )}
        </div>
      ) : (
        /* SUCCESS SCREEN */
        <div className="flex flex-col items-center justify-center text-center py-6 select-none animate-fade-in w-full">
          <div className="h-16 w-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-6 border border-emerald-100 shadow-sm">
            <CheckCircle2 className="h-9 w-9 stroke-[2.2]" />
          </div>
          
          <h3 className="font-display text-2.5xl font-extrabold text-brand-dark mb-3">
            {mode === "login" && "Authentication Successful"}
            {mode === "signup" && "Verify your email"}
            {mode === "forgot-password" && "Reset link sent"}
            {mode === "reset-password" && "Password changed"}
            {mode === "link-conflict" && "Linking Complete!"}
          </h3>
          
          <p className="text-sm text-brand-text-secondary leading-relaxed max-w-sm mb-8">
            {mode === "forgot-password" && "We sent a secure link to your inbox. Click the link to create a new password."}
            {mode === "signup" && "We sent an activation link to your email address. Please click the link to confirm your account and open your workspace."}
            {mode === "reset-password" && "Your new password is now active. You can now securely access your AppOS console."}
            {mode !== "forgot-password" && mode !== "signup" && mode !== "reset-password" && (successMsg || "Your request has been successfully processed.")}
          </p>

          {/* Secure Informational Card or Custom Warnings */}
          {mode !== "forgot-password" && mode !== "signup" && mode !== "reset-password" ? (
            <div className="w-full bg-[#F8FAFC] border border-slate-200/80 rounded-xl p-5 mb-8 text-left">
              <div className="flex items-start gap-3">
                <ShieldCheck className="h-5 w-5 text-brand-primary shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-extrabold text-brand-dark font-sans">Security Verified</h4>
                  <p className="text-[11px] text-brand-text-secondary leading-normal mt-1">
                    Your login has been securely verified.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            (mode === "forgot-password" || mode === "reset-password" || mode === "signup") && (
              <div className="w-full bg-[#F8FAFC] border border-slate-200/80 rounded-xl p-4 mb-8 text-center">
                <p className="text-xs font-medium text-slate-500">
                  For your security, this link expires in 24 hours.
                </p>
              </div>
            )
          )}

          <div className="flex flex-col items-center gap-2 text-xs font-semibold text-slate-500 w-full">
            {mode === "signup" ? (
              <SignupVerificationActions
                email={email}
                onResend={handleResendVerification}
                onSignIn={() => {
                  setIsSuccess(false);
                  setMode("login");
                  setEmail("");
                  setPassword("");
                  setErrors({});
                }}
              />
            ) : mode === "reset-password" ? (
              <div className="w-full">
                <PrimaryButton onClick={() => {
                  setIsSuccess(false);
                  setMode("login");
                  setEmail("");
                  setPassword("");
                  setErrors({});
                }}>
                  Go to Dashboard
                </PrimaryButton>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-brand-primary">
                <span className="h-2 w-2 rounded-full bg-brand-primary animate-pulse" />
                <span>
                  {mode === "forgot-password" ? "Returning to login..." : "Taking you to your account..."}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </AuthLayout>
  );
}
