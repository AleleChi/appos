import React, { useState, useEffect } from "react";
import { 
  LayoutDashboard, 
  FolderGit, 
  Cpu, 
  ShieldCheck, 
  Settings, 
  LogOut, 
  Plus, 
  Globe, 
  Smartphone, 
  ExternalLink,
  RefreshCw,
  TrendingUp,
  CloudLightning,
  Play,
  CheckCircle2,
  AlertTriangle
} from "lucide-react";
import { authService } from "../lib/authService";

interface DashboardPageProps {
  user: any;
  onLogout: () => void;
}

interface Workspace {
  id: string;
  name: string;
  appsCount: number;
  createdAt: string;
}

interface Application {
  id: string;
  name: string;
  websiteUrl: string;
  status: "idle" | "analyzing" | "blueprint_generated" | "building" | "completed";
  platform: "ios" | "android" | "hybrid";
  readinessScore: number;
}

export default function DashboardPage({ user, onLogout }: DashboardPageProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "workspaces" | "jobs" | "security">("overview");
  const [workspaces, setWorkspaces] = useState<Workspace[]>([
    { id: "ws_1", name: "Default Workspace", appsCount: 1, createdAt: "2026-07-10" },
    { id: "ws_2", name: "Enterprise Apps", appsCount: 0, createdAt: "2026-07-13" }
  ]);
  const [apps, setApps] = useState<Application[]>([
    {
      id: "app_1",
      name: "Example App",
      websiteUrl: "https://example.com",
      status: "blueprint_generated",
      platform: "hybrid",
      readinessScore: 88
    }
  ]);
  const [newWsName, setNewWsName] = useState("");
  const [isCreatingWs, setIsCreatingWs] = useState(false);
  const [buildProgress, setBuildProgress] = useState(0);
  const [activeBuildId, setActiveBuildId] = useState<string | null>(null);

  // Trigger building simulation
  const handleTriggerBuild = (appId: string) => {
    setApps(apps.map(a => a.id === appId ? { ...a, status: "building" } : a));
    setActiveBuildId(appId);
    setBuildProgress(0);
  };

  useEffect(() => {
    if (activeBuildId) {
      const interval = setInterval(() => {
        setBuildProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setApps(apps => apps.map(a => a.id === activeBuildId ? { ...a, status: "completed", readinessScore: 96 } : a));
            setActiveBuildId(null);
            return 100;
          }
          return prev + 10;
        });
      }, 800);
      return () => clearInterval(interval);
    }
  }, [activeBuildId]);

  const handleCreateWorkspace = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWsName.trim()) return;
    const newWs: Workspace = {
      id: `ws_${Date.now()}`,
      name: newWsName.trim(),
      appsCount: 0,
      createdAt: new Date().toISOString().split("T")[0]
    };
    setWorkspaces([...workspaces, newWs]);
    setNewWsName("");
    setIsCreatingWs(false);
  };

  const handleLogoutAction = async () => {
    const ok = await authService.logout();
    if (ok) {
      onLogout();
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex text-[#1E293B]">
      {/* Sidebar navigation */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col shrink-0 select-none">
        <div className="p-6 flex items-center gap-2 border-b border-slate-800">
          <div className="h-9 w-9 items-center justify-center rounded-xl bg-indigo-500 text-white flex shadow-md">
            <svg
              className="h-5.5 w-5.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M9 17V7l6 10V7" />
            </svg>
          </div>
          <span className="font-display text-xl font-extrabold tracking-tight">
            App<span className="text-indigo-400">OS</span>
          </span>
          <span className="ml-auto text-[10px] bg-indigo-500/20 text-indigo-300 font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">SaaS</span>
        </div>

        {/* User Badge */}
        <div className="p-4 mx-4 my-5 bg-slate-800/50 rounded-xl border border-slate-800 text-left">
          <p className="text-xs text-slate-400 font-semibold tracking-wider uppercase mb-1">Authenticated Tenant</p>
          <p className="text-sm font-bold text-white truncate">{user?.email || "user@appos.com"}</p>
          <div className="flex items-center gap-1.5 mt-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-[11px] font-semibold text-emerald-400 capitalize">{user?.provider || "email"} profile</span>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          <button
            onClick={() => setActiveTab("overview")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
              activeTab === "overview" 
                ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/15" 
                : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
            }`}
          >
            <LayoutDashboard className="h-4.5 w-4.5" />
            Dashboard Overview
          </button>
          <button
            onClick={() => setActiveTab("workspaces")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
              activeTab === "workspaces" 
                ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/15" 
                : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
            }`}
          >
            <FolderGit className="h-4.5 w-4.5" />
            Workspace Manager
          </button>
          <button
            onClick={() => setActiveTab("jobs")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
              activeTab === "jobs" 
                ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/15" 
                : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
            }`}
          >
            <Cpu className="h-4.5 w-4.5" />
            AI Building Jobs
            {activeBuildId && (
              <span className="ml-auto h-2 w-2 rounded-full bg-amber-400 animate-ping" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("security")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
              activeTab === "security" 
                ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/15" 
                : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
            }`}
          >
            <ShieldCheck className="h-4.5 w-4.5" />
            Security Audit Logs
          </button>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button
            onClick={handleLogoutAction}
            className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg text-sm font-semibold transition-all cursor-pointer border-0 bg-transparent text-left"
          >
            <LogOut className="h-4.5 w-4.5" />
            Sign Out Session
          </button>
        </div>
      </aside>

      {/* Main Panel */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-8 shrink-0">
          <h1 className="text-lg font-bold text-slate-900 capitalize">
            {activeTab === "overview" && "Console Overview"}
            {activeTab === "workspaces" && "Workspace Environments"}
            {activeTab === "jobs" && "AI Code Builder Queue"}
            {activeTab === "security" && "Security Access & Audit Trails"}
          </h1>
          <div className="flex items-center gap-4 text-xs font-semibold text-slate-500">
            <span>Server Ingress: Online</span>
            <div className="h-2 w-2 rounded-full bg-emerald-500" />
          </div>
        </header>

        <div className="p-8 max-w-6xl w-full mx-auto">
          {activeTab === "overview" && (
            <div className="space-y-8 text-left">
              {/* Quick stats banner */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <FolderGit className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-400 tracking-wider uppercase">Active Workspaces</p>
                    <p className="text-2xl font-extrabold text-slate-900 mt-0.5">{workspaces.length}</p>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Smartphone className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-400 tracking-wider uppercase">Compiled Native Apps</p>
                    <p className="text-2xl font-extrabold text-slate-900 mt-0.5">{apps.length}</p>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Cpu className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-400 tracking-wider uppercase">Active AI Pipelines</p>
                    <p className="text-2xl font-extrabold text-slate-900 mt-0.5">
                      {activeBuildId ? "1 Running" : "0 Standby"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Active application blueprints */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                  <div>
                    <h3 className="font-display font-extrabold text-base text-slate-950">Active Codebase Blueprints</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Website to mobile code generators configured inside this session</p>
                  </div>
                </div>

                <div className="divide-y divide-slate-100">
                  {apps.map((app) => (
                    <div key={app.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="flex items-start gap-4">
                        <div className="h-12 w-12 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center shrink-0">
                          <Globe className="h-6 w-6 text-slate-400" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-slate-900">{app.name}</h4>
                            <span className="text-[10px] bg-indigo-50 text-indigo-600 font-bold px-2 py-0.5 rounded capitalize">
                              {app.platform} platform
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                            Source: <span className="font-mono text-[11px] text-slate-600">{app.websiteUrl}</span>
                            <ExternalLink className="h-3 w-3" />
                          </p>
                        </div>
                      </div>

                      {/* Status indicator and actions */}
                      <div className="flex items-center gap-8 self-end md:self-auto">
                        <div className="text-right">
                          <p className="text-xs text-slate-400 font-medium">Readiness Score</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <div className="w-16 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                              <div 
                                className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                                style={{ width: `${app.readinessScore}%` }}
                              />
                            </div>
                            <span className="text-xs font-bold text-slate-900">{app.readinessScore}%</span>
                          </div>
                        </div>

                        <div>
                          {app.status === "blueprint_generated" && (
                            <button
                              onClick={() => handleTriggerBuild(app.id)}
                              className="flex items-center gap-1.5 bg-indigo-600 text-white rounded-lg px-4 py-2 text-xs font-bold hover:bg-indigo-700 transition-colors shadow-sm"
                            >
                              <Play className="h-3.5 w-3.5 fill-current" />
                              Trigger AI Build
                            </button>
                          )}
                          {app.status === "building" && (
                            <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs">
                              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                              <span>Compiling... {buildProgress}%</span>
                            </div>
                          )}
                          {app.status === "completed" && (
                            <div className="flex items-center gap-1.5 text-emerald-600 font-bold text-xs bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-1.5">
                              <CheckCircle2 className="h-4 w-4" />
                              <span>App Ready (96% Perfect)</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "workspaces" && (
            <div className="space-y-6 text-left">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="font-display font-extrabold text-base text-slate-950">Workspace Environments</h3>
                  <p className="text-xs text-slate-400">Organize and manage multiple environments for your mobile applications</p>
                </div>
                <button
                  onClick={() => setIsCreatingWs(true)}
                  className="flex items-center gap-1.5 bg-indigo-600 text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                >
                  <Plus className="h-4 w-4" />
                  Add Workspace
                </button>
              </div>

              {isCreatingWs && (
                <form onSubmit={handleCreateWorkspace} className="bg-white p-6 rounded-2xl border border-indigo-100 shadow-sm space-y-4">
                  <h4 className="text-sm font-bold text-slate-900">Create New Workspace</h4>
                  <div className="flex gap-4">
                    <input
                      type="text"
                      placeholder="e.g. Staging Environment"
                      value={newWsName}
                      onChange={(e) => setNewWsName(e.target.value)}
                      className="flex-1 rounded-lg border border-slate-200 px-4 py-2 text-sm focus:outline-none focus:border-indigo-500"
                    />
                    <button
                      type="submit"
                      className="bg-indigo-600 text-white rounded-lg px-4 py-2 text-xs font-bold hover:bg-indigo-700 transition-colors"
                    >
                      Confirm Creation
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsCreatingWs(false)}
                      className="border border-slate-200 text-slate-600 rounded-lg px-4 py-2 text-xs font-bold hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {workspaces.map((ws) => (
                  <div key={ws.id} className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
                    <div>
                      <h4 className="text-sm font-extrabold text-slate-900">{ws.name}</h4>
                      <p className="text-[11px] text-slate-400 mt-1">Tenant ID: {ws.id}</p>
                    </div>
                    <div className="flex items-center justify-between border-t border-slate-100 mt-6 pt-4">
                      <span className="text-xs text-slate-500">{ws.appsCount} Apps compiled</span>
                      <span className="text-[11px] text-slate-400 font-medium">Created: {ws.createdAt}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "jobs" && (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-8 text-left space-y-6">
              <div>
                <h3 className="font-display font-extrabold text-base text-slate-950">Active Compilation Pipeline</h3>
                <p className="text-xs text-slate-400 mt-0.5">Real-time status of current background worker code generation jobs</p>
              </div>

              {activeBuildId ? (
                <div className="border border-indigo-50 bg-indigo-50/20 rounded-xl p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-600">JOB #0041 - CODE_COMPILER</span>
                    <span className="text-xs font-semibold text-slate-500">Active</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-slate-600 font-bold">
                      <span>Generating swift / kotlin wrapper modules...</span>
                      <span>{buildProgress}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-indigo-600 h-full transition-all duration-300"
                        style={{ width: `${buildProgress}%` }}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="border border-dashed border-slate-200 rounded-xl p-8 text-center text-slate-400 space-y-2">
                  <Cpu className="h-8 w-8 mx-auto stroke-[1.5]" />
                  <p className="text-xs font-bold">No active background compilation jobs in the worker queue.</p>
                  <p className="text-[11px] text-slate-400">Trigger compilation from the Dashboard Overview panel.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "security" && (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-8 text-left space-y-6">
              <div>
                <h3 className="font-display font-extrabold text-base text-slate-950">Security & Audit Logs</h3>
                <p className="text-xs text-slate-400 mt-0.5">Cryptographically isolated trails of security events and verified access</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-semibold">
                      <th className="py-3 px-4">Event Type</th>
                      <th className="py-3 px-4">Details</th>
                      <th className="py-3 px-4">IP Address</th>
                      <th className="py-3 px-4">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    <tr>
                      <td className="py-3.5 px-4 font-bold text-indigo-600">session_login_success</td>
                      <td className="py-3.5 px-4">Session handshake completed successfully.</td>
                      <td className="py-3.5 px-4 font-mono">192.168.1.1</td>
                      <td className="py-3.5 px-4 text-slate-400">Just now</td>
                    </tr>
                    <tr>
                      <td className="py-3.5 px-4 font-bold text-indigo-600">mfa_bypass_check</td>
                      <td className="py-3.5 px-4">Strict host and SSL validity parameters matched.</td>
                      <td className="py-3.5 px-4 font-mono">192.168.1.1</td>
                      <td className="py-3.5 px-4 text-slate-400">Just now</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
