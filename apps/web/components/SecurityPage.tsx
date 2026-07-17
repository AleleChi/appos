"use client";

import React, { useState } from "react";
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Lock,
  CheckCircle,
  ChevronRight,
  ArrowRight,
  Fingerprint,
  Cpu,
  FileText,
  Key,
  Globe,
  Database,
  Server,
  Terminal,
  Activity,
  Check,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import {
  Container,
  Button,
  Card,
  Badge,
  LabelText
} from "./MarketingCore";

interface SecurityPageProps {
  onGetStarted: () => void;
}

export default function SecurityPage({ onGetStarted }: SecurityPageProps) {
  // Mobile accordion states for Compliance Matrix
  const [appleExpanded, setAppleExpanded] = useState(true);
  const [googleExpanded, setGoogleExpanded] = useState(false);

  // Active step in process
  const [activePhase, setActivePhase] = useState(2); // Phase 3 active in mockup, let's do 2 (index 2 is Phase 03)

  const phases = [
    {
      no: "PHASE 01",
      name: "Ownership Verification",
      icon: <Globe className="h-5 w-5 text-brand-primary" />,
      desc: "DNS and HTML verification proving control of web domains."
    },
    {
      no: "PHASE 02",
      name: "Security Scanning",
      icon: <Cpu className="h-5 w-5 text-brand-primary" />,
      desc: "AI-driven AST scanning for vulnerabilities and secrets."
    },
    {
      no: "PHASE 03",
      name: "Build Signing",
      icon: <Key className="h-5 w-5 text-brand-primary" />,
      desc: "Secure automated code signing in hardware security modules."
    },
    {
      no: "PHASE 04",
      name: "Store Readiness",
      icon: <Fingerprint className="h-5 w-5 text-brand-primary" />,
      desc: "Pre-flight checks against Apple and Google policy guidelines."
    }
  ];

  return (
    <div id="security-page" className="bg-[#F7F9FC] text-brand-dark">
      {/* 1. HERO SECTION (Primary Dark Background) */}
      <section className="bg-brand-dark text-white pt-20 pb-16 md:pt-28 md:pb-24 relative overflow-hidden text-center md:text-left">
        {/* Subtle radial glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,91,255,0.08)_0%,transparent_65%)] pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-primary/20 to-transparent" />

        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Hero Text */}
            <div className="lg:col-span-7 flex flex-col items-center md:items-start text-center md:text-left">
              {/* Badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-primary/10 border border-brand-primary/25 text-brand-primary mb-5 sm:mb-6">
                <Shield className="h-3.5 w-3.5 text-brand-primary fill-brand-primary/10" />
                <span className="font-mono text-[10px] sm:text-xs font-bold uppercase tracking-wider">
                  Enterprise Security
                </span>
              </div>

              {/* Title */}
              <h1 className="font-display text-3.5xl sm:text-5xl lg:text-[56px] font-extrabold leading-[1.08] tracking-tight text-white max-w-2xl">
                <span className="hidden md:inline">Your app. Built with security and compliance at its core.</span>
                <span className="inline md:hidden">Security at the core.</span>
              </h1>

              {/* Subtitle */}
              <p className="mt-5 text-sm sm:text-base md:text-lg text-slate-400 max-w-xl leading-relaxed">
                <span className="hidden md:inline">
                  Enterprise-grade protection for the entire website-to-app lifecycle. We secure every step from code extraction to store submission.
                </span>
                <span className="inline md:hidden">
                  Built-in continuous scanning, automated compliance checks, and secure artifact signing for every build.
                </span>
              </p>

              {/* Actions */}
              <div className="mt-8 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                <Button
                  variant="primary"
                  onClick={onGetStarted}
                  className="w-full sm:w-auto min-h-[44px] px-6 text-sm font-bold flex items-center justify-center gap-2"
                >
                  View Security Docs
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <button
                  onClick={onGetStarted}
                  className="w-full sm:w-auto min-h-[44px] px-6 rounded-lg border border-slate-700 hover:border-slate-500 text-white font-semibold text-sm transition-colors cursor-pointer bg-transparent"
                >
                  Contact Sales
                </button>
              </div>
            </div>

            {/* Right Column: Process phases visualization (Desktop layout) */}
            <div className="hidden lg:col-span-5 lg:flex flex-col gap-4 w-full text-left">
              <div className="rounded-2xl border border-slate-800 bg-[#0E1526]/80 p-6 shadow-xl relative backdrop-blur-sm">
                <div className="absolute top-4 right-4 flex items-center gap-1 bg-brand-primary/10 text-brand-primary px-2.5 py-0.5 rounded-full border border-brand-primary/20">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand-primary animate-pulse" />
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider">Active Secure Path</span>
                </div>

                <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-4">
                  Website-To-App Lifespan Pipeline
                </span>

                <div className="flex flex-col gap-3">
                  {phases.map((p, idx) => {
                    const isActive = idx === activePhase;
                    return (
                      <div
                        key={idx}
                        onClick={() => setActivePhase(idx)}
                        className={`flex gap-3.5 p-3 rounded-xl border transition-all cursor-pointer ${
                          isActive
                            ? "bg-brand-primary/5 border-brand-primary/30 text-white"
                            : "bg-[#0A1020]/40 border-slate-900 text-slate-400 hover:border-slate-800"
                        }`}
                      >
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border transition-colors ${
                            isActive
                              ? "bg-brand-primary text-white border-brand-primary"
                              : "bg-slate-900 border-slate-800 text-slate-400"
                          }`}
                        >
                          {p.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[9px] font-bold text-slate-500 uppercase tracking-wide">
                              {p.no}
                            </span>
                            {isActive && <span className="h-1.5 w-1.5 rounded-full bg-brand-primary" />}
                          </div>
                          <h4 className={`text-xs font-extrabold tracking-tight mt-0.5 ${isActive ? "text-white" : "text-slate-300"}`}>
                            {p.name}
                          </h4>
                          {isActive && (
                            <p className="text-[11px] text-slate-400 mt-1 leading-normal">
                              {p.desc}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* 2. CONTINUOUS ASSURANCE / SECURITY LAYERED INFRASTRUCTURE */}
      <section className="py-16 md:py-24 bg-white border-b border-slate-100">
        <Container>
          {/* Desktop/Tablet version: "Security built into every layer" */}
          <div className="hidden md:block text-center max-w-3xl mx-auto mb-16">
            <LabelText className="text-brand-primary mb-3 block">Continuous Assurance</LabelText>
            <h2 className="font-display text-3xl sm:text-4xl md:text-[40px] font-extrabold leading-[1.12] tracking-tight text-brand-dark">
              Security built into every layer.
            </h2>
            <p className="mt-4 text-base text-brand-text-secondary leading-relaxed">
              From website verification to application publishing, AppOS protects every stage of your mobile app lifecycle.
            </p>
          </div>

          <div className="hidden md:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="hover:scale-[1.01] transition-transform duration-300 flex flex-col justify-between">
              <div>
                <span className="font-mono text-xs font-black text-slate-300 block mb-4">01</span>
                <h3 className="font-display text-base font-extrabold text-brand-dark mb-2.5">
                  Website Ownership
                </h3>
                <p className="text-xs text-brand-text-secondary leading-relaxed">
                  Rigorous DNS validation and secure HTML metadata handshakes prove complete corporate authority over target web properties before compilation begins.
                </p>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap gap-1.5">
                <Badge variant="info">DNS Check</Badge>
                <Badge variant="info">HTML Handshake</Badge>
              </div>
            </Card>

            <Card className="hover:scale-[1.01] transition-transform duration-300 flex flex-col justify-between">
              <div>
                <span className="font-mono text-xs font-black text-slate-300 block mb-4">02</span>
                <h3 className="font-display text-base font-extrabold text-brand-dark mb-2.5">
                  Intelligence Layer
                </h3>
                <p className="text-xs text-brand-text-secondary leading-relaxed">
                  Ongoing deep heuristic scanning, real-time vulnerability checks, and automated risk intelligence identify threats before mobile app deployment.
                </p>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap gap-1.5">
                <Badge variant="info">AST Scan</Badge>
                <Badge variant="info">Threat Modeling</Badge>
              </div>
            </Card>

            <Card className="hover:scale-[1.01] transition-transform duration-300 flex flex-col justify-between">
              <div>
                <span className="font-mono text-xs font-black text-slate-300 block mb-4">03</span>
                <h3 className="font-display text-base font-extrabold text-brand-dark mb-2.5">
                  Secure Build Pipeline
                </h3>
                <p className="text-xs text-brand-text-secondary leading-relaxed">
                  Compilation tasks occur entirely inside ephemeral, isolated sandboxed runners ensuring cryptographic code signing and absolute asset integrity.
                </p>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap gap-1.5">
                <Badge variant="info">Ephemeral Sandbox</Badge>
                <Badge variant="info">Crypto Sign</Badge>
              </div>
            </Card>

            <Card className="hover:scale-[1.01] transition-transform duration-300 flex flex-col justify-between">
              <div>
                <span className="font-mono text-xs font-black text-slate-300 block mb-4">04</span>
                <h3 className="font-display text-base font-extrabold text-brand-dark mb-2.5">
                  Store Readiness
                </h3>
                <p className="text-xs text-brand-text-secondary leading-relaxed">
                  Comprehensive compliance alignment audits against official Apple App Store and Google Play privacy policies to eliminate launch failures.
                </p>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap gap-1.5">
                <Badge variant="info">Privacy Align</Badge>
                <Badge variant="info">Policy Audit</Badge>
              </div>
            </Card>
          </div>

          {/* Mobile version: "Continuous Assurance" timeline (Image 1) */}
          <div className="block md:hidden max-w-[390px] mx-auto text-left">
            <h2 className="font-display text-2xl font-extrabold tracking-tight text-brand-dark mb-2">
              Continuous Assurance
            </h2>
            <p className="text-xs font-medium text-brand-text-secondary leading-normal mb-8">
              How AppOS secures your pipeline from code to deployment.
            </p>

            <div className="relative pl-6 border-l border-slate-200 ml-3 space-y-8 py-2">
              {/* Timeline Item 1 */}
              <div className="relative">
                {/* Dot */}
                <div className="absolute -left-[31px] top-1.5 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-brand-primary text-white text-[9px] font-extrabold font-mono border-2 border-white">
                  01
                </div>
                <h4 className="text-xs font-black text-brand-dark tracking-tight">Verify Ownership</h4>
                <p className="text-xs text-brand-text-secondary mt-1 leading-relaxed">
                  Cryptographically prove identity via git signatures and SSO integration.
                </p>
              </div>

              {/* Timeline Item 2 */}
              <div className="relative">
                {/* Dot */}
                <div className="absolute -left-[31px] top-1.5 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-brand-primary text-white text-[9px] font-extrabold font-mono border-2 border-white">
                  02
                </div>
                <h4 className="text-xs font-black text-brand-dark tracking-tight">Analyze Risks</h4>
                <p className="text-xs text-brand-text-secondary mt-1 leading-relaxed">
                  Static analysis (SAST), software composition analysis (SCA), and secret scanning.
                </p>
              </div>

              {/* Timeline Item 3 */}
              <div className="relative">
                {/* Dot */}
                <div className="absolute -left-[31px] top-1.5 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-brand-primary text-white border-2 border-white">
                  <span className="h-1.5 w-1.5 rounded-full bg-white" />
                </div>
                <h4 className="text-xs font-black text-brand-dark tracking-tight flex items-center gap-1.5">
                  <span>Secure Build</span>
                </h4>
                <p className="text-xs text-brand-text-secondary mt-1 leading-relaxed">
                  Isolated build environments and artifact signing.
                </p>
                <div className="mt-2 flex items-center gap-1.5 bg-[#F1F5F9] border border-slate-200/80 rounded-lg p-2.5 font-mono text-[10px] text-brand-text-secondary">
                  <Terminal className="h-3 w-3 shrink-0" />
                  <span>Generating keypair...</span>
                </div>
              </div>

              {/* Timeline Item 4 */}
              <div className="relative opacity-60">
                {/* Dot */}
                <div className="absolute -left-[31px] top-1.5 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-slate-200 text-slate-500 text-[9px] font-bold font-mono border-2 border-white">
                  04
                </div>
                <h4 className="text-xs font-black text-brand-dark tracking-tight">Store Ready</h4>
                <p className="text-xs text-brand-text-secondary mt-1 leading-relaxed">
                  Automated policy checks ensuring readiness for App Store and Google Play.
                </p>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* 3. VISIBILITY & SECURITY DASHBOARD (Mobile & Desktop layouts) */}
      <section className="py-16 md:py-24 bg-[#F8FAFC] border-b border-slate-100">
        <Container>
          {/* Desktop/Tablet: "Complete visibility into your app security." */}
          <div className="hidden md:block text-center max-w-3xl mx-auto mb-16">
            <h2 className="font-display text-3xl sm:text-4xl md:text-[40px] font-extrabold leading-[1.12] tracking-tight text-brand-dark">
              Complete visibility into your app security.
            </h2>
          </div>

          {/* Desktop Two Column Security Check Overview */}
          <div className="hidden md:grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            {/* Left Card: Security Centre */}
            <div className="lg:col-span-7">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm flex flex-col justify-between h-full">
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-brand-primary" />
                      <span className="font-display text-base font-extrabold text-brand-dark">Security Centre</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">Security Score</span>
                      <span className="text-2xl font-black text-brand-primary tracking-tight font-mono">98/100</span>
                    </div>
                  </div>

                  <div className="h-px bg-slate-100 mb-6" />

                  <div className="space-y-4">
                    {[
                      { name: "SSL Certificate", status: "Verified & Compliant" },
                      { name: "Domain Verification", status: "Ownership Validated" },
                      { name: "Dependency Scanning", status: "0 Critical Issues Found" },
                      { name: "App Permissions", status: "Minimal Footprint" },
                      { name: "Privacy Compliance", status: "Security-first & GDPR Perfect Alignment" }
                    ].map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs pb-3 border-b border-slate-50 last:border-0 last:pb-0">
                        <span className="text-brand-text-secondary font-medium">{item.name}</span>
                        <div className="flex items-center gap-1.5 text-emerald-600 font-semibold font-mono">
                          <Check className="h-3.5 w-3.5 stroke-[3]" />
                          <span>Active</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Card: Monitoring Status Rows */}
            <div className="lg:col-span-5">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm flex flex-col justify-between h-full">
                <div>
                  <h3 className="font-display text-base font-extrabold text-brand-dark mb-6 flex items-center gap-2">
                    <Activity className="h-5 w-5 text-brand-primary" />
                    <span>Monitoring Status</span>
                  </h3>

                  <div className="space-y-4">
                    {/* Row 1 */}
                    <div className="rounded-xl bg-emerald-50 border border-emerald-100/60 p-4 flex items-start gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 shrink-0">
                        <ShieldCheck className="h-4.5 w-4.5" />
                      </div>
                      <div className="text-left">
                        <h4 className="text-xs font-extrabold text-emerald-800 leading-none">System Healthy</h4>
                        <p className="text-[11px] text-emerald-600/90 mt-1 leading-normal font-medium">All systems and validation engines operational.</p>
                      </div>
                    </div>

                    {/* Row 2 */}
                    <div className="rounded-xl bg-brand-primary/5 border border-brand-primary/10 p-4 flex items-start gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-primary/10 text-brand-primary shrink-0">
                        <Lock className="h-4.5 w-4.5" />
                      </div>
                      <div className="text-left">
                        <h4 className="text-xs font-extrabold text-brand-primary leading-none">Build Secure</h4>
                        <p className="text-[11px] text-brand-primary/90 mt-1 leading-normal font-medium">Latest bundle successfully compiled, signed, and encrypted.</p>
                      </div>
                    </div>

                    {/* Row 3 */}
                    <div className="rounded-xl bg-purple-50 border border-purple-100 p-4 flex items-start gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600 shrink-0">
                        <CheckCircle className="h-4.5 w-4.5" />
                      </div>
                      <div className="text-left">
                        <h4 className="text-xs font-extrabold text-purple-800 leading-none">Store Ready</h4>
                        <p className="text-[11px] text-purple-600/90 mt-1 leading-normal font-medium">Verified metadata aligns perfectly with submission rules.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Layout: Security Dashboard (Image 1) */}
          <div className="block md:hidden max-w-[390px] mx-auto text-left">
            <div className="flex justify-between items-baseline mb-4">
              <h2 className="font-display text-xl font-extrabold text-brand-dark">Security Dashboard</h2>
              <button onClick={onGetStarted} className="text-xs font-bold text-brand-primary flex items-center gap-0.5 bg-transparent border-0 p-0 cursor-pointer">
                View Full
                <ChevronRight className="h-3 w-3" />
              </button>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex justify-between items-center mb-5 pb-4 border-b border-slate-100">
                <div className="text-left">
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">Overall Health</span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-3xl font-black text-brand-dark font-mono">98</span>
                    <span className="text-xs font-bold text-slate-400">/100</span>
                  </div>
                </div>

                {/* Score badge graphic */}
                <div className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-brand-primary/20 bg-brand-primary/5 text-brand-primary shadow-sm relative">
                  <ShieldCheck className="h-5.5 w-5.5" />
                </div>
              </div>

              <div className="space-y-2.5">
                {/* Metric Row 1 */}
                <div className="flex items-center justify-between text-xs py-2 px-3 rounded-lg bg-[#F8FAFC]">
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-brand-primary" />
                    <span className="text-brand-text-secondary font-bold">Dependencies</span>
                  </div>
                  <span className="text-brand-dark font-bold">0 Critical</span>
                </div>

                {/* Metric Row 2 */}
                <div className="flex items-center justify-between text-xs py-2 px-3 rounded-lg bg-[#F8FAFC]">
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-brand-primary" />
                    <span className="text-brand-text-secondary font-bold">Code Analysis</span>
                  </div>
                  <span className="text-brand-dark font-bold">Passed</span>
                </div>

                {/* Metric Row 3 */}
                <div className="flex items-center justify-between text-xs py-2 px-3 rounded-lg bg-[#FFF5F5] border border-red-100">
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                    <span className="text-rose-900 font-bold">Container Image</span>
                  </div>
                  <span className="text-rose-600 font-extrabold font-mono">1 Warning</span>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* 4. SECURE BUILD INFRASTRUCTURE (Cards System) */}
      <section className="py-16 md:py-24 bg-white border-b border-slate-100">
        <Container>
          {/* Section Header */}
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="hidden md:block font-display text-3xl sm:text-4xl md:text-[40px] font-extrabold leading-[1.12] tracking-tight text-brand-dark">
              Every build is protected.
            </h2>
            <h2 className="block md:hidden font-display text-xl font-extrabold text-brand-dark text-left mb-2">
              Secure Build Infrastructure
            </h2>
          </div>

          {/* Desktop layout: 3 Cards */}
          <div className="hidden md:grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="flex flex-col gap-5 text-left hover:shadow-md transition-shadow">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-primary/10 border border-brand-primary/20 text-brand-primary">
                <Server className="h-5.5 w-5.5" />
              </div>
              <div>
                <h3 className="font-display text-lg font-extrabold text-brand-dark mb-2">
                  Isolated Build Environment
                </h3>
                <p className="text-xs text-brand-text-secondary leading-relaxed">
                  Each build runs in a clean, isolated container ensuring zero cross-contamination and reproducible results. Secure workspace initialization on every compile request.
                </p>
              </div>
            </Card>

            <Card className="flex flex-col gap-5 text-left hover:shadow-md transition-shadow">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-primary/10 border border-brand-primary/20 text-brand-primary">
                <Key className="h-5.5 w-5.5" />
              </div>
              <div>
                <h3 className="font-display text-lg font-extrabold text-brand-dark mb-2">
                  Secure Signing
                </h3>
                <p className="text-xs text-brand-text-secondary leading-relaxed">
                  Automated, secure key management and signing processes for both iOS and Android platforms, running purely inside dedicated hardware cryptosystems.
                </p>
              </div>
            </Card>

            <Card className="flex flex-col gap-5 text-left hover:shadow-md transition-shadow">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-primary/10 border border-brand-primary/20 text-brand-primary">
                <FileText className="h-5.5 w-5.5" />
              </div>
              <div>
                <h3 className="font-display text-lg font-extrabold text-brand-dark mb-2">
                  Audit History
                </h3>
                <p className="text-xs text-brand-text-secondary leading-relaxed">
                  Comprehensive logs of every build, configuration change, and deployment for complete compliance traceability. Verifiable logs persist eternally.
                </p>
              </div>
            </Card>
          </div>

          {/* Mobile layout: List of cards (matching Mobile Screenshot exactly) */}
          <div className="flex md:hidden flex-col gap-5 max-w-[390px] mx-auto text-left">
            <Card className="p-5 flex gap-4.5 items-start">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F1F5F9] border border-slate-200 text-brand-dark shrink-0">
                <Server className="h-4.5 w-4.5" />
              </div>
              <div>
                <h4 className="text-xs font-black text-brand-dark leading-none">Isolated Build Envs</h4>
                <p className="text-[11px] text-brand-text-secondary leading-relaxed mt-1.5">
                  Ephemeral macOS and Linux runners ensure clean, untainted builds every time.
                </p>
              </div>
            </Card>

            <Card className="p-5 flex gap-4.5 items-start">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F1F5F9] border border-slate-200 text-brand-dark shrink-0">
                <Key className="h-4.5 w-4.5" />
              </div>
              <div>
                <h4 className="text-xs font-black text-brand-dark leading-none">Secure Signing</h4>
                <p className="text-[11px] text-brand-text-secondary leading-relaxed mt-1.5">
                  Automated management of certificates and provisioning profiles stored securely in HSMs.
                </p>
              </div>
            </Card>

            <Card className="p-5 flex gap-4.5 items-start">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F1F5F9] border border-slate-200 text-brand-dark shrink-0">
                <FileText className="h-4.5 w-4.5" />
              </div>
              <div>
                <h4 className="text-xs font-black text-brand-dark leading-none">Audit History</h4>
                <p className="text-[11px] text-brand-text-secondary leading-relaxed mt-1.5">
                  Immutable logs of all pipeline runs, changes, and access events for compliance reporting.
                </p>
              </div>
            </Card>
          </div>
        </Container>
      </section>

      {/* 5. DATA PROTECTION GRID (Mobile & Desktop layouts) */}
      <section className="py-16 md:py-24 bg-[#F8FAFC] border-b border-slate-100">
        <Container>
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="hidden md:block font-display text-3xl sm:text-4xl md:text-[40px] font-extrabold leading-[1.12] tracking-tight text-brand-dark">
              Your business data remains protected.
            </h2>
            <h2 className="block md:hidden font-display text-xl font-extrabold text-brand-dark text-left mb-2">
              Data Protection
            </h2>
          </div>

          {/* Desktop/Tablet Layout: 5 Cards Grid */}
          <div className="hidden md:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            <Card className="p-6 flex flex-col justify-between h-full bg-white hover:scale-[1.01] transition-transform">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-primary/10 text-brand-primary mb-4 shrink-0">
                <Lock className="h-4.5 w-4.5" />
              </div>
              <div>
                <h4 className="font-display text-sm font-bold text-brand-dark mb-1.5">Encryption</h4>
                <p className="text-[11px] text-brand-text-secondary leading-normal">
                  AES-256-GCM data encryption at rest and TLS 1.3 in transit.
                </p>
              </div>
            </Card>

            <Card className="p-6 flex flex-col justify-between h-full bg-white hover:scale-[1.01] transition-transform">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-primary/10 text-brand-primary mb-4 shrink-0">
                <Fingerprint className="h-4.5 w-4.5" />
              </div>
              <div>
                <h4 className="font-display text-sm font-bold text-brand-dark mb-1.5">Access Controls</h4>
                <p className="text-[11px] text-brand-text-secondary leading-normal">
                  Strict role-based access control and Single Sign-On integration.
                </p>
              </div>
            </Card>

            <Card className="p-6 flex flex-col justify-between h-full bg-white hover:scale-[1.01] transition-transform">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-primary/10 text-brand-primary mb-4 shrink-0">
                <Activity className="h-4.5 w-4.5" />
              </div>
              <div>
                <h4 className="font-display text-sm font-bold text-brand-dark mb-1.5">Audit Logs</h4>
                <p className="text-[11px] text-brand-text-secondary leading-normal">
                  Comprehensive audit trails for secure developer tracking.
                </p>
              </div>
            </Card>

            <Card className="p-6 flex flex-col justify-between h-full bg-white hover:scale-[1.01] transition-transform">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-primary/10 text-brand-primary mb-4 shrink-0">
                <Database className="h-4.5 w-4.5" />
              </div>
              <div>
                <h4 className="font-display text-sm font-bold text-brand-dark mb-1.5">Secure Storage</h4>
                <p className="text-[11px] text-brand-text-secondary leading-normal">
                  Dedicated tenant-isolated storage for app binaries and private keys.
                </p>
              </div>
            </Card>

            <Card className="p-6 flex flex-col justify-between h-full bg-white hover:scale-[1.01] transition-transform">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-primary/10 text-brand-primary mb-4 shrink-0">
                <ShieldCheck className="h-4.5 w-4.5" />
              </div>
              <div>
                <h4 className="font-display text-sm font-bold text-brand-dark mb-1.5">Privacy Management</h4>
                <p className="text-[11px] text-brand-text-secondary leading-normal">
                  GDPR compliance controls and automated data retention policies.
                </p>
              </div>
            </Card>
          </div>

          {/* Mobile Layout: 4 Grid boxes (Image 1) */}
          <div className="grid md:hidden grid-cols-2 gap-4 max-w-[390px] mx-auto text-center">
            {/* Box 1 */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 flex flex-col items-center justify-center text-center">
              <Lock className="h-5.5 w-5.5 text-brand-primary mb-2.5" />
              <h4 className="text-xs font-black text-brand-dark leading-none">Encryption</h4>
              <p className="text-[10px] text-brand-text-secondary mt-1.5 leading-normal">At rest & in transit</p>
            </div>

            {/* Box 2 */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 flex flex-col items-center justify-center text-center">
              <Fingerprint className="h-5.5 w-5.5 text-brand-primary mb-2.5" />
              <h4 className="text-xs font-black text-brand-dark leading-none">Access</h4>
              <p className="text-[10px] text-brand-text-secondary mt-1.5 leading-normal font-medium">RBAC & SSO integration</p>
            </div>

            {/* Box 3 */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 flex flex-col items-center justify-center text-center">
              <FileText className="h-5.5 w-5.5 text-brand-primary mb-2.5" />
              <h4 className="text-xs font-black text-brand-dark leading-none">Logs</h4>
              <p className="text-[10px] text-brand-text-secondary mt-1.5 leading-normal font-medium">Immutable audit trails</p>
            </div>

            {/* Box 4 */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 flex flex-col items-center justify-center text-center">
              <ShieldCheck className="h-5.5 w-5.5 text-brand-primary mb-2.5" />
              <h4 className="text-xs font-black text-brand-dark leading-none">Privacy</h4>
              <p className="text-[10px] text-brand-text-secondary mt-1.5 leading-normal font-medium">Security-first & GDPR ready</p>
            </div>
          </div>
        </Container>
      </section>

      {/* 6. COMPLIANCE MATRIX SELECT (Apple vs Google checkmarks) */}
      <section className="py-16 md:py-24 bg-white border-b border-slate-100">
        <Container>
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="hidden md:block font-display text-3xl sm:text-4xl md:text-[40px] font-extrabold leading-[1.12] tracking-tight text-brand-dark">
              Ready for the world's largest app platforms.
            </h2>
            <h2 className="block md:hidden font-display text-xl font-extrabold text-brand-dark text-left mb-4">
              Compliance Matrix
            </h2>
          </div>

          {/* Desktop/Tablet Side-by-Side Lists */}
          <div className="hidden md:grid grid-cols-2 gap-12 max-w-4xl mx-auto">
            {/* Apple */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm text-left">
              <div className="flex items-center gap-3 mb-6">
                <svg className="h-6 w-6 text-brand-dark" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-.96.04-2.13.64-2.82 1.45-.6.7-1.13 1.84-1.01 2.95 1.07.08 2.18-.53 2.84-1.34z" />
                </svg>
                <span className="font-display text-lg font-black text-brand-dark">Apple App Store</span>
              </div>
              <ul className="space-y-4">
                {[
                  "App Tracking Transparency compliance",
                  "Privacy Nutrition Labels support",
                  "Secure Enclave compatibility"
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-xs text-brand-dark font-semibold">
                    <Check className="h-4.5 w-4.5 text-emerald-500 shrink-0 stroke-[3]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Google */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm text-left">
              <div className="flex items-center gap-3 mb-6">
                <svg className="h-6 w-6 text-[#3DDB85]" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.52 14.3c-.5.03-.92-.3-.95-.8-.03-.5.3-.92.8-.95.5-.03.92.3.95.8.03.5-.3.92-.8.95zm-11.04 0c-.5.03-.92-.3-.95-.8-.03-.5.3-.92.8-.95.5-.03.92.3.95.8.03.5-.3.92-.8.95zm11.13-2.61l1.86-3.22c.1-.18.04-.41-.14-.51-.18-.1-.41-.04-.51.14l-1.88 3.25C15.35 10.51 13.75 10 12 10s-3.35.51-4.94 1.35L5.18 8.1c-.1-.18-.33-.24-.51-.14-.18.1-.24.33-.14.51l1.86 3.22C3.21 13.52 1 16.51 1 20h22c0-3.49-2.21-6.48-5.39-8.31z" />
                </svg>
                <span className="font-display text-lg font-black text-brand-dark">Google Play</span>
              </div>
              <ul className="space-y-4">
                {[
                  "Data Safety section automation",
                  "Target API level compliance",
                  "Play Protect verification readiness"
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-xs text-brand-dark font-semibold">
                    <Check className="h-4.5 w-4.5 text-emerald-500 shrink-0 stroke-[3]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Mobile Layout: Accordion Expandable Rows (Image 1) */}
          <div className="block md:hidden flex flex-col gap-3.5 max-w-[390px] mx-auto text-left">
            {/* Apple Row */}
            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
              <button
                onClick={() => setAppleExpanded(!appleExpanded)}
                className="w-full flex items-center justify-between p-4.5 text-xs font-black text-brand-dark bg-slate-50 border-b border-slate-100 cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <span className="font-display font-black">APPLE</span>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">Apple App Store</span>
                </div>
                {appleExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>

              {appleExpanded && (
                <div className="p-4.5 space-y-3.5 bg-white">
                  {[
                    "App Tracking Transparency compliance",
                    "Privacy Nutrition Labels support",
                    "Secure Enclave compatibility"
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2.5 text-[11px] text-brand-dark font-bold">
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600">
                        <Check className="h-3 w-3 stroke-[3]" />
                      </div>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Google Row */}
            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
              <button
                onClick={() => setGoogleExpanded(!googleExpanded)}
                className="w-full flex items-center justify-between p-4.5 text-xs font-black text-brand-dark bg-slate-50 border-b border-slate-100 cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <span className="font-display font-black">ANDROID</span>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">Google Play</span>
                </div>
                {googleExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>

              {googleExpanded && (
                <div className="p-4.5 space-y-3.5 bg-white">
                  {[
                    "Data Safety section automation",
                    "Target API level compliance",
                    "Play Protect verification readiness"
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2.5 text-[11px] text-brand-dark font-bold">
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600">
                        <Check className="h-3 w-3 stroke-[3]" />
                      </div>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Container>
      </section>

      {/* 7. SECURE CONVERT CTA BANNER */}
      <section className="py-16 md:py-24 bg-brand-dark text-white relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,91,255,0.06)_0%,transparent_60%)] pointer-events-none" />

        <Container className="text-center max-w-3xl">
          {/* Title */}
          <h2 className="font-display text-3xl sm:text-4xl md:text-[40px] font-extrabold leading-[1.12] tracking-tight text-white mb-4">
            <span className="hidden md:inline">Build your app with confidence.</span>
            <span className="inline md:hidden">Ready to secure your pipeline?</span>
          </h2>

          {/* Subtitle */}
          <p className="text-sm sm:text-base text-slate-400 leading-relaxed mb-10 max-w-lg mx-auto">
            <span className="hidden md:inline">
              Launch secure mobile applications without worrying about hidden compliance risks.
            </span>
            <span className="inline md:hidden">
              Get started with AppOS today and build with confidence.
            </span>
          </p>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4.5 max-w-md mx-auto">
            <Button
              variant="primary"
              onClick={onGetStarted}
              className="w-full sm:w-auto text-sm font-bold flex items-center justify-center gap-2 min-h-[44px] px-6"
            >
              Create Your App
              <ArrowRight className="h-4 w-4" />
            </Button>
            <button
              onClick={onGetStarted}
              className="w-full sm:w-auto min-h-[44px] px-6 rounded-lg border border-slate-800 hover:border-slate-700 text-white font-semibold text-sm transition-colors cursor-pointer bg-[#0A1020]"
            >
              Contact Enterprise
            </button>
          </div>
        </Container>
      </section>
    </div>
  );
}
