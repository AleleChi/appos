/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import SignupPage from "./components/SignupPage";
import DashboardPage from "./components/DashboardPage";
import WorkspaceCreationPage from "./pages/WorkspaceCreationPage";
import WorkspaceGuard from "./components/WorkspaceGuard";
import ConnectWebsitePage from "./pages/ConnectWebsitePage";

// Lazy-loaded components for dynamic bundle splitting
const LandingPage = React.lazy(() => import("./components/LandingPage"));
const PricingPage = React.lazy(() => import("./components/PricingSection"));
const SecurityPage = React.lazy(() => import("./components/SecurityPage"));
import { authService } from "./lib/authService";
import { authClient } from "./lib/auth-client";
import { 
  AuthCallbackView, 
  AuthErrorView, 
  AuthLinkAccountView, 
  AuthVerifyEmailView, 
  AuthNotFoundView, 
  AuthServerErrorView 
} from "./components/AuthStateViews";

export default function App() {
  const [currentPage, setCurrentPage] = useState<
    | "home"
    | "pricing"
    | "security"
    | "signup"
    | "login"
    | "forgot-password"
    | "reset-password"
    | "verify-email"
    | "dashboard"
    | "auth-callback"
    | "auth-error"
    | "auth-link-account"
    | "workspace-creation"
    | "connect-website"
    | "not-found"
    | "server-error"
  >("home");
  const [analyzingUrl, setAnalyzingUrl] = useState<string | null>(null);

  // Use the reactive Better Auth session hook with a safety timeout boundary
  const { data: sessionData, isPending: isBetterAuthLoading } = (authClient as any).useSession();
  const [isSessionLoading, setIsSessionLoading] = useState(true);
  const user = sessionData?.user || null;

  useEffect(() => {
    if (!isBetterAuthLoading) {
      setIsSessionLoading(false);
      return;
    }

    const timer = setTimeout(() => {
      if (isBetterAuthLoading) {
        console.warn("Authentication Boundary: Session retrieval timed out. Falling back to login layout.");
        setIsSessionLoading(false);
        setCurrentPage("login");
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [isBetterAuthLoading]);

  // Smooth scroll helper
  const scrollToSection = (id: string) => {
    if (currentPage !== "home") {
      setCurrentPage("home");
      setTimeout(() => {
        const el = document.getElementById(id);
        if (el) {
          el.scrollIntoView({ behavior: "smooth" });
        }
      }, 150);
    } else {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  const handleAnalyzeUrl = (url: string) => {
    setAnalyzingUrl(null); // Reset first to allow re-trigger
    setTimeout(() => {
      setAnalyzingUrl(url);
      setCurrentPage("home");
      setTimeout(() => {
        const el = document.getElementById("diagnostics");
        if (el) el.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }, 100);
  };

  const handleGetStartedAction = () => {
    if (user) {
      setCurrentPage("dashboard");
    } else {
      setCurrentPage("signup");
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // --- CLIENT-SIDE ROUTER & PATH PARSER ---
  useEffect(() => {
    const handleUrlChange = () => {
      const path = window.location.pathname;
      if (path === "/") {
        setCurrentPage("home");
      } else if (path === "/signup") {
        setCurrentPage("signup");
      } else if (path === "/login") {
        setCurrentPage("login");
      } else if (path === "/forgot-password") {
        setCurrentPage("forgot-password");
      } else if (path === "/reset-password") {
        setCurrentPage("reset-password");
      } else if (path === "/verify-email") {
        setCurrentPage("verify-email");
      } else if (path === "/pricing") {
        setCurrentPage("pricing");
      } else if (path === "/security") {
        setCurrentPage("security");
      } else if (path === "/auth/callback") {
        setCurrentPage("auth-callback");
      } else if (path === "/auth/error") {
        setCurrentPage("auth-error");
      } else if (path === "/auth/link-account") {
        setCurrentPage("auth-link-account");
      } else if (path === "/workspace/create" || path === "/workspace-creation") {
        setCurrentPage("workspace-creation");
      } else if (path.startsWith("/workspace/") && path.endsWith("/connect")) {
        if (user) {
          setCurrentPage("connect-website");
        } else {
          setCurrentPage("login");
          window.history.replaceState(null, "", "/login");
        }
      } else if (path.startsWith("/workspace/") && path.endsWith("/dashboard")) {
        if (user) {
          setCurrentPage("dashboard");
        } else {
          setCurrentPage("login");
          window.history.replaceState(null, "", "/login");
        }
      } else if (path === "/dashboard") {
        if (user) {
          setCurrentPage("dashboard");
        } else {
          setCurrentPage("login");
          window.history.replaceState(null, "", "/login");
        }
      } else {
        setCurrentPage("not-found");
      }
    };

    handleUrlChange();
    window.addEventListener("popstate", handleUrlChange);
    return () => window.removeEventListener("popstate", handleUrlChange);
  }, [user]);

  // Synchronize browser address bar with App state changes
  useEffect(() => {
    const path = window.location.pathname;
    const search = window.location.search;
    if (currentPage === "home" && path !== "/") {
      window.history.pushState(null, "", "/" + search);
    } else if (currentPage === "pricing" && path !== "/pricing") {
      window.history.pushState(null, "", "/pricing" + search);
    } else if (currentPage === "security" && path !== "/security") {
      window.history.pushState(null, "", "/security" + search);
    } else if (currentPage === "signup" && path !== "/signup") {
      window.history.pushState(null, "", "/signup" + search);
    } else if (currentPage === "login" && path !== "/login") {
      window.history.pushState(null, "", "/login" + search);
    } else if (currentPage === "forgot-password" && path !== "/forgot-password") {
      window.history.pushState(null, "", "/forgot-password" + search);
    } else if (currentPage === "reset-password" && path !== "/reset-password") {
      window.history.pushState(null, "", "/reset-password" + search);
    } else if (currentPage === "verify-email" && path !== "/verify-email") {
      window.history.pushState(null, "", "/verify-email" + search);
    } else if (currentPage === "auth-callback" && path !== "/auth/callback") {
      window.history.pushState(null, "", "/auth/callback" + search);
    } else if (currentPage === "auth-error" && path !== "/auth/error") {
      window.history.pushState(null, "", "/auth/error" + search);
    } else if (currentPage === "auth-link-account" && path !== "/auth/link-account") {
      window.history.pushState(null, "", "/auth/link-account" + search);
    } else if (currentPage === "workspace-creation" && path !== "/workspace/create") {
      window.history.pushState(null, "", "/workspace/create" + search);
    } else if (currentPage === "connect-website" && !path.startsWith("/workspace/") && !path.endsWith("/connect")) {
      if (user) {
        const workspaceIdMatch = path.match(/^\/workspace\/([^\/]+)/);
        const wsId = workspaceIdMatch ? workspaceIdMatch[1] : "default";
        window.history.pushState(null, "", `/workspace/${wsId}/connect` + search);
      } else {
        setCurrentPage("login");
        window.history.replaceState(null, "", "/login" + search);
      }
    } else if (currentPage === "not-found") {
      // Do not replace address bar so user can see their invalid path, but do not push state to prevent infinite loops
    } else if (currentPage === "dashboard" && !path.startsWith("/workspace/") && path !== "/dashboard") {
      if (user) {
        window.history.pushState(null, "", "/dashboard" + search);
      } else {
        setCurrentPage("login");
        window.history.replaceState(null, "", "/login" + search);
      }
    }
  }, [currentPage, user]);

  // Redirect authenticated users away from authentication views to prevent signup/login loops
  useEffect(() => {
    if (user && ["signup", "login", "forgot-password", "reset-password"].includes(currentPage)) {
      fetch("/api/auth/status")
        .then((res) => res.json())
        .then((data) => {
          if (data.workspaces && data.workspaces.length > 0) {
            window.history.pushState(null, "", `/workspace/${data.workspaces[0].id}/dashboard`);
            setCurrentPage("dashboard");
          } else {
            setCurrentPage("workspace-creation");
          }
        })
        .catch(() => {
          setCurrentPage("workspace-creation");
        });
    }
  }, [user, currentPage]);

  // Sync initial routing with current session if landed on login/signup/home
  useEffect(() => {
    if (!isSessionLoading && user) {
      const path = window.location.pathname;
      if (path === "/login" || path === "/signup" || path === "/") {
        fetch("/api/auth/status")
          .then((res) => res.json())
          .then((data) => {
            if (data.workspaces && data.workspaces.length > 0) {
              window.history.pushState(null, "", `/workspace/${data.workspaces[0].id}/dashboard`);
              setCurrentPage("dashboard");
            } else {
              setCurrentPage("workspace-creation");
            }
          })
          .catch(() => {
            setCurrentPage("workspace-creation");
          });
      }
    }
  }, [isSessionLoading, user]);
if (isSessionLoading) {
    return (
      <div className="min-h-screen bg-[#F7F9FC] flex flex-col items-center justify-center font-sans antialiased">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin" />
          <p className="text-xs font-bold text-slate-500 tracking-wide uppercase">Initializing AppOS Security...</p>
        </div>
      </div>
    );
  }

  const isAuthPage = [
    "signup",
    "login",
    "forgot-password",
    "reset-password",
    "verify-email",
    "auth-callback",
    "auth-error",
    "auth-link-account"
  ].includes(currentPage);

  // Under protected routing: redirect unauthenticated access away from dashboard
  if ((currentPage === "dashboard" || currentPage === "connect-website") && !user) {
    setCurrentPage("login");
    return null;
  }

  return (
    <div className="min-h-screen bg-[#F7F9FC] flex flex-col antialiased font-sans">
      {/* 1. Shared Navigation Header (Hidden on dashboard and auth screens) */}
      {!isAuthPage && currentPage !== "dashboard" && currentPage !== "workspace-creation" && currentPage !== "connect-website" && (
        <Navbar
          currentPage={currentPage}
          setCurrentPage={(page) => setCurrentPage(page as any)}
          onGetStarted={handleGetStartedAction}
          user={user}
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1">
        <React.Suspense fallback={null}>
          {currentPage === "dashboard" ? (
            <WorkspaceGuard user={user} onNavigate={(page) => setCurrentPage(page as any)}>
              <DashboardPage
                user={user}
                onLogout={async () => {
                  await authService.logout();
                  setCurrentPage("home");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              />
            </WorkspaceGuard>
          ) : currentPage === "connect-website" ? (
            <ConnectWebsitePage />
          ) : currentPage === "workspace-creation" ? (
            <WorkspaceCreationPage
              onWorkspaceCreated={(workspaceId) => {
                window.history.pushState(null, "", `/workspace/${workspaceId}/dashboard`);
                setCurrentPage("dashboard");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              onBackToHome={() => {
                setCurrentPage("home");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            />
          ) : currentPage === "auth-callback" ? (
            <AuthCallbackView
              onSuccess={() => {
                setCurrentPage("dashboard");
              }}
            />
          ) : currentPage === "auth-error" ? (
            <AuthErrorView
              onNavigate={(page) => setCurrentPage(page)}
            />
          ) : currentPage === "auth-link-account" ? (
            <AuthLinkAccountView
              onSuccess={() => {
                setCurrentPage("dashboard");
              }}
              onNavigate={(page) => setCurrentPage(page)}
            />
          ) : currentPage === "verify-email" ? (
            <AuthVerifyEmailView
              onNavigate={(page) => setCurrentPage(page)}
            />
          ) : isAuthPage ? (
            <SignupPage
              initialMode={
                currentPage === "login"
                  ? "login"
                  : currentPage === "forgot-password"
                  ? "forgot-password"
                  : currentPage === "reset-password"
                  ? "reset-password"
                  : "signup"
              }
              onBackToHome={() => {
                setCurrentPage("home");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              onSignupSuccess={async () => {
                try {
                  const response = await fetch("/api/auth/status");
                  if (response.ok) {
                    const data = await response.json();
                    if (data.workspaces && data.workspaces.length > 0) {
                      window.history.pushState(null, "", `/workspace/${data.workspaces[0].id}/dashboard`);
                      setCurrentPage("dashboard");
                    } else {
                      window.history.pushState(null, "", "/workspace/create");
                      setCurrentPage("workspace-creation");
                    }
                  } else {
                    window.history.pushState(null, "", "/workspace/create");
                    setCurrentPage("workspace-creation");
                  }
                } catch (err) {
                  window.history.pushState(null, "", "/workspace/create");
                  setCurrentPage("workspace-creation");
                }
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            />
          ) : currentPage === "home" ? (
            <LandingPage
              onAnalyze={handleAnalyzeUrl}
              onSeeHowItWorks={() => scrollToSection("solutions")}
              analyzingUrl={analyzingUrl}
              onStartFree={handleGetStartedAction}
            />
          ) : currentPage === "pricing" ? (
            /* 8. Dedicated High Fidelity Pricing Page */
            <PricingPage onGetStarted={handleGetStartedAction} />
          ) : currentPage === "security" ? (
            /* 8b. Dedicated High Fidelity Security Page */
            <SecurityPage onGetStarted={handleGetStartedAction} />
          ) : currentPage === "server-error" ? (
            <AuthServerErrorView
              onNavigate={(page) => setCurrentPage(page)}
            />
          ) : (
            <AuthNotFoundView
              onNavigate={(page) => setCurrentPage(page)}
            />
          )}
        </React.Suspense>
      </main>

      {/* 9. Shared Footer Section (Hidden on dashboard and auth screens) */}
      {!isAuthPage && currentPage !== "dashboard" && currentPage !== "workspace-creation" && currentPage !== "connect-website" && (
        <Footer 
          currentPage={currentPage} 
          setCurrentPage={(page) => setCurrentPage(page as any)} 
        />
      )}
    </div>
  );
}
