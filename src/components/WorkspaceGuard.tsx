import React, { useEffect, useState } from "react";
import { getApiUrl } from "../lib/api-config";

interface WorkspaceGuardProps {
  user: any;
  onNavigate: (page: "login" | "workspace-creation" | "dashboard") => void;
  children?: React.ReactNode;
}

export default function WorkspaceGuard({ user, onNavigate, children }: WorkspaceGuardProps) {
  const [loading, setLoading] = useState(true);
  const [hasWorkspace, setHasWorkspace] = useState(false);

  useEffect(() => {
    async function checkUserStatus() {
      if (!user) {
        onNavigate("login");
        window.history.replaceState(null, "", "/login");
        return;
      }

      try {
        const sessionToken = localStorage.getItem("better-auth.session_token") || "";
        const targetUrl = getApiUrl("/api/auth/status");

        const response = await fetch(targetUrl, {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${sessionToken}`,
            "x-better-auth-session": sessionToken
          },
          credentials: "include"
        });
        
        if (!response.ok) {
          onNavigate("login");
          window.history.replaceState(null, "", "/login");
          return;
        }

        const data = await response.json();
        
        if (data.workspaces && data.workspaces.length > 0) {
          setHasWorkspace(true);
          const firstWorkspaceId = data.workspaces[0].id;
          const currentPath = window.location.pathname;

          // If trying to access bare /dashboard, rewrite to their first workspace dashboard URL
          if (currentPath === "/dashboard" || currentPath === "/dashboard/") {
            window.history.replaceState(null, "", `/workspace/${firstWorkspaceId}/dashboard`);
          } else if (currentPath.startsWith("/workspace/") && (currentPath.endsWith("/dashboard") || currentPath.endsWith("/connect"))) {
            // Already inside a valid workspace path
          } else {
            window.history.replaceState(null, "", `/workspace/${firstWorkspaceId}/dashboard`);
          }
        } else {
          setHasWorkspace(false);
          onNavigate("workspace-creation");
          window.history.replaceState(null, "", "/workspace/create");
        }
      } catch (err) {
        console.error("WorkspaceGuard validation failure:", err);
        onNavigate("login");
        window.history.replaceState(null, "", "/login");
      } finally {
        setLoading(false);
      }
    }

    checkUserStatus();
  }, [user, onNavigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-600/20 border-t-indigo-600"></div>
          <p className="text-xs font-bold text-slate-500 tracking-wide uppercase">Verifying Workspace Context...</p>
        </div>
      </div>
    );
  }

  return hasWorkspace ? <>{children}</> : null;
}
