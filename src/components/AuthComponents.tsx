import React, { useState } from "react";
import { Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import { cn } from "../lib/utils";

/**
 * 1. AuthLogo - AppOS branded wireframe logo
 */
export function AuthLogo({ className, light = false }: { className?: string; light?: boolean }) {
  return (
    <div className={cn("flex items-center gap-2.5 select-none", className)}>
      <div className={cn(
        "relative flex h-9 w-9 items-center justify-center rounded-xl shadow-md transition-all",
        light 
          ? "bg-brand-primary text-white shadow-brand-primary/20" 
          : "bg-brand-primary text-white shadow-brand-primary/10"
      )}>
        <svg
          className="h-5.5 w-5.5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M9 17V7l6 10V7" />
        </svg>
      </div>
      <span className={cn(
        "font-display text-xl font-extrabold tracking-tight",
        light ? "text-white" : "text-brand-dark"
      )}>
        App<span className="text-brand-primary">OS</span>
      </span>
    </div>
  );
}

/**
 * 2. Left Panel - Premium website analysis engine diagram (Desktop only)
 */
export function LeftPanel() {
  return (
    <div className="w-full h-full flex flex-col justify-between py-12 px-10 relative bg-[#090E1A]">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full bg-brand-primary/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-[#00A8FF]/5 blur-[120px] pointer-events-none" />

      {/* Top logo */}
      <div className="relative z-10">
        <AuthLogo light />
      </div>

      {/* Middle technical visualization */}
      <div className="relative z-10 my-auto flex flex-col items-center justify-center w-full max-w-sm mx-auto">
        {/* Source URL box */}
        <div className="w-full rounded-xl border border-slate-800 bg-[#0E1526]/90 p-3.5 shadow-lg flex items-center justify-center">
          <span className="font-mono text-xs text-slate-400">
            source: <span className="text-brand-primary font-semibold">https://website.com</span>
          </span>
        </div>

        {/* Vertical connecter line */}
        <div className="h-10 w-px bg-gradient-to-b from-brand-primary/80 to-brand-primary/30 relative flex items-center justify-center">
          <div className="h-2 w-2 rounded-full bg-brand-primary animate-ping absolute" />
          <div className="h-1.5 w-1.5 rounded-full bg-brand-primary absolute" />
        </div>

        {/* Intelligence Engine Processing Node */}
        <div className="w-full rounded-2xl border border-brand-primary/30 bg-[#0A1020] p-5 shadow-2xl relative overflow-hidden ring-1 ring-brand-primary/10">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-brand-primary/50 to-transparent" />
          
          {/* Header */}
          <div className="flex justify-between items-center mb-4">
            <span className="font-mono text-[11px] font-bold text-slate-400 tracking-wider">
              AppOS.Intelligence_Engine
            </span>
            <div className="flex items-center gap-1.5 bg-brand-primary/10 text-brand-primary px-2 py-0.5 rounded-full border border-brand-primary/20">
              <span className="h-1 w-1 rounded-full bg-brand-primary animate-pulse" />
              <span className="font-mono text-[9px] font-bold uppercase tracking-wide">ACTIVE</span>
            </div>
          </div>

          {/* Console readout */}
          <div className="space-y-2.5 font-mono text-[11px] text-slate-300">
            <div className="flex justify-between items-center">
              <span className="text-emerald-400">&gt; parsing_dom...</span>
              <span className="text-slate-500">latency: 12ms</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-brand-primary">&gt; extracting_assets...</span>
              <span className="text-slate-500">cache: HIT</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#00A8FF]">&gt; mapping_routes... [OK]</span>
              <span className="text-emerald-500/80 font-bold">100%</span>
            </div>
          </div>
        </div>

        {/* Downward Connector with Arrow */}
        <div className="h-10 w-px bg-gradient-to-b from-brand-primary/30 to-slate-800 relative flex items-center justify-center">
          <div className="absolute -bottom-1.5 flex h-[18px] w-[18px] items-center justify-center rounded-full border border-slate-800 bg-[#0A1020] text-slate-400 shadow-sm">
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </div>
        </div>

        {/* Output Box */}
        <div className="w-full rounded-xl border border-slate-800 bg-[#0E1526]/90 p-3.5 mt-2.5 shadow-lg flex items-center justify-between">
          <span className="font-mono text-xs text-slate-400">
            output: <span className="text-emerald-400 font-semibold">Native_Bundle</span>
          </span>
          <div className="flex gap-2 text-slate-500">
            {/* Phone Icon */}
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="5" y="2" width="14" height="20" rx="2" />
              <line x1="12" y1="18" x2="12.01" y2="18" strokeWidth="3" />
            </svg>
            {/* Android Icon */}
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17.52 14.3c-.5.03-.92-.3-.95-.8-.03-.5.3-.92.8-.95.5-.03.92.3.95.8.03.5-.3.92-.8.95zm-11.04 0c-.5.03-.92-.3-.95-.8-.03-.5.3-.92.8-.95.5-.03.92.3.95.8.03.5-.3.92-.8.95zm11.13-2.61l1.86-3.22c.1-.18.04-.41-.14-.51-.18-.1-.41-.04-.51.14l-1.88 3.25C15.35 10.51 13.75 10 12 10s-3.35.51-4.94 1.35L5.18 8.1c-.1-.18-.33-.24-.51-.14-.18.1-.24.33-.14.51l1.86 3.22C3.21 13.52 1 16.51 1 20h22c0-3.49-2.21-6.48-5.39-8.31z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Footer system status */}
      <div className="relative z-10 border-t border-slate-900 pt-4">
        <span className="font-mono text-[10px] font-bold text-slate-500 uppercase tracking-widest">
          APPOS AUTHENTICATION // SECURE ACCOUNT ACCESS
        </span>
      </div>
    </div>
  );
}

/**
 * 3. AuthLayout - Combines left & right columns
 */
export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white flex flex-col lg:flex-row antialiased">
      {/* Left section: Visuals (desktop only) */}
      <div className="hidden lg:block lg:w-[42%] xl:w-[38%] shrink-0 border-r border-slate-900 bg-[#090E1A]">
        <LeftPanel />
      </div>

      {/* Right section: Form Content */}
      <div className="flex-1 flex flex-col justify-center items-center py-10 px-6 sm:px-12 lg:px-16 xl:px-24 bg-white overflow-y-auto">
        <div className="w-full max-w-[440px] flex flex-col justify-center min-h-[80vh] py-4">
          {children}
        </div>
      </div>
    </div>
  );
}

