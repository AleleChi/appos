import React, { useState } from "react";
import Swal from "sweetalert2";
import { getApiUrl } from "../lib/api-config";
import { safeStorage } from "../lib/safe-storage";

// Inline vector icon components to ensure cross-platform brand alignment
const GridIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
  </svg>
);

const UsersIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const ChartIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const ShieldIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const BriefcaseIcon = () => (
  <svg className="w-6 h-6 mb-1.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const CodeIcon = () => (
  <svg className="w-6 h-6 mb-1.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
  </svg>
);

const BuildingIcon = () => (
  <svg className="w-6 h-6 mb-1.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);

interface WorkspaceCreationPageProps {
  onWorkspaceCreated: (workspaceId: string) => void;
  onBackToHome?: () => void;
}

export default function WorkspaceCreationPage({ onWorkspaceCreated, onBackToHome }: WorkspaceCreationPageProps) {
  const [formData, setFormData] = useState({
    name: "",
    industry: "",
    accountType: "business",
    teamSize: "Just me (1)"
  });
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = (path: string) => {
    window.history.pushState(null, "", path);
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // 1. Header-Based Token Extraction to securely bypass browser sandbox iframe cookie blocking
      const sessionToken = safeStorage.getItem("bearer_token") || "";
      const targetUrl = getApiUrl("/api/workspaces");

      const response = await fetch(targetUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${sessionToken}`,
          "x-better-auth-session": sessionToken
        },
        credentials: "include",
        body: JSON.stringify({
          name: formData.name,
          industry: formData.industry,
          account_type: formData.accountType,
          team_size: formData.teamSize
        })
      });

      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("text/html")) {
        const htmlText = await response.text();
        const match = htmlText.match(/<title>(.*?)<\/title>/);
        const serverError = match ? match[1] : "Gateway Configuration Error";
        throw new Error(`[Server Error ${response.status}]: ${serverError}. Check Render logs.`);
      }

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to create workspace");
      
      // 2. High-Fidelity SweetAlert2 Confirmation Popup matching Stitch brand tones
      Swal.fire({
        title: "Workspace Created!",
        text: `Your workspace "${data.name}" was built successfully. Let's set up your mobile experience next!`,
        icon: "success",
        confirmButtonColor: "#5046E6", // Indigo core brand color token
        confirmButtonText: "Continue",
        background: "#FFFFFF",
        customClass: {
          popup: "rounded-2xl border border-slate-100 shadow-xl",
          title: "text-slate-900 font-extrabold tracking-tight",
          htmlContainer: "text-slate-500 font-medium text-sm leading-relaxed"
        }
      }).then(() => {
        // 3. Perfect Route Transition: Forward direct to Step 1 Connect Website Flow
        navigate(`/workspace/${data.workspaceId}/connect`);
      });

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const accountTypes = [
    { id: "business", label: "Business", icon: <BriefcaseIcon/> },
    { id: "agency", label: "Agency", icon: <UsersIcon/> },
    { id: "developer", label: "Developer", icon: <CodeIcon/> },
    { id: "enterprise", label: "Enterprise", icon: <BuildingIcon/> }
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans antialiased">
      
      {/* LEFT COLUMN: Deep dark brand panel - Desktop Only */}
      <div className="hidden lg:flex lg:w-5/12 bg-[#05070F] flex-col justify-between p-12 text-white relative overflow-hidden border-r border-slate-900 select-none">
        <div 
          onClick={onBackToHome}
          className="text-xl font-semibold tracking-tight text-white cursor-pointer hover:text-indigo-400 transition-colors"
        >
          AppOS
        </div>
        
        {/* Absolute-Positioned Connected Radial Path Layer */}
        <div className="my-auto flex items-center justify-center relative h-96 w-full">
          <svg className="absolute inset-0 w-full h-full text-[#1E293B]/60" fill="none">
            <line x1="20%" y1="15%" x2="50%" y2="50%" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" />
            <line x1="80%" y1="15%" x2="50%" y2="50%" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" />
            <line x1="20%" y1="85%" x2="50%" y2="50%" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" />
            <line x1="80%" y1="85%" x2="50%" y2="50%" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" />
          </svg>

          {/* Central Workspace Anchor */}
          <div className="z-10 bg-[#0C1227] border-2 border-indigo-500/40 p-5 rounded-2xl flex flex-col items-center justify-center text-center w-36 shadow-2xl shadow-indigo-500/10">
            <div className="bg-indigo-500/10 p-2 rounded-lg text-indigo-400 mb-2 border border-indigo-500/20">
              <BuildingIcon/>
            </div>
            <span className="text-[10px] uppercase tracking-[0.2em] text-indigo-400 font-bold">Workspace</span>
          </div>

          {/* Connected Peripheral Nodes */}
          <div className="absolute top-[8%] left-[10%] border border-[#1E293B] bg-[#0A0E1A]/80 p-3 rounded-xl flex items-center gap-2 text-[11px] font-medium text-slate-400 tracking-wider uppercase">
            <span className="text-slate-500"><GridIcon/></span> Apps
          </div>
          <div className="absolute top-[8%] right-[10%] border border-[#1E293B] bg-[#0A0E1A]/80 p-3 rounded-xl flex items-center gap-2 text-[11px] font-medium text-slate-400 tracking-wider uppercase">
            <span className="text-slate-500"><UsersIcon/></span> Team
          </div>
          <div className="absolute bottom-[8%] left-[10%] border border-[#1E293B] bg-[#0A0E1A]/80 p-3 rounded-xl flex items-center gap-2 text-[11px] font-medium text-slate-400 tracking-wider uppercase">
            <span className="text-slate-500"><ChartIcon/></span> Analytics
          </div>
          <div className="absolute bottom-[8%] right-[10%] border border-[#1E293B] bg-[#0A0E1A]/80 p-3 rounded-xl flex items-center gap-2 text-[11px] font-medium text-slate-400 tracking-wider uppercase">
            <span className="text-slate-500"><ShieldIcon/></span> Security
          </div>
        </div>

        <div className="text-slate-600 text-[10px] tracking-[0.15em] font-mono">
          ENVIRONMENT: US-EAST-1 · ISOLATION: HIGH
        </div>
      </div>

      {/* RIGHT COLUMN: Responsive Form Layout */}
      <div className="w-full lg:w-7/12 flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-xl">
          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100 font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* MOBILE ONLY: Step 1 System (Name) */}
            <div className={`lg:block ${step === 1 ? "block" : "hidden"}`}>
              <div className="mb-8">
                <div className="flex justify-between items-center lg:hidden mb-6">
                  <span className="text-xl font-bold text-slate-900 cursor-pointer" onClick={onBackToHome}>AppOS</span>
                  <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">1/2</span>
                </div>
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Create your workspace</h1>
                <p className="text-slate-500 mt-2 text-sm leading-relaxed">Your workspace is where you manage applications, teams and releases.</p>
              </div>

              <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200/70 shadow-sm space-y-6">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2.5">Workspace name</label>
                  <input
                    type="text"
                    required={step === 1}
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Acme Corp"
                    maxLength={100}
                    minLength={2}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 text-sm placeholder-slate-400 transition-all duration-150"
                  />
                </div>

                <div className="hidden lg:block space-y-6">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2.5">Industry</label>
                    <div className="relative">
                      <select
                        value={formData.industry}
                        onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 text-sm text-slate-700 appearance-none transition-all duration-150"
                      >
                        <option value="">Select an industry...</option>
                        <option value="ecommerce">E-Commerce</option>
                        <option value="technology">Technology & SaaS</option>
                        <option value="finance">Finance & Banking</option>
                        <option value="education">Education</option>
                      </select>
                      <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2.5">Account type</label>
                    <div className="grid grid-cols-2 gap-3.5">
                      {accountTypes.map((type) => {
                        const isSelected = formData.accountType === type.id;
                        return (
                          <button
                            key={type.id}
                            type="button"
                            onClick={() => setFormData({ ...formData, accountType: type.id })}
                            className={`flex flex-col items-center justify-center p-5 rounded-xl border text-center transition-all duration-200 cursor-pointer ${
                              isSelected
                                ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-600/15"
                                : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300"
                            }`}
                          >
                            <div className={`${isSelected ? "text-white" : "text-slate-400"} mb-1.5`}>
                              {type.icon}
                            </div>
                            <span className="text-xs font-semibold tracking-wide">{type.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2.5">Team size</label>
                    <div className="relative">
                      <select
                        value={formData.teamSize}
                        onChange={(e) => setFormData({ ...formData, teamSize: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 text-sm text-slate-700 appearance-none transition-all duration-150"
                      >
                        <option>Just me (1)</option>
                        <option>2-9 members</option>
                        <option>10-49 members</option>
                        <option>50+ members</option>
                      </select>
                      <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => formData.name && setStep(2)}
                  className="w-full lg:hidden py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm transition-colors duration-200 flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/10 cursor-pointer"
                >
                  Continue →
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="hidden lg:block w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-xl font-semibold text-sm transition-colors duration-200 shadow-lg shadow-indigo-600/15 cursor-pointer"
                >
                  {loading ? "Creating workspace..." : "Continue"}
                </button>
              </div>
            </div>

            {/* MOBILE ONLY: Step 2 Layout */}
            <div className={`lg:hidden ${step === 2 ? "block" : "hidden"} space-y-6`}>
              <div className="mb-6 flex justify-between items-center">
                <button type="button" onClick={() => setStep(1)} className="text-xs font-bold text-slate-500 flex items-center gap-1 cursor-pointer">
                  ← Back
                </button>
                <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">2/2</span>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2.5">Industry</label>
                  <div className="relative">
                    <select
                      value={formData.industry}
                      onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none text-sm appearance-none"
                    >
                      <option value="">Select an industry...</option>
                      <option value="ecommerce">E-Commerce</option>
                      <option value="technology">Technology & SaaS</option>
                      <option value="finance">Finance & Banking</option>
                      <option value="education">Education</option>
                    </select>
                    <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2.5">Account type</label>
                  <div className="grid grid-cols-2 gap-3">
                    {accountTypes.map((type) => {
                      const isSelected = formData.accountType === type.id;
                      return (
                        <button
                          key={type.id}
                          type="button"
                          onClick={() => setFormData({ ...formData, accountType: type.id })}
                          className={`flex flex-col items-center justify-center p-4 rounded-xl border text-center transition-all duration-200 cursor-pointer ${
                            isSelected
                              ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-600/15"
                              : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300"
                          }`}
                        >
                          <div className={`${isSelected ? "text-white" : "text-slate-400"} mb-1`}>
                            {type.icon}
                          </div>
                          <span className="text-xs font-semibold">{type.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2.5">Team size</label>
                  <div className="relative">
                    <select
                      value={formData.teamSize}
                      onChange={(e) => setFormData({ ...formData, teamSize: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none text-sm appearance-none"
                    >
                      <option>Just me (1)</option>
                      <option>2-9 members</option>
                      <option>10-49 members</option>
                      <option>50+ members</option>
                    </select>
                    <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-xl font-semibold text-sm transition-colors duration-200 shadow-md cursor-pointer"
                >
                  {loading ? "Creating workspace..." : "Continue"}
                </button>
              </div>
            </div>
            
          </form>
        </div>
      </div>
    </div>
  );
}

