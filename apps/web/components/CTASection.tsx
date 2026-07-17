"use client";

import React from "react";
import { ArrowRight, Mail } from "lucide-react";

interface CTASectionProps {
  onStartFree: () => void;
}

export default function CTASection({ onStartFree }: CTASectionProps) {
  return (
    <section className="py-20 md:py-28 bg-[#F7F9FC] border-b border-slate-200">
      <div className="mx-auto max-w-7xl px-6 md:px-8 text-center">
        
        {/* Title */}
        <h2 className="font-display text-4xl md:text-5xl font-extrabold tracking-tight text-brand-dark mb-4">
          Ready to launch?
        </h2>
        
        {/* Subtitle */}
        <p className="text-base md:text-lg text-brand-text-secondary leading-relaxed max-w-xl mx-auto mb-10 px-2">
          Join thousands of companies delivering native experiences with AppOS.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={onStartFree}
            className="w-full sm:w-auto flex items-center justify-center gap-1.5 rounded-lg bg-brand-primary px-7 py-3.5 text-base font-bold text-white shadow-md shadow-brand-primary/10 hover:bg-brand-primary/95 transition-all hover:scale-[1.01] cursor-pointer"
          >
            Start for free
            <ArrowRight className="h-4.5 w-4.5" />
          </button>
          <button
            type="button"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-7 py-3.5 text-base font-semibold text-brand-dark hover:bg-slate-50 hover:border-slate-300 transition-colors cursor-pointer"
          >
            Contact Sales
          </button>
        </div>

      </div>
    </section>
  );
}