/**
 * 4. FormField - Reusable text field with states
 */
export interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  id: string;
  error?: string;
  icon?: React.ReactNode;
}

export const FormField = React.forwardRef<HTMLInputElement, FormFieldProps>(
  ({ label, id, error, icon, className, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5 w-full text-left">
        <label htmlFor={id} className="text-xs font-bold text-slate-700 tracking-wide select-none">
          {label}
        </label>
        <div className="relative rounded-lg shadow-sm">
          {icon && (
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              {icon}
            </div>
          )}
          <input
            id={id}
            ref={ref}
            className={cn(
              "block w-full rounded-lg border bg-white py-2.5 text-sm transition-all focus:outline-none focus:ring-2 placeholder-slate-400 text-brand-dark min-h-[44px]",
              icon ? "pl-10 pr-4" : "px-4",
              error
                ? "border-rose-500 focus:border-rose-500 focus:ring-rose-500/15"
                : "border-slate-200 hover:border-slate-300 focus:border-brand-primary focus:ring-brand-primary/10",
              className
            )}
            {...props}
          />
        </div>
        {error && (
          <span className="text-[11px] font-medium text-rose-500 mt-1 select-none">
            {error}
          </span>
        )}
      </div>
    );
  }
);

FormField.displayName = "FormField";

