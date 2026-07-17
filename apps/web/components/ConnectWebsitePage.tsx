"use client";

import React, { useState, useEffect } from "react";
import { 
  Globe, 
  Check, 
  Lock, 
  Smartphone, 
  Shield, 
  Activity, 
  Cpu, 
  Layers, 
  Compass, 
  Sparkles,
  ArrowRight,
  RefreshCw
} from "lucide-react";

export default function ConnectWebsitePage() {
  const [workspaceId, setWorkspaceId] = useState("default");
  
  useEffect(() => {
    if (typeof window !== "undefined") {
      const match = window.location.pathname.match(/^\/workspace\/([^\/]+)/);
      if (match?.[1]) {
        setWorkspaceId(match[1]);
      }
    }
  }, []);
  
  const navigate = (path: string) => {
    if (typeof window !== "undefined") {
      window.history.pushState(null, "", path);
      window.dispatchEvent(new PopStateEvent("popstate"));
    }
  };
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState("idle"); // idle | pending | analyzing_structure | analyzing_navigation | extracting_assets | completed
  const [appId, setAppId] = useState("");
  const [progress, setProgress] = useState({ pages: 0, assets: 0, score: 0 });
  const [error, setError] = useState("");

  useEffect(() => {
    if (!appId || status === "idle" || status === "completed") return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/apps/${appId}/status`);
        if (!res.ok) throw new Error("Status check failed");
        const data = await res.json();

        setStatus(data.status);
        setProgress({
          pages: data.pages_count,
          assets: data.assets_count,
          score: data.mobile_readiness
        });

        if (data.status === "completed") {
          clearInterval(interval);
          setTimeout(() => {
            navigate(`/workspace/${workspaceId}/app/${appId}/verify`);
          }, 2000);
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [appId, status, navigate, workspaceId]);

  const handleStartAnalysis = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    // Validate URL format simply
    let formattedUrl = url;
    if (!/^https?:\/\//i.test(url)) {
      formattedUrl = "https://" + url;
    }

    setStatus("pending");
    setError("");
    try {
      const res = await fetch("/api/apps/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: formattedUrl, workspace_id: workspaceId })
      });
      
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to connect to analysis engine.");
      }
      
      const data = await res.json();
      setAppId(data.appId);
    } catch (err: any) {
      setStatus("idle");
      setError(err.message || "Failed to connect to analysis engine.");
    }
  };

  const getCleanDomain = (rawUrl: string) => {
    if (!rawUrl) return "waiting for target...";
    try {
      const parsed = new URL(rawUrl);
      return parsed.hostname;
    } catch {
      return rawUrl.replace(/^https?:\/\//i, "").split("/")[0];
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col lg:flex-row font-sans antialiased">
      
      {/* LEFT COLUMN: Intelligence Engine Console (Desktop Only) */}
      <div className="hidden lg:flex lg:w-5/12 bg-[#05070F] flex-col justify-between p-12 text-white border-r border-slate-900 relative overflow-hidden select-none">
        
        {/* Subtle grid background accent */}
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-20 pointer-events-none"></div>

        {/* Top bar status */}
        <div className="flex justify-between items-center z-10">
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-slate-400 font-semibold">
            <span className={`w-2 h-2 rounded-full ${status !== 'idle' ? 'bg-indigo-500 animate-ping' : 'bg-emerald-500'} inline-block`}></span>
            {status === "idle" ? "System Online" : "Engine Processing"}
          </div>
          <div className="text-xs uppercase tracking-widest text-indigo-400 font-bold bg-indigo-500/10 px-2.5 py-1 rounded-md border border-indigo-500/20">
            Target Blueprint: iOS & Android
          </div>
        </div>

        {/* Center: Dynamic Connected Network Blueprint Node Map */}
        <div className="my-auto flex flex-col items-center justify-center relative w-full h-[420px] z-10">
          
          {/* Background connected path lines */}
          <svg className="absolute inset-0 w-full h-full text-slate-800/40" fill="none">
            {/* Source to Center */}
            <line x1="50%" y1="18%" x2="50%" y2="48%" stroke="currentColor" strokeWidth="2" strokeDasharray={status !== 'idle' ? "4 4" : "0"} className={status !== 'idle' && status !== 'completed' ? "animate-[dash_2s_linear_infinite]" : ""} />
            {/* Center to Output */}
            <line x1="50%" y1="48%" x2="50%" y2="80%" stroke="currentColor" strokeWidth="2" strokeDasharray={status !== 'idle' ? "4 4" : "0"} className={status !== 'idle' && status !== 'completed' ? "animate-[dash_2s_linear_infinite]" : ""} />
          </svg>

          {/* Node 1: SOURCE NODE */}
          <div className={`w-full max-w-sm bg-[#0A0E1A] border ${status !== 'idle' ? 'border-indigo-500/30 shadow-indigo-500/5' : 'border-slate-800'} p-4 rounded-xl flex items-center justify-between mb-8 transition-all duration-300 shadow-lg`}>
            <div className="flex items-center gap-3">
              <div className="bg-slate-800/60 p-2 rounded-lg text-slate-400 border border-slate-700/50">
                <Globe className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Source</span>
                <span className="text-sm font-semibold text-slate-200 block truncate max-w-[180px]">{getCleanDomain(url)}</span>
              </div>
            </div>
            <div className="flex flex-col items-end text-[11px] text-slate-400 font-mono">
              <span className="flex items-center gap-1.5">📄 <strong className="text-slate-200">{progress.pages}</strong> pages</span>
              <span className="flex items-center gap-1.5 mt-0.5">📦 <strong className="text-slate-200">{progress.assets}</strong> assets</span>
            </div>
          </div>

          {/* Node 2: APPOS ENGINE CENTRAL NODE */}
          <div className={`z-10 bg-[#0C1227] border-2 ${status !== 'idle' && status !== 'completed' ? 'border-indigo-500 animate-pulse shadow-indigo-500/20' : 'border-indigo-500/40'} p-5 rounded-2xl flex flex-col items-center justify-center text-center w-36 h-36 shadow-2xl transition-all duration-300`}>
            <div className="bg-indigo-500/10 p-2.5 rounded-xl text-indigo-400 mb-2 border border-indigo-500/20">
              <Cpu className={`w-6 h-6 ${status !== 'idle' && status !== 'completed' ? 'animate-spin' : ''}`} />
            </div>
            <span className="text-[10px] uppercase tracking-[0.2em] text-indigo-400 font-extrabold">AppOS Engine</span>
            <span className="text-[9px] text-slate-500 mt-0.5 uppercase tracking-wider font-mono">
              {status === "idle" ? "Ready" : status === "completed" ? "Done" : "Analyzing..."}
            </span>
          </div>

          {/* Node 3: OUTPUT BLUEPRINT NODE */}
          <div className={`w-full max-w-sm bg-[#0A0E1A] border ${status === 'completed' ? 'border-emerald-500/40' : status !== 'idle' ? 'border-indigo-500/30' : 'border-slate-800'} p-4 rounded-xl flex items-center justify-between mt-8 transition-all duration-300 shadow-lg`}>
            <div className="flex items-center gap-3">
              <div className="bg-slate-800/60 p-2 rounded-lg text-slate-400 border border-slate-700/50">
                <Smartphone className={`w-5 h-5 ${status === 'completed' ? 'text-emerald-400' : 'text-slate-400'}`} />
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Output</span>
                <span className="text-sm font-semibold text-slate-200 block">Application Blueprint</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Readiness</span>
              <span className={`text-sm font-bold ${status === 'completed' ? 'text-emerald-400' : 'text-indigo-400'}`}>{progress.score}%</span>
            </div>
          </div>
        </div>

        {/* Dynamic Pipeline Visualization List */}
        <div className="space-y-3 bg-[#080B14] border border-slate-850 p-5 rounded-xl z-10">
          <div className="flex justify-between items-center pb-2 border-b border-slate-900">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Analysis Pipeline</span>
            <span className="text-xs text-slate-400 font-mono uppercase tracking-widest">Stage 1/4</span>
          </div>
          
          <div className="space-y-2">
            {/* Website Structure Step */}
            <div className={`flex items-center justify-between p-2.5 rounded-lg text-xs transition-all ${status !== 'idle' && status !== 'pending' ? 'bg-[#0E152B] border border-indigo-500/10 text-slate-200' : 'opacity-40 text-slate-500'}`}>
              <div className="flex items-center gap-2">
                <span className={`flex items-center justify-center w-5 h-5 rounded-full ${status !== 'idle' && status !== 'pending' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-800'}`}>
                  {status !== 'idle' && status !== 'pending' && status !== 'analyzing_structure' ? <Check className="w-3.5 h-3.5" /> : "1"}
                </span>
                <span>Website structure analysis</span>
              </div>
              {status === "analyzing_structure" && <span className="text-[10px] text-indigo-400 font-semibold animate-pulse font-mono">IN PROGRESS</span>}
              {status !== 'idle' && status !== 'pending' && status !== 'analyzing_structure' && <span className="text-[10px] text-emerald-400 font-semibold font-mono">COMPLETE</span>}
            </div>

            {/* Navigation Mapping Step */}
            <div className={`flex items-center justify-between p-2.5 rounded-lg text-xs transition-all ${status === 'analyzing_navigation' || status === 'extracting_assets' || status === 'completed' ? 'bg-[#0E152B] border border-indigo-500/10 text-slate-200' : 'opacity-40 text-slate-500'}`}>
              <div className="flex items-center gap-2">
                <span className={`flex items-center justify-center w-5 h-5 rounded-full ${status === 'analyzing_navigation' || status === 'extracting_assets' || status === 'completed' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-800'}`}>
                  {status === 'extracting_assets' || status === 'completed' ? <Check className="w-3.5 h-3.5" /> : "2"}
                </span>
                <span>Navigation structure mapping</span>
              </div>
              {status === "analyzing_navigation" && <span className="text-[10px] text-indigo-400 font-semibold animate-pulse font-mono">IN PROGRESS</span>}
              {(status === 'extracting_assets' || status === 'completed') && <span className="text-[10px] text-emerald-400 font-semibold font-mono">COMPLETE</span>}
            </div>

            {/* Brand Asset Extraction Step */}
            <div className={`flex items-center justify-between p-2.5 rounded-lg text-xs transition-all ${status === 'extracting_assets' || status === 'completed' ? 'bg-[#0E152B] border border-indigo-500/10 text-slate-200' : 'opacity-40 text-slate-500'}`}>
              <div className="flex items-center gap-2">
                <span className={`flex items-center justify-center w-5 h-5 rounded-full ${status === 'extracting_assets' || status === 'completed' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-800'}`}>
                  {status === 'completed' ? <Check className="w-3.5 h-3.5" /> : "3"}
                </span>
                <span>Brand asset extraction</span>
              </div>
              {status === "extracting_assets" && <span className="text-[10px] text-indigo-400 font-semibold animate-pulse font-mono">IN PROGRESS</span>}
              {status === "completed" && <span className="text-[10px] text-emerald-400 font-semibold font-mono">COMPLETE</span>}
            </div>
          </div>
        </div>

        {/* Footer links & branding */}
        <div className="flex justify-between items-center text-slate-600 text-[10px] tracking-widest font-mono z-10">
          <span>APPOS SYSTEM v2.4</span>
          <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> SECURE TUNNEL ACTIVE</span>
        </div>
      </div>

      {/* RIGHT COLUMN: Interactive Form Sheet & Mobile layout */}
      <div className="w-full lg:w-7/12 flex items-center justify-center p-6 md:p-12 overflow-y-auto">
        <div className="w-full max-w-xl">
          
          {/* Header element for mobile layouts */}
          <div className="flex justify-between items-center lg:hidden mb-8">
            <span className="text-xl font-extrabold text-slate-900 tracking-tight">AppOS</span>
            <span className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">Step 1 of 4</span>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100 font-medium">
              {error}
            </div>
          )}

          {/* Main card panel */}
          <div className="bg-white p-6 md:p-10 rounded-3xl border border-slate-200/80 shadow-sm space-y-8">
            
            {/* Step/Stepper Indicators (Desktop Only) */}
            <div className="hidden lg:block space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Create Your First App</span>
                <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Step 1 of 4</span>
              </div>
              
              {/* Stepper horizontal pipeline */}
              <div className="flex items-center gap-3 text-xs font-semibold text-slate-400 select-none">
                <span className="text-indigo-600 font-bold border-b-2 border-indigo-600 pb-1">Website</span>
                <span className="h-[1px] bg-slate-200 flex-1"></span>
                <span>Verification</span>
                <span className="h-[1px] bg-slate-200 flex-1"></span>
                <span>Blueprint</span>
                <span className="h-[1px] bg-slate-200 flex-1"></span>
                <span>Configure</span>
              </div>
            </div>

            {/* Title Block */}
            <div className="space-y-2">
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Connect your website</h1>
              <p className="text-sm text-slate-500 leading-relaxed">
                Your website is the foundation of your mobile application. AppOS analyses your experience and creates your application blueprint.
              </p>
            </div>

            {/* Interactive Url Submission Form */}
            <form onSubmit={handleStartAnalysis} className="space-y-6">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2.5">Website Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400">
                    <Globe className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    required
                    disabled={status !== "idle"}
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://yourwebsite.com"
                    className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 text-sm transition-all duration-150 bg-slate-50/50 text-slate-800 placeholder-slate-400 font-medium"
                  />
                </div>
              </div>

              {/* Supported Tech/Platforms Tags */}
              <div className="space-y-2">
                <span className="text-xs text-slate-400 font-medium">Supported Platforms:</span>
                <div className="flex flex-wrap items-center gap-2">
                  {["WordPress", "Shopify", "Custom Website"].map((plat) => (
                    <span key={plat} className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200/60 font-semibold text-[11px] uppercase tracking-wide">
                      {plat}
                    </span>
                  ))}
                </div>
              </div>

              {/* Analyse Action Button */}
              <button
                type="submit"
                disabled={status !== "idle"}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-xl font-bold text-sm transition-colors duration-200 shadow-lg shadow-indigo-600/15 flex items-center justify-center gap-2 cursor-pointer"
              >
                {status === "idle" ? (
                  <>
                    Analyse Website <ArrowRight className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Analyzing Connection State...
                  </>
                )}
              </button>
            </form>

            {/* Privacy Shield Info Card */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-500 flex gap-3 items-center">
              <Lock className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <span>Your website remains private. AppOS only analyses required public information.</span>
            </div>

            {/* MOBILE ONLY CHECKLIST: Displayed below on small screens */}
            <div className="block lg:hidden pt-4 border-t border-slate-100 space-y-4">
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">What AppOS Analyses</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                </div>
                
                <div className="space-y-2.5 text-xs text-slate-600 font-medium">
                  {[
                    "Pages & hierarchy structure",
                    "Navigation pathways",
                    "Brand color & image assets",
                    "Mobile readability and viewports",
                    "SSL & Endpoint security status"
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2.5">
                      <span className="text-indigo-600">✓</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-3 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span>AppOS Intelligence Ready</span>
                  <span>US-EAST-1</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
