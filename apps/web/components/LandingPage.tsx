"use client";

import React from "react";
import HeroSection from "./HeroSection";
import ProcessSection from "./ProcessSection";
import FeatureSection from "./FeatureSection";
import ScoreCard from "./ScoreCard";
import SecuritySection from "./SecuritySection";
import CTASection from "./CTASection";

interface LandingPageProps {
  onAnalyze: (url: string) => void;
  onSeeHowItWorks: () => void;
  analyzingUrl: string | null;
  onStartFree: () => void;
}

export default function LandingPage({
  onAnalyze,
  onSeeHowItWorks,
  analyzingUrl,
  onStartFree,
}: LandingPageProps) {
  return (
    <>
      <HeroSection
        onAnalyze={onAnalyze}
        onSeeHowItWorks={onSeeHowItWorks}
      />
      <ProcessSection />
      <FeatureSection />
      <div id="diagnostics">
        <ScoreCard
          analyzingUrl={analyzingUrl}
          onScanComplete={() => console.log("Scan completed successfully.")}
        />
      </div>
      <SecuritySection />
      <CTASection onStartFree={onStartFree} />
    </>
  );
}
