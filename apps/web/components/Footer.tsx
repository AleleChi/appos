"use client";

import React from "react";
import { Container } from "./MarketingCore";

interface FooterProps {
  currentPage: "home" | "pricing" | "security" | "signup" | "login" | "dashboard";
  setCurrentPage: (page: "home" | "pricing" | "security" | "signup" | "login" | "dashboard") => void;
}

export default function Footer({ currentPage, setCurrentPage }: FooterProps) {
  const mainLinks = ["Product", "Solutions", "Resources", "Pricing", "Security"];
  const subLinks = ["Privacy", "Terms", "Support"];

  const handleLinkClick = (link: string) => {
    const targetId = link.toLowerCase();

    if (link === "Pricing") {
      setCurrentPage("pricing");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else if (link === "Security") {
      setCurrentPage("security");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else if (subLinks.includes(link)) {
      // Just standard scroll or visual fallback
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      if (currentPage !== "home") {
        setCurrentPage("home");
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

  return (
    <footer className="bg-white border-t border-[#E2E8F0] py-12 md:py-16">
      <Container>
        {/* Desktop & Tablet Footer */}
        <div className="hidden sm:flex flex-row justify-between items-start mb-8 pb-8 border-b border-[#F1F5F9]">
          {/* Logo & Info Block */}
          <div className="flex flex-col text-left max-w-sm">
            <button
              onClick={() => {
                setCurrentPage("home");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="flex items-center gap-2.5 mb-4 cursor-pointer focus:outline-none border-0 bg-transparent p-0"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-primary text-white">
                <svg
                  className="h-4.5 w-4.5"
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
              <span className="font-display text-lg font-bold tracking-tight text-brand-dark">
                App<span className="text-brand-primary">OS</span>
              </span>
            </button>
            <p className="text-xs text-brand-text-secondary leading-relaxed font-medium">
              Converting web applications into production-ready native iOS and Android apps with enterprise security and automated publishing.
            </p>
          </div>

          {/* Navigation Links Column */}
          <div className="flex flex-wrap gap-x-6 gap-y-3 justify-end max-w-md pt-1">
            {[...mainLinks, ...subLinks].map((link) => (
              <button
                key={link}
                onClick={() => handleLinkClick(link)}
                className="text-xs font-semibold text-brand-text-secondary hover:text-brand-dark transition-colors cursor-pointer border-0 bg-transparent p-0 focus:outline-none"
              >
                {link}
              </button>
            ))}
          </div>
        </div>

        {/* Mobile Footer (visible only on small mobile screens) */}
        <div className="flex sm:hidden flex-col items-center text-center gap-6 mb-8 pb-8 border-b border-[#F1F5F9]">
          {/* Mobile Logo */}
          <button
            onClick={() => {
              setCurrentPage("home");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="flex items-center gap-2 border-0 bg-transparent p-0"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-primary text-white">
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M9 17V7l6 10V7" />
              </svg>
            </div>
            <span className="font-display text-base font-bold tracking-tight text-brand-dark">
              AppOS
            </span>
          </button>

          {/* Centered Mobile Nav Items */}
          <div className="flex flex-wrap justify-center gap-x-4.5 gap-y-2 px-4">
            {["Product", "Pricing", "Security", "Privacy"].map((link) => (
              <button
                key={link}
                onClick={() => handleLinkClick(link)}
                className="text-xs font-bold text-brand-text-secondary hover:text-brand-dark transition-colors border-0 bg-transparent p-0"
              >
                {link}
              </button>
            ))}
          </div>
        </div>

        {/* Copyright and Legal Section */}
        <div className="flex flex-col sm:flex-row justify-between items-center text-[11px] font-medium text-brand-text-secondary gap-4">
          <p className="text-center sm:text-left">
            © 2024 AppOS. All rights reserved. Built for high-performance native experiences.
          </p>
          <div className="flex gap-4">
            <button
              onClick={() => handleLinkClick("Privacy")}
              className="hover:text-brand-dark transition-colors border-0 bg-transparent p-0 cursor-pointer"
            >
              Privacy Policy
            </button>
            <span>•</span>
            <button
              onClick={() => handleLinkClick("Terms")}
              className="hover:text-brand-dark transition-colors border-0 bg-transparent p-0 cursor-pointer"
            >
              Terms of Service
            </button>
          </div>
        </div>
      </Container>
    </footer>
  );
}
