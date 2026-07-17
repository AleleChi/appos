"use client";

import React, { useState } from "react";
import { Check, X, Shield, Star, Lock, ShieldCheck, ArrowRight, Code } from "lucide-react";
import { Section, Container, MainHeading, SectionHeading, CardHeading, BodyProse, LabelText, Button, Card, Badge } from "./MarketingCore";
import { motion } from "framer-motion";

interface PricingSectionProps {
  onGetStarted: () => void;
}

export default function PricingSection({ onGetStarted }: PricingSectionProps) {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annually">("monthly");

  // Plan Prices (Desktop)
  const desktopPlans = [
    {
      name: "Starter",
      description: "Perfect for side projects and learning.",
      price: { monthly: 0, annually: 0 },
      features: [
        { name: "Core native features", included: true },
        { name: "Community support", included: true },
        { name: "Push notifications", included: false },
        { name: "Biometric Auth", included: false },
      ],
      buttonText: "Start for free",
      variant: "outline" as const,
    },
    {
      name: "Professional",
      description: "For growing apps needing serious power.",
      price: { monthly: 99, annually: 79 },
      features: [
        { name: "Everything in Starter", included: true },
        { name: "Push notifications", included: true },
        { name: "Biometric Auth", included: true },
        { name: "Priority support", included: true },
      ],
      buttonText: "Get Started",
      variant: "primary" as const,
      recommended: true,
    },
    {
      name: "Agency",
      description: "For teams managing multiple client apps.",
      price: { monthly: 499, annually: 399 },
      features: [
        { name: "Everything in Pro", included: true },
        { name: "Multi-app management", included: true },
        { name: "Custom branding", included: true },
        { name: "Dedicated Account Manager", included: true },
      ],
      buttonText: "Contact Sales",
      variant: "outline" as const,
    },
    {
      name: "Enterprise",
      description: "Mission-critical infrastructure & security.",
      price: { monthly: "Custom", annually: "Custom" },
      features: [
        { name: "Security-first architecture", included: true },
        { name: "E2E encryption", included: true },
        { name: "24/7 uptime SLA", included: true },
        { name: "Custom integrations", included: true },
      ],
      buttonText: "Contact Sales",
      variant: "dark" as const,
    },
  ];

  // Plan Prices (Mobile Specific - exact representation from mobile mockup)
  const mobilePlans = [
    {
      name: "Starter",
      description: "For hobbyists and small projects.",
      price: { monthly: 15, annually: 12 },
      features: [
        { name: "Up to 3 projects", included: true },
        { name: "Basic analytics", included: true },
        { name: "Community support", included: true },
      ],
      buttonText: "Get Started",
      variant: "outline" as const,
    },
    {
      name: "Professional",
      description: "For growing teams and businesses.",
      price: { monthly: 49, annually: 39 },
      features: [
        { name: "Unlimited projects", included: true },
        { name: "Advanced analytics", included: true },
        { name: "Priority email support", included: true },
        { name: "Custom domains", included: true },
      ],
      buttonText: "Start Free Trial",
      variant: "primary" as const,
      recommended: true,
    },
    {
      name: "Enterprise",
      description: "For large-scale applications.",
      price: { monthly: "Custom", annually: "Custom" },
      features: [
        { name: "Dedicated infrastructure", included: true },
        { name: "SLA guarantees", included: true },
        { name: "24/7 phone support", included: true },
      ],
      buttonText: "Contact Sales",
      variant: "outline" as const,
    },
  ];

  return (
    <div id="pricing-page" className="bg-[#F7F9FC]">
      {/* 1. Header Section */}
      <section className="pt-20 pb-12 md:pt-28 md:pb-16 bg-[#F7F9FC]">
        <Container className="text-center">
          {/* Subtle Page Label */}
          <LabelText className="text-brand-primary mb-3 block">Pricing Plans</LabelText>

          {/* Title */}
          <h1 className="font-display text-3.5xl sm:text-5xl md:text-[52px] font-extrabold tracking-tight text-brand-dark max-w-4xl mx-auto leading-[1.1]">
            <span className="hidden md:inline">Simple, transparent pricing for every stage of growth.</span>
            <span className="inline md:hidden">Simple, transparent pricing</span>
          </h1>

          {/* Subtitle */}
          <p className="mt-5 text-sm sm:text-base md:text-lg text-brand-text-secondary max-w-2xl mx-auto leading-relaxed">
            <span className="hidden md:inline">
              Start building for free, then upgrade when you need advanced native features, better support, and enterprise-grade security.
            </span>
            <span className="inline md:hidden">
              Choose the plan that best fits your project's needs. All plans include standard technical support.
            </span>
          </p>

          {/* Toggle Billing Switcher */}
          <div className="mt-10 inline-flex items-center gap-1 bg-[#E2E8F0]/60 p-1.5 rounded-full border border-slate-200 shadow-sm">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`px-5 py-2 text-xs sm:text-sm font-semibold rounded-full transition-all cursor-pointer ${
                billingCycle === "monthly"
                  ? "bg-white text-brand-dark shadow-sm"
                  : "text-brand-text-secondary hover:text-brand-dark"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle("annually")}
              className={`relative px-5 py-2 text-xs sm:text-sm font-semibold rounded-full transition-all flex items-center gap-1.5 cursor-pointer ${
                billingCycle === "annually"
                  ? "bg-white text-brand-dark shadow-sm"
                  : "text-brand-text-secondary hover:text-brand-dark"
              }`}
            >
              <span>Annually</span>
              <span className="hidden sm:inline bg-brand-primary text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase scale-90">
                Save 20%
              </span>
              <span className="inline sm:hidden bg-brand-primary text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase">
                -20%
              </span>
            </button>
          </div>
        </Container>
      </section>

      {/* 2. Pricing Cards Grid */}
      <section className="pb-16 md:pb-24">
        <Container>
          
          {/* A. Desktop/Tablet Cards Layout (Visible only on screens >= md) */}
          <div className="hidden md:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
            {desktopPlans.map((plan, idx) => (
              <div key={idx} className="relative flex flex-col h-full">
                
                {/* Recommended Tag */}
                {plan.recommended && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10">
                    <span className="rounded-full bg-brand-primary px-4 py-1 text-[11px] font-extrabold text-white uppercase tracking-wider shadow-sm">
                      Recommended
                    </span>
                  </div>
                )}

                <Card
                  recommended={plan.recommended}
                  className="flex flex-col justify-between h-full hover:scale-[1.01] transition-transform duration-300"
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-center gap-1.5 mb-2">
                      {plan.recommended && <Star className="h-4.5 w-4.5 text-brand-primary fill-brand-primary/10" />}
                      <span className="font-display text-lg font-bold text-brand-dark">{plan.name}</span>
                    </div>
                    <p className="text-xs text-brand-text-secondary min-h-[32px] mb-6">{plan.description}</p>

                    {/* Pricing */}
                    <div className="mb-6 flex items-baseline gap-1">
                      <span className="text-4xl font-black text-brand-dark tracking-tight font-mono">
                        {typeof plan.price[billingCycle] === "number"
                          ? `$${plan.price[billingCycle]}`
                          : plan.price[billingCycle]}
                      </span>
                      {typeof plan.price[billingCycle] === "number" && (
                        <span className="text-xs font-semibold text-slate-400">/mo</span>
                      )}
                    </div>

                    {/* Features List */}
                    <div className="h-px bg-slate-100 my-4" />
                    <ul className="space-y-3.5">
                      {plan.features.map((feat, fIdx) => (
                        <li key={fIdx} className="flex items-start gap-2.5 text-xs">
                          {feat.included ? (
                            <Check className="h-4 w-4 text-brand-primary shrink-0 stroke-[2.5]" />
                          ) : (
                            <X className="h-4 w-4 text-slate-300 shrink-0 stroke-[2.5]" />
                          )}
                          <span className={feat.included ? "text-brand-dark font-medium" : "text-slate-400 line-through"}>
                            {feat.name}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Actions */}
                  <div className="mt-8">
                    <Button
                      variant={plan.variant}
                      onClick={onGetStarted}
                      className="w-full text-xs font-bold"
                    >
                      {plan.buttonText}
                    </Button>
                  </div>
                </Card>
              </div>
            ))}
          </div>

          {/* B. Mobile Cards Layout (Visible only on screens < md - exact mobile mockup match) */}
          <div className="flex md:hidden flex-col gap-6">
            {mobilePlans.map((plan, idx) => (
              <div key={idx} className="relative flex flex-col w-full">
                
                {/* Most Popular Tag */}
                {plan.recommended && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                    <span className="rounded-full bg-brand-primary px-4.5 py-1 text-[10px] font-black text-white uppercase tracking-wider">
                      Most Popular
                    </span>
                  </div>
                )}

                <div
                  className={`rounded-xl border bg-white p-6 shadow-sm flex flex-col justify-between ${
                    plan.recommended ? "border-brand-primary ring-1 ring-brand-primary/20" : "border-slate-200"
                  }`}
                >
                  <div className="text-left">
                    <h3 className="font-display text-xl font-extrabold text-brand-dark mb-1">{plan.name}</h3>
                    <p className="text-xs font-medium text-brand-text-secondary leading-normal mb-5">{plan.description}</p>
                    
                    {/* Price */}
                    <div className="flex items-baseline gap-1 mb-5">
                      <span className="text-4.5xl font-black text-brand-dark font-mono tracking-tight">
                        {typeof plan.price[billingCycle] === "number"
                          ? `$${plan.price[billingCycle]}`
                          : plan.price[billingCycle]}
                      </span>
                      {typeof plan.price[billingCycle] === "number" && (
                        <span className="text-sm font-semibold text-slate-400">/mo</span>
                      )}
                    </div>

                    {/* Button */}
                    <Button
                      variant={plan.variant}
                      onClick={onGetStarted}
                      className="w-full text-sm font-extrabold mb-6"
                    >
                      {plan.buttonText}
                    </Button>

                    {/* Features list */}
                    <ul className="space-y-3 pt-4 border-t border-slate-100">
                      {plan.features.map((feat, fIdx) => (
                        <li key={fIdx} className="flex items-center gap-2.5 text-xs text-brand-dark font-bold">
                          <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary">
                            <Check className="h-3 w-3 stroke-[3]" />
                          </div>
                          <span>{feat.name}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </Container>
      </section>

      {/* 3. Compare Features Matrix (Visible on Mobile) */}
      <section className="pb-16 block md:hidden bg-white py-12 border-y border-slate-100">
        <Container>
          <div className="max-w-[390px] mx-auto rounded-xl border border-slate-200 overflow-hidden bg-white shadow-sm">
            
            {/* Header */}
            <div className="p-4.5 bg-slate-50 border-b border-slate-200">
              <h3 className="font-display text-base font-extrabold text-brand-dark">Compare Features</h3>
            </div>

            {/* Matrix details */}
            <div className="p-4.5 space-y-5">
              
              {/* Category 1 */}
              <div>
                <span className="text-[11px] font-mono font-bold text-brand-dark tracking-wider uppercase block mb-3">
                  Core Platform
                </span>
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-xs pb-1.5 border-b border-slate-100">
                    <span className="text-brand-text-secondary font-medium">API Requests</span>
                    <span className="text-brand-dark font-bold">10k / 1M / Unlim.</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-brand-text-secondary font-medium">Data Storage</span>
                    <span className="text-brand-dark font-bold">5GB / 50GB / Custom</span>
                  </div>
                </div>
              </div>

              {/* Category 2 */}
              <div className="pt-2">
                <span className="text-[11px] font-mono font-bold text-brand-dark tracking-wider uppercase block mb-3">
                  Security
                </span>
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-xs pb-1.5 border-b border-slate-100">
                    <span className="text-brand-text-secondary font-medium">SSO Integration</span>
                    <span className="text-brand-dark font-bold">Pro & Ent only</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-brand-text-secondary font-medium">Security-First Architecture</span>
                    <span className="text-brand-dark font-bold">All plans</span>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </Container>
      </section>

      {/* 4. Enterprise-Grade Security Section */}
      <section className="py-16 md:py-24 bg-brand-dark text-white relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,91,255,0.06)_0%,transparent_60%)] pointer-events-none" />
        
        <Container>
          
          {/* Desktop Security Layout (screen >= md) */}
          <div className="hidden md:grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            
            {/* Left Description Column */}
            <div className="lg:col-span-5 text-left">
              <h2 className="font-display text-3xl md:text-4xl lg:text-[40px] font-extrabold leading-[1.12] tracking-tight text-white mb-6">
                Enterprise-grade security by default.
              </h2>
              <p className="text-base text-slate-400 leading-relaxed mb-10 max-w-lg">
                We take security seriously so you don't have to. Every AppOS instance is built on a foundation of zero-trust architecture.
              </p>

              {/* Dynamic Badges with inline info */}
              <div className="space-y-5">
                <div className="flex items-center gap-3.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/5 border border-white/10 text-brand-primary">
                    <ShieldCheck className="h-5.5 w-5.5" />
                  </div>
                  <span className="text-sm font-bold text-slate-200">Security-first architecture</span>
                </div>
                <div className="flex items-center gap-3.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/5 border border-white/10 text-brand-primary">
                    <Lock className="h-5.5 w-5.5" />
                  </div>
                  <span className="text-sm font-bold text-slate-200">End-to-End Encryption</span>
                </div>
              </div>
            </div>

            {/* Right Code Block Column */}
            <div className="lg:col-span-7 flex justify-end">
              <div className="w-full max-w-[560px] rounded-2xl border border-slate-800 bg-[#0E1526] shadow-xl p-5 relative overflow-hidden font-mono text-xs text-left">
                {/* Visual Mac-style Window Topbar */}
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-4">
                  <div className="flex gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-rose-500/80" />
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
                  </div>
                  <span className="text-[10px] text-slate-500 font-bold tracking-wider">appOS.config.js</span>
                  <div className="w-8" />
                </div>
                
                {/* Code syntax */}
                <div className="space-y-1.5 text-slate-300">
                  <div>
                    <span className="text-rose-400">const</span> <span className="text-blue-300">security</span> = <span className="text-rose-400">await</span> appOS.<span className="text-emerald-400">init</span>({"{"}
                  </div>
                  <div className="pl-6">
                    encryption: <span className="text-amber-300">'aes-256-gcm'</span>,
                  </div>
                  <div className="pl-6">
                    auditLog: <span className="text-indigo-300">true</span>,
                  </div>
                  <div className="pl-6">
                    biometricFallback: <span className="text-indigo-300">true</span>
                  </div>
                  <div>
                    {"});"}
                  </div>
                  <div className="pt-4 text-emerald-500/85">
                    {"// Security verified and active."}
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Mobile Security Layout (screen < md - exact mobile mockup match) */}
          <div className="block md:hidden text-center max-w-[390px] mx-auto">
            
            {/* Centered shield */}
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-white/5 border border-white/10 text-brand-primary mb-5">
              <Shield className="h-5.5 w-5.5 stroke-[1.5]" />
            </div>

            <p className="text-sm font-medium text-slate-300 leading-relaxed mb-6 px-1">
              Your data is protected with industry-leading security standards and compliance.
            </p>

            {/* Flat dark rows layout with badges */}
            <div className="flex flex-wrap justify-center gap-2 pt-2">
              <span className="rounded bg-white/5 border border-white/8 px-4 py-2 text-xs font-bold text-slate-300 tracking-wide font-mono">
                Security-first
              </span>
              <span className="rounded bg-white/5 border border-white/8 px-4 py-2 text-xs font-bold text-slate-300 tracking-wide font-mono">
                GDPR
              </span>
              <span className="rounded bg-white/5 border border-white/8 px-4 py-2 text-xs font-bold text-slate-300 tracking-wide font-mono">
                HIPAA
              </span>
            </div>

          </div>

        </Container>
      </section>
    </div>
  );
}
