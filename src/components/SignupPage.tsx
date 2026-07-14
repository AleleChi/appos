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
import { AUTH_ENDPOINTS } from "../config/api";

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
    const isNotVercel = window.location.hostname !== "appos-ten.vercel.app";
    if (isIframe || isNotVercel) {
      setIsPreviewMode(true);
    }
  }, []);

  // Automatic trigger if provider=google is in the query params on production Vercel
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("provider") === "google") {
      const isIframe = window.self !== window.top;
      const isSandboxOrPreview = isIframe || window.location.hostname !== "appos-ten.vercel.app";
      if (!isSandboxOrPreview) {
        window.location.href = AUTH_ENDPOINTS.googleLogin;
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
    const oauthError = params.get("error");
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
      setErrors({ general: oauthError });
    }
  }, []);

  // Listen to Google OAuth popup events
  useEffect(() => {
    const handleOAuthMessage = async (event: MessageEvent) => {
      const origin = event.origin;
      if (!origin.endsWith(".run.app") && !origin.includes("localhost") && !origin.includes("127.0.0.1") && !origin.includes("::1")) {
        return;
      }
      
      if (event.data?.type === "OAUTH_AUTH_SUCCESS") {
        setIsSuccess(true);
        setSuccessMsg("Signed in via Google! Authenticating session...");
        
        // Fetch session
        const details = await authService.getMe();
        if (onSignupSuccess && details && details.user) {
          setTimeout(() => {
            onSignupSuccess(details.user);
          }, 1500);
        }
      } else if (event.data?.type === "OAUTH_CONFLICT") {
        setConflictData({
          email: event.data.email,
          provider: event.data.provider,
          provider_id: event.data.provider_id
        });
        setMode("link-conflict");
        setPassword("");
        setErrors({});
      }
    };
    
    window.addEventListener("message", handleOAuthMessage);
    return () => window.removeEventListener("message", handleOAuthMessage);
  }, [onSignupSuccess]);

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
          setErrors({ general: response.message });
        }
      } catch (err) {
        setErrors({ general: "Unable to dispatch reset link." });
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
          setErrors({ general: response.message });
        }
      } catch (err) {
        setErrors({ general: "Unable to complete password reset." });
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
          setErrors({ general: response.message });
        }
      } catch (err) {
        setErrors({ general: "Account linking handshake failed." });
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
          setErrors({ general: response.message });
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
          setErrors({ general: response.message });
        }
      }
    } catch (err) {
      setErrors({ general: "An unexpected network error occurred." });
    } finally {
      setIsLoading(false);
    }
  };

  // Google OAuth Trigger
  const handleGoogleOAuth = () => {
    setErrors({});
    const isIframe = window.self !== window.top;
    const isSandboxOrPreview = isIframe || window.location.hostname !== "appos-ten.vercel.app";

    if (isSandboxOrPreview) {
      setGoogleState("launching");
      const newWin = window.open("https://appos-ten.vercel.app/login?provider=google", "_blank");
      if (!newWin || newWin.closed || typeof newWin.closed === "undefined") {
        setGoogleState("popup_blocked");
      } else {
        setGoogleState("redirecting");
      }
      return;
    }

    setGoogleState("launching");
    
    // Prevent duplicate submission and let the loading state paint first
    requestAnimationFrame(() => {
      window.location.assign("/api/auth/google");
    });
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
      setErrors({ general: res.message });
    } catch (err) {
      setErrors({ general: "Resend verification request failed." });
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
              {errors.general}
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
                        Opening secure AppOS sign-in…
                      </p>
                    ) : googleState === "popup_blocked" ? (
                      <p className="text-rose-600 font-semibold">
                        Pop-up blocked. Please click the button below to sign in.
                      </p>
                    ) : (
                      <p>
                        Google sign-in opens in the deployed AppOS application for secure authentication.
                      </p>
                    )}
                    <a
                      href="https://appos-ten.vercel.app/login?provider=google"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block mt-1 font-bold text-indigo-600 hover:text-indigo-500 underline"
                    >
                      Open AppOS Sign-In
                    </a>
                  </div>
                )}
              </div>

              <div className="mt-8 text-center text-xs font-semibold text-slate-500">
                {mode === "login" ? "Don't have an account? " : "Already have an account? "}
                <button
                  onClick={() => {
                    setMode(mode === "login" ? "signup" : "login");
                    setErrors({});
                  }}
                  className="text-brand-primary hover:underline font-bold cursor-pointer bg-transparent border-0 p-0 focus:outline-none"
                >
                  {mode === "login" ? "Sign up" : "Sign in"}
                </button>
              </div>
            </>
          )}
        </div>
      ) : (
        /* SUCCESS SCREEN */
        <div className="flex flex-col items-center justify-center text-center py-6 select-none animate-fade-in">
          <div className="h-16 w-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-6 border border-emerald-100 shadow-sm">
            <CheckCircle2 className="h-9 w-9 stroke-[2.2]" />
          </div>
          
          <h3 className="font-display text-2xl font-extrabold text-brand-dark mb-3">
            {mode === "login" && "Authentication Successful"}
            {mode === "signup" && "Account Created!"}
            {mode === "forgot-password" && "Reset Link Sent"}
            {mode === "reset-password" && "Password Reset Successful"}
            {mode === "link-conflict" && "Linking Complete!"}
          </h3>
          
          <p className="text-sm text-brand-text-secondary leading-relaxed max-w-sm mb-8">
            {successMsg || "Your request has been successfully processed under strict tenant verification standards."}
          </p>

          <div className="w-full bg-[#F8FAFC] border border-slate-200/80 rounded-xl p-5 mb-8 text-left">
            <div className="flex items-start gap-3">
              <ShieldCheck className="h-5 w-5 text-brand-primary shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-extrabold text-brand-dark">Security Handshake Succeeded</h4>
                <p className="text-[11px] text-brand-text-secondary leading-normal mt-1">
                  Tenant credentials and cryptographic validation signatures matched security protocols.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center gap-2 text-xs font-semibold text-slate-500 w-full">
            {mode === "signup" ? (
              <div className="flex flex-col items-center gap-3 w-full">
                <div className="flex items-center gap-1.5 text-amber-500 font-bold mb-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500 animate-pulse" />
                  <span>Pending verification...</span>
                </div>
                <div className="flex gap-4 w-full">
                  <button
                    onClick={handleResendVerification}
                    className="flex-1 rounded-lg border border-slate-200 py-2.5 text-center text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    Resend Email Link
                  </button>
                  <button
                    onClick={() => {
                      setIsSuccess(false);
                      setMode("login");
                      setEmail("");
                      setPassword("");
                      setErrors({});
                    }}
                    className="flex-1 rounded-lg bg-indigo-600 text-white py-2.5 text-center text-xs font-bold hover:bg-indigo-700 transition-colors cursor-pointer"
                  >
                    Sign In
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-brand-primary">
                <span className="h-2 w-2 rounded-full bg-brand-primary animate-pulse" />
                <span>Redirecting to your environment...</span>
              </div>
            )}
          </div>
        </div>
      )}
    </AuthLayout>
  );
}
