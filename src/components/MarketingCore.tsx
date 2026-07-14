import React from "react";
import { cn } from "../lib/utils";

// --- DESIGN SYSTEM SYSTEMATIC TOKENS ---

/**
 * Common Section Container to enforce uniform responsive boundaries, padding, and layout bounds
 */
export function Section({
  children,
  className,
  id,
  dark = false,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
  dark?: boolean;
}) {
  return (
    <section
      id={id}
      className={cn(
        "relative py-16 md:py-24 lg:py-28 overflow-hidden",
        dark ? "bg-brand-dark text-white" : "bg-brand-bg text-brand-dark",
        className
      )}
    >
      {children}
    </section>
  );
}

/**
 * Standard container constraint for page-width alignment
 */
export function Container({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mx-auto max-w-7xl px-6 md:px-8 w-full", className)}>
      {children}
    </div>
  );
}

/**
 * Standardized typography components to prevent layout font/size drift
 */
export function MainHeading({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h1
      className={cn(
        "font-display text-4xl sm:text-5xl lg:text-[56px] font-extrabold leading-[1.08] tracking-tight text-brand-dark",
        className
      )}
    >
      {children}
    </h1>
  );
}

export function SectionHeading({
  children,
  className,
  light = false,
}: {
  children: React.ReactNode;
  className?: string;
  light?: boolean;
}) {
  return (
    <h2
      className={cn(
        "font-display text-3xl sm:text-4xl md:text-[40px] font-extrabold leading-[1.12] tracking-tight",
        light ? "text-white" : "text-brand-dark",
        className
      )}
    >
      {children}
    </h2>
  );
}

export function CardHeading({
  children,
  className,
  light = false,
}: {
  children: React.ReactNode;
  className?: string;
  light?: boolean;
}) {
  return (
    <h3
      className={cn(
        "font-display text-lg sm:text-xl md:text-2xl font-extrabold leading-[1.2] tracking-tight",
        light ? "text-slate-100" : "text-brand-dark",
        className
      )}
    >
      {children}
    </h3>
  );
}

export function BodyProse({
  children,
  className,
  light = false,
}: {
  children: React.ReactNode;
  className?: string;
  light?: boolean;
}) {
  return (
    <p
      className={cn(
        "text-sm sm:text-base md:text-[17px] font-normal leading-relaxed",
        light ? "text-slate-400" : "text-brand-text-secondary",
        className
      )}
    >
      {children}
    </p>
  );
}

export function LabelText({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "font-mono text-[10px] sm:text-xs font-bold uppercase tracking-widest text-slate-400",
        className
      )}
    >
      {children}
    </span>
  );
}

// --- CORE REUSABLE COMPONENT ATOMS ---

/**
 * Standard Premium Enterprise Buttons supporting various brand states
 */
export function Button({
  children,
  variant = "primary",
  className,
  onClick,
  type = "button",
  disabled = false,
}: {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "outline" | "dark";
  className?: string;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg font-semibold tracking-wide text-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:pointer-events-none min-h-[44px] px-5 py-2.5",
        // Variants
        variant === "primary" &&
          "bg-brand-primary text-white shadow-sm hover:bg-brand-primary/95 focus:ring-brand-primary/40",
        variant === "secondary" &&
          "bg-brand-primary/10 text-brand-primary hover:bg-brand-primary/15 focus:ring-brand-primary/20",
        variant === "outline" &&
          "bg-white text-brand-dark border border-slate-200 hover:bg-slate-50 hover:border-slate-300 focus:ring-brand-dark/10",
        variant === "dark" &&
          "bg-[#0A1020] text-white hover:bg-slate-900 focus:ring-brand-dark/30 border border-slate-800",
        className
      )}
    >
      {children}
    </button>
  );
}

/**
 * Standard Reusable Premium Card component
 */
export function Card({
  children,
  className,
  recommended = false,
}: {
  children: React.ReactNode;
  className?: string;
  recommended?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border bg-white p-6 md:p-8 shadow-sm transition-all hover:shadow-md hover:border-slate-300 relative",
        recommended
          ? "border-brand-primary ring-1 ring-brand-primary/20"
          : "border-slate-200/80",
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * Standard Premium Badges
 */
export function Badge({
  children,
  variant = "info",
}: {
  children: React.ReactNode;
  variant?: "info" | "success" | "warning" | "premium";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider font-mono border",
        variant === "info" && "bg-slate-100 border-slate-200 text-slate-700",
        variant === "success" && "bg-emerald-50 border-emerald-100 text-emerald-600",
        variant === "warning" && "bg-amber-50 border-amber-100 text-amber-600",
        variant === "premium" && "bg-brand-primary/10 border-brand-primary/20 text-brand-primary"
      )}
    >
      {children}
    </span>
  );
}
