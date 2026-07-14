import React from "react";
import { ShieldCheck, Lock, CheckCircle, ShieldAlert } from "lucide-react";
import { motion } from "motion/react";

export default function SecuritySection() {
  return (
    <section id="security" className="py-16 md:py-24 bg-brand-dark text-white relative overflow-hidden">
      {/* Decorative dark background patterns */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,91,255,0.06)_0%,transparent_60%)] pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-primary/20 to-transparent" />

      <div className="mx-auto max-w-7xl px-6 md:px-8 relative z-10 text-center">
        
        {/* Subtle Security Icon */}
        <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 border border-white/10 mb-6 text-brand-primary">
          <ShieldCheck className="h-6 w-6 stroke-[1.5]" />
        </div>

        {/* Desktop Title & Subtitle */}
        <div className="hidden md:block max-w-3xl mx-auto">
          <h2 className="font-display text-3.5xl md:text-4.5xl font-extrabold tracking-tight mb-4">
            Enterprise security by default.
          </h2>
          <p className="text-base md:text-lg text-slate-400 leading-relaxed max-w-2xl mx-auto mb-12">
            AppOS is built on a foundation of zero-trust architecture. We handle compliance so you can focus on building your product.
          </p>

          {/* Desktop Security Certification Badges */}
          <div className="flex flex-wrap justify-center gap-4.5">
            <div className="inline-flex items-center gap-2 rounded-lg bg-white/3 border border-white/8 px-4.5 py-3 hover:border-white/15 transition-all">
              <CheckCircle className="h-4.5 w-4.5 text-emerald-400" />
              <span className="text-sm font-semibold tracking-wide text-slate-200">SOC2 Type II</span>
            </div>
            <div className="inline-flex items-center gap-2 rounded-lg bg-white/3 border border-white/8 px-4.5 py-3 hover:border-white/15 transition-all">
              <CheckCircle className="h-4.5 w-4.5 text-emerald-400" />
              <span className="text-sm font-semibold tracking-wide text-slate-200">GDPR Compliant</span>
            </div>
            <div className="inline-flex items-center gap-2 rounded-lg bg-white/3 border border-white/8 px-4.5 py-3 hover:border-white/15 transition-all">
              <CheckCircle className="h-4.5 w-4.5 text-emerald-400" />
              <span className="text-sm font-semibold tracking-wide text-slate-200">E2E Encryption</span>
            </div>
          </div>
        </div>

        {/* Mobile Title, Subtitle, and Data Rows (exact mobile layout from Stitch) */}
        <div className="block md:hidden text-left">
          
          <h2 className="text-center font-display text-2.5xl font-extrabold tracking-tight mb-4 text-white">
            Enterprise-Grade Security
          </h2>
          
          <p className="text-center text-sm font-medium text-slate-400 leading-relaxed mb-8 px-1">
            Bank-level encryption and SOC2 compliance built into the core. Your data never leaves our secure perimeter.
          </p>

          {/* Mobile data grid rows */}
          <div className="flex flex-col gap-3 max-w-[390px] mx-auto">
            
            {/* Row 1: Data Encryption */}
            <div className="flex items-center justify-between rounded-lg bg-[#111928] border border-white/5 p-4.5">
              <div className="flex flex-col text-left">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">Encryption</span>
                <span className="text-sm font-extrabold text-white mt-1">Data Encryption</span>
              </div>
              <span className="rounded bg-[#1E293B] border border-slate-700 px-3 py-1 text-xs font-bold text-slate-300 font-mono">
                AES-256
              </span>
            </div>

            {/* Row 2: Compliance */}
            <div className="flex items-center justify-between rounded-lg bg-[#111928] border border-white/5 p-4.5">
              <div className="flex flex-col text-left">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">Standards</span>
                <span className="text-sm font-extrabold text-white mt-1">Compliance</span>
              </div>
              <span className="rounded bg-brand-primary/15 border border-brand-primary/30 px-3 py-1 text-xs font-bold text-brand-primary font-mono">
                SOC2 Type II
              </span>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
