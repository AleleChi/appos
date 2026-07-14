import React, { useState } from "react";
import { Menu, X, ArrowRight, LogOut, LayoutDashboard } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { authService } from "../lib/authService";

interface NavbarProps {
  currentPage: "home" | "pricing" | "security" | "signup" | "login" | "dashboard";
  setCurrentPage: (page: "home" | "pricing" | "security" | "signup" | "login" | "dashboard") => void;
  onGetStarted: () => void;
  user?: any;
}

export default function Navbar({ currentPage, setCurrentPage, onGetStarted, user }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);

  const navItems = ["Product", "Solutions", "Resources", "Pricing", "Security"];

  const handleNavClick = (item: string) => {
    setIsOpen(false);
    const targetId = item.toLowerCase();

    if (item === "Pricing") {
      setCurrentPage("pricing");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else if (item === "Security") {
      setCurrentPage("security");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      if (currentPage !== "home") {
        setCurrentPage("home");
        // Wait for render, then scroll
        setTimeout(() => {
          const el = document.getElementById(targetId);
          if (el) el.scrollIntoView({ behavior: "smooth" });
        }, 150);
      } else {
        const el = document.getElementById(targetId);
        if (el) el.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  const handleSignOutAction = async () => {
    await authService.logout();
    window.location.reload();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#E2E8F0] bg-white/90 backdrop-blur-md select-none">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 md:px-8 w-full">
        {/* Logo */}
        <button
          onClick={() => {
            setCurrentPage("home");
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          className="flex items-center gap-2.5 group cursor-pointer border-0 bg-transparent p-0 focus:outline-none"
        >
          <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-brand-primary text-white shadow-md shadow-brand-primary/20 transition-transform group-hover:scale-105">
            <svg
              className="h-5.5 w-5.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M9 17V7l6 10V7" />
            </svg>
          </div>
          <span className="font-display text-xl font-extrabold tracking-tight text-brand-dark">
            App<span className="text-brand-primary">OS</span>
          </span>
        </button>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-8">
          {navItems.map((item) => {
            const isActive =
              (item === "Pricing" && currentPage === "pricing") ||
              (item === "Security" && currentPage === "security") ||
              (item !== "Pricing" && item !== "Security" && currentPage === "home");

            return (
              <button
                key={item}
                onClick={() => handleNavClick(item)}
                className="relative py-2 text-sm font-semibold text-brand-text-secondary transition-colors hover:text-brand-dark cursor-pointer border-0 bg-transparent p-0 focus:outline-none"
              >
                {item}
                {isActive && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute bottom-0 left-0 h-0.5 w-full bg-brand-primary"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Desktop Call to Actions */}
        <div className="hidden md:flex items-center gap-5">
          {user ? (
            <>
              <button
                onClick={handleSignOutAction}
                className="flex items-center gap-1.5 text-sm font-semibold text-rose-500 hover:text-rose-600 transition-colors cursor-pointer border-0 bg-transparent p-0 focus:outline-none"
              >
                <LogOut className="h-4 w-4" />
                <span>Log out</span>
              </button>
              <button
                onClick={() => setCurrentPage("dashboard")}
                className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4.5 py-2 text-sm font-bold text-white shadow-sm hover:bg-indigo-700 transition-all hover:scale-[1.02] cursor-pointer min-h-[40px]"
              >
                <LayoutDashboard className="h-4 w-4" />
                <span>Console</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setCurrentPage("login")}
                className="text-sm font-semibold text-brand-text-secondary hover:text-brand-dark transition-colors cursor-pointer border-0 bg-transparent p-0 focus:outline-none"
              >
                Login
              </button>
              <button
                onClick={onGetStarted}
                className="flex items-center gap-1.5 rounded-lg bg-brand-primary px-4.5 py-2 text-sm font-bold text-white shadow-sm hover:bg-brand-primary/95 transition-all hover:scale-[1.02] cursor-pointer min-h-[40px]"
              >
                Get Started
                <ArrowRight className="h-4 w-4" />
              </button>
            </>
          )}
        </div>

        {/* Mobile Hamburger Menu Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle menu"
          className="flex h-11 w-11 items-center justify-center rounded-lg border border-[#E2E8F0] bg-brand-bg text-brand-dark md:hidden transition-colors hover:bg-slate-100 cursor-pointer"
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Drawer Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="border-b border-[#E2E8F0] bg-white md:hidden overflow-hidden"
          >
            <div className="flex flex-col gap-4 px-6 py-6 bg-white text-left">
              <div className="flex flex-col gap-1">
                {navItems.map((item) => {
                  const isItemActive =
                    (item === "Pricing" && currentPage === "pricing") ||
                    (item === "Security" && currentPage === "security") ||
                    (item !== "Pricing" && item !== "Security" && currentPage === "home");

                  return (
                    <button
                      key={item}
                      onClick={() => handleNavClick(item)}
                      className={`text-left rounded-lg px-4 py-3 text-base font-bold transition-colors border-0 w-full cursor-pointer ${
                        isItemActive
                          ? "bg-brand-primary/5 text-brand-primary"
                          : "text-brand-text-secondary hover:bg-brand-bg hover:text-brand-dark"
                      }`}
                    >
                      {item}
                    </button>
                  );
                })}
              </div>

              <div className="h-px bg-[#E2E8F0] my-2" />

              <div className="flex flex-col gap-3">
                {user ? (
                  <>
                    <button
                      onClick={() => {
                        setIsOpen(false);
                        setCurrentPage("dashboard");
                      }}
                      className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600 py-3 text-center text-sm font-bold text-white shadow-sm hover:bg-indigo-700 transition-colors cursor-pointer min-h-[44px]"
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      <span>Go to Console</span>
                    </button>
                    <button
                      onClick={() => {
                        setIsOpen(false);
                        handleSignOutAction();
                      }}
                      className="w-full rounded-lg border border-rose-200 bg-rose-50/50 py-3 text-center text-sm font-bold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer min-h-[44px] focus:outline-none"
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        setIsOpen(false);
                        setCurrentPage("login");
                      }}
                      className="w-full rounded-lg border border-[#E2E8F0] py-3 text-center text-sm font-bold text-brand-dark hover:bg-brand-bg transition-colors cursor-pointer min-h-[44px] focus:outline-none"
                    >
                      Login
                    </button>
                    <button
                      onClick={() => {
                        setIsOpen(false);
                        onGetStarted();
                      }}
                      className="w-full rounded-lg bg-brand-primary py-3 text-center text-sm font-bold text-white shadow-sm hover:bg-brand-primary/95 transition-colors cursor-pointer min-h-[44px]"
                    >
                      Get Started
                    </button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