/**
 * 5. PasswordField - Custom password field with toggle and strength indicator
 */
export interface PasswordFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  id: string;
  error?: string;
  value: string;
}

export const PasswordField = React.forwardRef<HTMLInputElement, PasswordFieldProps>(
  ({ label, id, error, value, className, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);

    // Dynamic password strength evaluation
    const evaluateStrength = (val: string) => {
      if (!val) return { score: 0, text: "", color: "bg-slate-100", textColor: "text-slate-400" };
      
      const commonPasswords = ["password", "123456", "qwerty", "password123"];
      const valLower = val.toLowerCase();
      const containsSequential = /123456|qwerty|asdfg|abcdef/i.test(valLower);
      if (commonPasswords.includes(valLower) || containsSequential) {
        return { score: 1, text: "Common/Weak", color: "bg-rose-500", textColor: "text-rose-500" };
      }

      if (val.length < 12) {
        return { score: 1, text: "Too Short (Min 12)", color: "bg-rose-500", textColor: "text-rose-500" };
      }
      
      const hasUpper = /[A-Z]/.test(val);
      const hasLower = /[a-z]/.test(val);
      const hasDigit = /[0-9]/.test(val);
      const hasSpecial = /[^A-Za-z0-9]/.test(val);

      let score = 2; // Base score of 2 since it meets length requirement

      // Increase score based on complexity
      const criteriaCount = [hasUpper, hasLower, hasDigit, hasSpecial].filter(Boolean).length;
      if (criteriaCount >= 3) {
        score = 3;
      }
      if (criteriaCount === 4) {
        score = 4;
      }

      // Return details
      if (score === 2) return { score: 2, text: "Weak (Need special chars)", color: "bg-rose-500", textColor: "text-rose-500" };
      if (score === 3) return { score: 3, text: "Fair/Good", color: "bg-amber-500", textColor: "text-amber-500" };
      return { score: 4, text: "Strong", color: "bg-emerald-500", textColor: "text-emerald-500" };
    };

    const strength = evaluateStrength(value);

    return (
      <div className="flex flex-col gap-1.5 w-full text-left">
        <label htmlFor={id} className="text-xs font-bold text-slate-700 tracking-wide select-none">
          {label}
        </label>
        <div className="relative rounded-lg shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Lock className="h-4 w-4" />
          </div>
          <input
            id={id}
            type={showPassword ? "text" : "password"}
            ref={ref}
            className={cn(
              "block w-full rounded-lg border bg-white py-2.5 pl-10 pr-10 text-sm transition-all focus:outline-none focus:ring-2 placeholder-slate-400 text-brand-dark min-h-[44px]",
              error
                ? "border-rose-500 focus:border-rose-500 focus:ring-rose-500/15"
                : "border-slate-200 hover:border-slate-300 focus:border-brand-primary focus:ring-brand-primary/10",
              className
            )}
            {...props}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-brand-dark focus:outline-none cursor-pointer"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>

        {/* Strength segments */}
        {value && (
          <div className="mt-2 flex flex-col gap-1">
            <div className="grid grid-cols-4 gap-1.5 h-1 w-full">
              {[1, 2, 3, 4].map((index) => {
                const isActive = index <= strength.score;
                return (
                  <div
                    key={index}
                    className={cn(
                      "h-full rounded-full transition-all duration-300",
                      isActive ? strength.color : "bg-slate-100"
                    )}
                  />
                );
              })}
            </div>
            <div className="flex justify-between items-center text-[10px] font-bold tracking-wide uppercase font-mono mt-0.5">
              <span className="text-slate-400">Strength:</span>
              <span className={strength.textColor}>{strength.text}</span>
            </div>
          </div>
        )}

        {error && (
          <span className="text-[11px] font-medium text-rose-500 mt-1 select-none">
            {error}
          </span>
        )}
      </div>
    );
  }
);

