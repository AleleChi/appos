import React, { useEffect, useState } from "react";
import { getApiUrl } from "../lib/api-config";
import { authClient } from "../lib/auth-client";
import { safeStorage } from "../lib/safe-storage";

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
        // 1. Verify session using the official, cross-origin client interface
        const { data: sessionData, error: sessionError } = await (authClient as any).getSession();
        
        if (sessionError || !sessionData) {
          onNavigate("login");
          window.history.replaceState(null, "", "/login");
          return;
        }

        // 2. Safely retrieve user workspaces directly from our API workspaces endpoint
        const sessionToken = safeStorage.getItem("bearer_token") || "";
        const workspacesResponse = await fetch(getApiUrl("/api/workspaces"), {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${sessionToken}`,
            "x-better-auth-session": sessionToken
          },
          credentials: "include"
        });

        if (!workspacesResponse.ok) {
          onNavigate("workspace-creation");
          window.history.replaceState(null, "", "/workspace/create");
          return;
        }

        const workspaces = await workspacesResponse.json();
        
        if (workspaces && workspaces.length > 0) {
          setHasWorkspace(true);
          const firstWorkspaceId = workspaces[0].id;
          const currentPath = window.location.pathname;

          // If trying to access bare /dashboard, rewrite to their first workspace connect/dashboard URL
          if (currentPath === "/dashboard" || currentPath === "/dashboard/" || currentPath === "/workspace/create") {
            window.history.replaceState(null, "", `/workspace/${firstWorkspaceId}/connect`);
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
      <div className="min-h-screen flex items-center justify-center bg-[#05070F]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
          <p className="text-xs font-bold text-slate-500 tracking-wide uppercase">Verifying Workspace Context...</p>
        </div>
      </div>
    );
  }

  return hasWorkspace ? <>{children}</> : null;
}
