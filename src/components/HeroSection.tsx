import React, { useState } from "react";
import { ArrowRight, Play, CheckCircle2, Laptop, Smartphone, Cpu, ShieldCheck } from "lucide-react";
import { motion } from "motion/react";

interface HeroSectionProps {
  onAnalyze: (url: string) => void;
  onSeeHowItWorks: () => void;
}

export default function HeroSection({ onAnalyze, onSeeHowItWorks }: HeroSectionProps) {
  const [urlInput, setUrlInput] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (urlInput.trim()) {
      onAnalyze(urlInput);
    } else {
      onAnalyze("https://example.com");
    }
  };

  return (
    <section id="product" className="relative overflow-hidden py-12 md:py-20 lg:py-28 bg-[#F7F9FC]">
      {/* Background elegant grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#E2E8F0_1px,transparent_1px),linear-gradient(to_bottom,#E2E8F0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30" />

      <div className="relative mx-auto max-w-7xl px-6 md:px-8">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-8">
          
          {/* Left Column (Text & CTAs) */}
          <div className="flex flex-col text-left lg:col-span-6">
            
            {/* Tagline */}
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-primary/10 bg-brand-primary/5 px-3 py-1 text-xs font-semibold tracking-wide text-brand-primary mb-6 w-fit">
              <span className="flex h-1.5 w-1.5 rounded-full bg-brand-primary animate-pulse" />
              Enterprise Platform
            </div>

            {/* Desktop Headline (screen >= 768px) */}
            <h1 className="hidden md:block font-display text-4.5xl md:text-5xl lg:text-5.5xl font-extrabold leading-[1.1] tracking-tight text-brand-dark max-w-xl">
              Turn your website into a powerful mobile app.
            </h1>

            {/* Mobile Headline (screen < 768px) */}
            <h1 className="block md:hidden text-center font-display text-3.5xl font-extrabold leading-[1.15] tracking-tight text-brand-dark mb-4">
              Your website. Your app. One platform.
            </h1>

            {/* Desktop Supporting Paragraph */}
            <p className="hidden md:block text-lg font-normal leading-relaxed text-brand-text-secondary mt-6 max-w-xl">
              AppOS transforms your web presence into secure, native-feeling iOS and Android apps. Seamless deployment, full compliance guidance, and enterprise-grade performance.
            </p>

            {/* Mobile Supporting Paragraph */}
            <p className="block md:hidden text-center text-base font-normal leading-relaxed text-brand-text-secondary mb-6 px-2">
              Transform your complex web environment into a high-performance native experience in minutes.
            </p>

            {/* Input URL for quick start */}
            <form onSubmit={handleSubmit} className="mt-8 flex flex-col sm:flex-row gap-3 w-full max-w-xl">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Enter your website URL (e.g., mysite.com)"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  className="w-full rounded-lg border border-[#CBD5E1] bg-white px-4 py-3 text-sm font-medium text-brand-dark placeholder-[#94A3B8] shadow-sm transition-all focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/15"
                />
              </div>
              <button
                type="submit"
                className="flex items-center justify-center gap-1.5 rounded-lg bg-brand-primary px-5 py-3 text-sm font-semibold text-white shadow-md shadow-brand-primary/15 hover:bg-brand-primary/95 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer whitespace-nowrap"
              >
                Create Your App
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>

            <div className="mt-4 flex flex-col sm:flex-row items-center gap-4 text-xs font-medium text-brand-text-secondary max-w-xl">
              <button
                onClick={onSeeHowItWorks}
                type="button"
                className="inline-flex items-center gap-1.5 text-brand-primary hover:text-brand-primary/95 font-semibold text-sm py-2 px-1 rounded-md transition-colors cursor-pointer"
              >
                <Play className="h-4 w-4 fill-current" />
                See How It Works
              </button>
              <span className="hidden sm:inline text-slate-300">|</span>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                Zero-code implementation
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                SOC2 Certified
              </div>
            </div>
          </div>

          {/* Right Column (High Fidelity Visual Card Flow) */}
          <div className="lg:col-span-6 w-full flex justify-center">
            <div className="w-full max-w-[540px] rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xl shadow-slate-100 relative">
              
              {/* Header inside the visual card */}
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[11px] font-mono font-semibold tracking-wider text-slate-400 uppercase">AppOS Core pipeline</span>
                </div>
                <div className="flex gap-1">
                  <span className="h-2 w-2 rounded-full bg-slate-200" />
                  <span className="h-2 w-2 rounded-full bg-slate-200" />
                  <span className="h-2 w-2 rounded-full bg-slate-200" />
                </div>
              </div>

              {/* Schematic Flow Area */}
              <div className="grid grid-cols-11 gap-2 items-center justify-center py-6 min-h-[220px]">
                
                {/* 1. Website Source (Browser Panel) */}
                <div className="col-span-4 flex flex-col items-center">
                  <div className="w-full rounded-lg border border-slate-200 bg-white shadow-md p-2.5 transition-transform hover:-translate-y-1 duration-300 relative group">
                    {/* Browser Chrome Header */}
                    <div className="flex items-center gap-1 mb-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      <div className="flex-1 bg-slate-50 rounded h-3.5 mx-1 flex items-center px-1">
                        <span className="text-[7px] text-slate-400 font-mono scale-90 origin-left">https://mywebsite.com</span>
                      </div>
                    </div>
                    {/* Content preview */}
                    <div className="space-y-1.5">
                      <div className="flex gap-1 justify-between">
                        <div className="w-1/3 h-5 rounded bg-[#F1F5F9] flex items-center justify-center">
                          <Laptop className="h-3 w-3 text-slate-400" />
                        </div>
                        <div className="w-2/3 h-5 rounded bg-brand-primary/5 flex flex-col p-1 justify-between">
                          <span className="h-0.5 w-full bg-brand-primary/20 rounded" />
                          <span className="h-0.5 w-3/4 bg-brand-primary/20 rounded" />
                        </div>
                      </div>
                      <div className="h-12 bg-slate-50 rounded p-1 space-y-1 flex flex-col justify-between">
                        <span className="h-1.5 w-5 bg-brand-primary/20 rounded" />
                        <div className="flex gap-1">
                          <div className="w-1/2 h-6 rounded bg-white border border-slate-100 flex flex-col justify-center items-center gap-0.5">
                            <span className="h-0.5 w-4 bg-brand-accent/30 rounded" />
                            <span className="h-1 w-6 bg-brand-primary/20 rounded" />
                          </div>
                          <div className="w-1/2 h-6 rounded bg-white border border-slate-100 flex flex-col justify-center items-center gap-0.5">
                            <span className="h-0.5 w-4 bg-brand-accent/30 rounded" />
                            <span className="h-1 w-5 bg-brand-primary/20 rounded" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-brand-dark mt-3">Website URL</span>
                  <span className="text-[10px] text-slate-400 font-medium">Source Web App</span>
                </div>

                {/* Arrow Connector 1 */}
                <div className="col-span-1 flex flex-col items-center justify-center relative">
                  <div className="w-full flex items-center justify-center">
                    <svg className="w-full h-4 overflow-visible" fill="none">
                      <path d="M 0,8 H 50" stroke="#CBD5E1" strokeWidth="2" strokeDasharray="4 3" />
                      <path d="M 12,8 8,4 M 12,8 8,12" stroke="#635BFF" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </div>
                </div>

                {/* 2. AI Engine (AppOS Processing Chip) */}
                <div className="col-span-1 flex flex-col items-center justify-center">
                  <div className="h-11 w-11 rounded-xl bg-brand-dark border border-brand-primary/40 flex items-center justify-center shadow-lg shadow-brand-primary/20 relative group overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,91,255,0.4)_0%,transparent_70%)] animate-pulse" />
                    <Cpu className="h-6 w-6 text-brand-primary animate-spin-slow z-10" />
                  </div>
                </div>

                {/* Arrow Connector 2 */}
                <div className="col-span-1 flex flex-col items-center justify-center">
                  <div className="w-full flex items-center justify-center">
                    <svg className="w-full h-4 overflow-visible" fill="none">
                      <path d="M 0,8 H 50" stroke="#CBD5E1" strokeWidth="2" strokeDasharray="4 3" />
                      <path d="M 12,8 8,4 M 12,8 8,12" stroke="#635BFF" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </div>
                </div>

                {/* 3. Mobile Device Targets */}
                <div className="col-span-4 flex gap-1.5 justify-center">
                  
                  {/* Light Phone (iOS) */}
                  <div className="w-[85px] rounded-xl border border-slate-200 bg-slate-50 shadow-md p-1 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1">
                    {/* Status notch */}
                    <div className="w-8 h-1.5 bg-slate-900 rounded-full mx-auto mb-1" />
                    {/* Content */}
                    <div className="flex-1 bg-white rounded-lg border border-slate-100 p-1 flex flex-col justify-between gap-1">
                      {/* Title bar */}
                      <div className="flex items-center justify-between border-b border-slate-100 pb-1">
                        <span className="text-[6px] font-bold text-brand-dark">Dashboard</span>
                        <div className="h-1.5 w-1.5 rounded-full bg-brand-primary/20" />
                      </div>
                      {/* Metric visual */}
                      <div className="rounded bg-brand-primary/5 p-1 flex flex-col gap-0.5">
                        <span className="text-[5px] text-slate-400">Total Users</span>
                        <span className="text-[8px] font-extrabold text-brand-primary">14.8K</span>
                      </div>
                      {/* Quick chart mockup */}
                      <div className="h-6 w-full flex items-end gap-0.5 pb-1">
                        <div className="h-1/3 w-1/5 bg-slate-200 rounded-sm" />
                        <div className="h-2/3 w-1/5 bg-slate-200 rounded-sm" />
                        <div className="h-1/2 w-1/5 bg-slate-200 rounded-sm" />
                        <div className="h-full w-1/5 bg-brand-primary rounded-sm" />
                        <div className="h-3/4 w-1/5 bg-brand-accent rounded-sm" />
                      </div>
                      {/* Bottom navigation */}
                      <div className="flex justify-around items-center border-t border-slate-100 pt-0.5">
                        <span className="h-1 w-1 rounded-full bg-brand-primary" />
                        <span className="h-1 w-1 bg-slate-200 rounded-full" />
                        <span className="h-1 w-1 bg-slate-200 rounded-full" />
                      </div>
                    </div>
                    <span className="text-[8px] text-center font-bold text-brand-dark mt-1">iOS App</span>
                  </div>

                  {/* Dark Phone (Android) */}
                  <div className="w-[85px] rounded-xl border border-slate-800 bg-[#0F172A] shadow-md p-1 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1">
                    {/* Camera dot */}
                    <div className="w-1 h-1 bg-slate-700 rounded-full mx-auto mb-1.5" />
                    {/* Content */}
                    <div className="flex-1 bg-[#1E293B] rounded-lg border border-slate-800 p-1 flex flex-col justify-between gap-1">
                      {/* Title bar */}
                      <div className="flex items-center justify-between border-b border-slate-800 pb-1">
                        <span className="text-[6px] font-bold text-slate-200">Dashboard</span>
                        <div className="h-1.5 w-1.5 rounded-full bg-brand-accent/20" />
                      </div>
                      {/* Metric visual */}
                      <div className="rounded bg-[#0F172A] p-1 flex flex-col gap-0.5">
                        <span className="text-[5px] text-slate-500">Total Users</span>
                        <span className="text-[8px] font-extrabold text-brand-accent">14.8K</span>
                      </div>
                      {/* Quick chart mockup */}
                      <div className="h-6 w-full flex items-end gap-0.5 pb-1">
                        <div className="h-1/3 w-1/5 bg-slate-800 rounded-sm" />
                        <div className="h-2/3 w-1/5 bg-slate-800 rounded-sm" />
                        <div className="h-1/2 w-1/5 bg-slate-800 rounded-sm" />
                        <div className="h-full w-1/5 bg-brand-accent rounded-sm" />
                        <div className="h-3/4 w-1/5 bg-brand-primary rounded-sm" />
                      </div>
                      {/* Bottom navigation */}
                      <div className="flex justify-around items-center border-t border-slate-800 pt-0.5">
                        <span className="h-1 w-1 rounded-full bg-brand-accent" />
                        <span className="h-1 w-1 bg-slate-700 rounded-full" />
                        <span className="h-1 w-1 bg-slate-700 rounded-full" />
                      </div>
                    </div>
                    <span className="text-[8px] text-center font-bold text-slate-400 mt-1">Android</span>
                  </div>

                </div>

              </div>

              {/* Status and telemetry indicator to look premium but strictly literal (no slop) */}
              <div className="mt-6 flex items-center justify-between bg-slate-50 rounded-xl p-3 border border-slate-100">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-brand-primary" />
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-bold text-brand-dark">Direct Store Publishing</span>
                    <span className="text-[10px] text-brand-text-secondary">Full conformance to Apple and Google Play policies</span>
                  </div>
                </div>
                <div className="rounded-lg bg-emerald-50 border border-emerald-100 px-2 py-0.5">
                  <span className="text-[9px] font-bold text-emerald-600 uppercase font-mono">Verified</span>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