PasswordField.displayName = "PasswordField";

/**
 * 6. SocialAuthButton - Clean white third-party authentications
 */
export function SocialAuthButton({
  provider,
  onClick,
  className,
  loading,
  disabled
}: {
  provider: "google" | "apple";
  onClick?: () => void;
  className?: string;
  loading?: boolean;
  disabled?: boolean;
}) {
  const isGoogle = provider === "google";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      aria-busy={loading ? "true" : undefined}
      className={cn(
        "w-full flex items-center justify-center gap-2.5 rounded-lg border border-slate-200 bg-white py-2.5 text-sm font-semibold text-brand-dark shadow-sm hover:bg-slate-50 hover:border-slate-300 active:scale-[0.99] transition-all cursor-pointer min-h-[44px] px-4",
        (disabled || loading) && "opacity-50 pointer-events-none",
        className
      )}
    >
      {isGoogle && (
        // Google Colorful G
        <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" width="16" height="16">
          <path
            fill="#EA4335"
            d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3A11.944 11.944 0 0 0 12 .909c-4.327 0-8.118 2.29-10.227 5.727l3.49 3.13z"
          />
          <path
            fill="#4285F4"
            d="M23.09 12.273c0-.818-.082-1.609-.218-2.364H12v4.51h6.218a5.31 5.31 0 0 1-2.3 3.49l3.49 3.13c2.045-1.89 3.227-4.681 3.227-8.766z"
          />
          <path
            fill="#FBBC05"
            d="M5.266 14.235A7.017 7.017 0 0 1 4.91 12c0-.79.136-1.545.355-2.235L1.773 6.636A11.92 11.92 0 0 0 0 12c0 1.92.455 3.736 1.255 5.364l4.01-3.13z"
          />
          <path
            fill="#34A853"
            d="M12 23.091c3.245 0 5.973-1.073 7.964-2.918l-3.49-3.13a7.126 7.126 0 0 1-4.474 1.273c-3.564 0-6.582-2.4-7.664-5.636L1.255 17.36A11.95 11.95 0 0 0 12 23.09z"
          />
        </svg>
      )}
      {!isGoogle && (
        // Apple Logo SVG
        <svg className="h-4 w-4 text-brand-dark fill-current shrink-0" viewBox="0 0 24 24" width="16" height="16">
          <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-.96.04-2.13.64-2.82 1.45-.6.7-1.13 1.84-1.01 2.95 1.07.08 2.18-.53 2.84-1.34z" />
        </svg>
      )}
      {loading && <Loader2 className="h-4 w-4 animate-spin text-slate-500 shrink-0 ml-1" />}
      <span>{loading ? (isGoogle ? "Opening Google..." : "Connecting...") : `Continue with ${isGoogle ? "Google" : "Apple"}`}</span>
    </button>
  );
}

/**
 * 7. Divider - Separator with "or"
 */
export function Divider({ children = "OR" }: { children?: React.ReactNode }) {
  return (
    <div className="relative flex py-4 items-center w-full">
      <div className="flex-grow border-t border-slate-100" />
      <span className="flex-shrink mx-4 text-slate-400 font-mono text-[10px] font-bold uppercase tracking-wider select-none">
        {children}
      </span>
      <div className="flex-grow border-t border-slate-100" />
    </div>
  );
}

/**
 * 8. PrimaryButton - Auth CTA button with spinners
 */
export function PrimaryButton({
  children,
  onClick,
  type = "button",
  loading = false,
  disabled = false,
  className
}: {
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  loading?: boolean;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        "w-full flex items-center justify-center gap-2 rounded-lg bg-brand-primary py-2.5 text-sm font-bold text-white shadow-md hover:bg-brand-primary/95 transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer min-h-[44px] px-4",
        className
      )}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin text-white" />}
      <span>{children}</span>
    </button>
  );
}
