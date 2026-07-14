/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import HeroSection from "./components/HeroSection";
import ProcessSection from "./components/ProcessSection";
import FeatureSection from "./components/FeatureSection";
import ScoreCard from "./components/ScoreCard";
import SecuritySection from "./components/SecuritySection";
import CTASection from "./components/CTASection";
import Footer from "./components/Footer";
import PricingSection from "./components/PricingSection";
import SecurityPage from "./components/SecurityPage";
import SignupPage from "./components/SignupPage";
import DashboardPage from "./components/DashboardPage";
import { authService } from "./lib/authService";
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
    | "not-found"
    | "server-error"
  >("home");
  const [analyzingUrl, setAnalyzingUrl] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [isSessionLoading, setIsSessionLoading] = useState(true);

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
    } else if (currentPage === "not-found") {
      // Do not replace address bar so user can see their invalid path, but do not push state to prevent infinite loops
    } else if (currentPage === "dashboard" && path !== "/dashboard") {
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
      setCurrentPage("dashboard");
    }
  }, [user, currentPage]);

  // Perform secure session initialization check on mount
  useEffect(() => {
    const initializeSession = async () => {
      try {
         const data = await authService.getMe();
         if (data && data.user) {
           setUser(data.user);
           const path = window.location.pathname;
           if (path === "/login" || path === "/signup" || path === "/") {
             setCurrentPage("dashboard");
           }
         }
      } catch (err) {
        console.error("Session check failure:", err);
      } finally {
        setIsSessionLoading(false);
      }
    };
    initializeSession();
  }, []);

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
  if (currentPage === "dashboard" && !user) {
    setCurrentPage("login");
    return null;
  }

  return (
    <div className="min-h-screen bg-[#F7F9FC] flex flex-col antialiased font-sans">
      {/* 1. Shared Navigation Header (Hidden on dashboard and auth screens) */}
      {!isAuthPage && currentPage !== "dashboard" && (
        <Navbar
          currentPage={currentPage}
          setCurrentPage={(page) => setCurrentPage(page as any)}
          onGetStarted={handleGetStartedAction}
          user={user}
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1">
        {currentPage === "dashboard" ? (
          <DashboardPage
            user={user}
            onLogout={() => {
              setUser(null);
              setCurrentPage("home");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          />
        ) : currentPage === "auth-callback" ? (
          <AuthCallbackView
            onSuccess={(authenticatedUser) => {
              setUser(authenticatedUser);
              setCurrentPage("dashboard");
            }}
          />
        ) : currentPage === "auth-error" ? (
          <AuthErrorView
            onNavigate={(page) => setCurrentPage(page)}
          />
        ) : currentPage === "auth-link-account" ? (
          <AuthLinkAccountView
            onSuccess={(authenticatedUser) => {
              setUser(authenticatedUser);
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
            onSignupSuccess={(authenticatedUser) => {
              setUser(authenticatedUser);
              setTimeout(() => {
                setCurrentPage("dashboard");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }, 1200);
            }}
          />
        ) : currentPage === "home" ? (
          <>
            {/* 2. Hero Section */}
            <HeroSection
              onAnalyze={handleAnalyzeUrl}
              onSeeHowItWorks={() => scrollToSection("solutions")}
            />

            {/* 3. How It Works (Process Steps) */}
            <ProcessSection />

            {/* 4. Native Capabilities (Feature Grid) */}
            <FeatureSection />

            {/* 5. App Readiness Score (Diagnostics Dashboard) */}
            <div id="diagnostics">
              <ScoreCard
                analyzingUrl={analyzingUrl}
                onScanComplete={() => console.log("Scan completed successfully.")}
              />
            </div>

            {/* 6. Security Section (Dark Contrast block) */}
            <SecuritySection />

            {/* 7. Final CTA Banner */}
            <CTASection onStartFree={handleGetStartedAction} />
          </>
        ) : currentPage === "pricing" ? (
          /* 8. Dedicated High Fidelity Pricing Page */
          <PricingSection onGetStarted={handleGetStartedAction} />
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
      </main>

      {/* 9. Shared Footer Section (Hidden on dashboard and auth screens) */}
      {!isAuthPage && currentPage !== "dashboard" && (
        <Footer 
          currentPage={currentPage} 
          setCurrentPage={(page) => setCurrentPage(page as any)} 
        />
      )}
    </div>
  );
}
