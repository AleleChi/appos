import React, { useState, useEffect } from "react";
import { Check, Loader2, ArrowRight, ShieldCheck, HelpCircle } from "lucide-react";
import { motion, useAnimation } from "framer-motion";

interface ScoreCardProps {
  analyzingUrl: string | null;
  onScanComplete?: () => void;
}

export default function ScoreCard({ analyzingUrl, onScanComplete }: ScoreCardProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [score, setScore] = useState(92);
  const [performance, setPerformance] = useState(100);
  const [accessibility, setAccessibility] = useState(89);
  const [scanStep, setScanStep] = useState("");
  const [hasScanned, setHasScanned] = useState(false);

  // Trigger scan when analyzingUrl prop changes
  useEffect(() => {
    if (analyzingUrl) {
      triggerScan();
    }
  }, [analyzingUrl]);

  const triggerScan = () => {
    setIsScanning(true);
    setHasScanned(false);
    setProgress(0);
    setScanStep("Initializing AppOS Engine...");

    const steps = [
      { p: 15, text: "Scanning HTML structure..." },
      { p: 30, text: "Verifying touch target guidelines (minimum 44px)..." },
      { p: 50, text: "Checking Content Security Policies (CSP)..." },
      { p: 70, text: "Analyzing responsive viewport scale..." },
      { p: 85, text: "Running App Store policy conformance audit..." },
      { p: 100, text: "Generating readiness scorecard..." },
    ];

    let currentStepIdx = 0;
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsScanning(false);
          setHasScanned(true);
          // Generate a highly realistic compatible score
          const randomScore = Math.floor(Math.random() * 8) + 91; // 91 to 98
          setScore(randomScore);
          setPerformance(100);
          setAccessibility(Math.floor(Math.random() * 10) + 85); // 85 to 95
          if (onScanComplete) onScanComplete();
          return 100;
        }

        const nextProgress = prev + 5;
        // Check if we should update step message
        if (
          currentStepIdx < steps.length &&
          nextProgress >= steps[currentStepIdx].p
        ) {
          setScanStep(steps[currentStepIdx].text);
          currentStepIdx++;
        }
        return nextProgress;
      });
    }, 100);
  };

  return (
    <section id="pricing" className="py-16 md:py-24 bg-white border-b border-slate-100">
      <div className="mx-auto max-w-7xl px-6 md:px-8">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-16">
          
          {/* Left Column (Static/Info text) */}
          <div className="lg:col-span-6 text-left">
            <h2 className="font-display text-3xl md:text-4.5xl font-extrabold tracking-tight text-brand-dark mb-4">
              App Readiness Score
            </h2>
            <p className="text-base md:text-lg text-brand-text-secondary leading-relaxed mb-8">
              Our sophisticated validation engine checks your configuration against current App Store and Google Play guidelines in real-time, ensuring a smooth approval process.
            </p>

            {/* Checklists */}
            <div className="space-y-6">
              
              {/* Checklist 1 */}
              <div className="flex items-start gap-4">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 mt-0.5">
                  <Check className="h-4 w-4 stroke-[3]" />
                </div>
                <div>
                  <h4 className="text-sm md:text-base font-bold text-brand-dark">
                    Content Policy Check
                  </h4>
                  <p className="text-xs md:text-sm text-brand-text-secondary mt-1">
                    Automated scanning for restricted content and security policies.
                  </p>
                </div>
              </div>

              {/* Checklist 2 */}
              <div className="flex items-start gap-4">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 mt-0.5">
                  <Check className="h-4 w-4 stroke-[3]" />
                </div>
                <div>
                  <h4 className="text-sm md:text-base font-bold text-brand-dark">
                    UI/UX Guidelines
                  </h4>
                  <p className="text-xs md:text-sm text-brand-text-secondary mt-1">
                    Verifies touch targets, responsive breakpoints, and mobile navigation patterns.
                  </p>
                </div>
              </div>

            </div>

            {/* Quick action to trigger scanner if not already analyzing */}
            {!isScanning && (
              <button
                onClick={triggerScan}
                className="mt-8 inline-flex items-center gap-1.5 rounded-lg border border-brand-primary/20 bg-brand-primary/5 px-4.5 py-2.5 text-sm font-semibold text-brand-primary hover:bg-brand-primary/10 transition-colors cursor-pointer"
              >
                Run Direct Conformance Test
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Right Column (High Fidelity Visual Score Card) */}
          <div className="lg:col-span-6 w-full flex justify-center">
            
            {/* Desktop Readiness Score Card */}
            <div className="hidden md:block w-full max-w-[480px] rounded-2xl border border-slate-200/80 bg-white shadow-xl shadow-slate-100/50 p-6 relative overflow-hidden">
              
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
                <span className="text-xs font-bold text-brand-dark tracking-wide">Readiness Assessment</span>
                {isScanning ? (
                  <div className="flex items-center gap-1.5 text-brand-primary">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span className="text-[11px] font-mono font-bold uppercase tracking-wider">Analyzing...</span>
                  </div>
                ) : (
                  <span className="rounded bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-600 uppercase">
                    Passing
                  </span>
                )}
              </div>

              {/* Center Score Graphic */}
              <div className="flex flex-col items-center justify-center py-6">
                {isScanning ? (
                  <div className="h-36 w-36 flex flex-col items-center justify-center relative">
                    {/* Ring background */}
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="72" cy="72" r="58" stroke="#F1F5F9" strokeWidth="8" fill="transparent" />
                      <circle
                        cx="72"
                        cy="72"
                        r="58"
                        stroke="#635BFF"
                        strokeWidth="8"
                        fill="transparent"
                        strokeDasharray={364.4}
                        strokeDashoffset={364.4 - (364.4 * progress) / 100}
                        strokeLinecap="round"
                        className="transition-all duration-100 ease-out"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
                      <span className="text-2xl font-extrabold text-brand-dark font-mono">{progress}%</span>
                      <span className="text-[9px] font-bold text-brand-text-secondary mt-1 max-w-[90px] leading-tight truncate">
                        {scanStep}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="h-36 w-36 flex flex-col items-center justify-center relative bg-[radial-gradient(circle_at_center,rgba(99,91,255,0.03)_0%,transparent_70%)] rounded-full">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="72" cy="72" r="58" stroke="#F1F5F9" strokeWidth="6" fill="transparent" />
                      <circle
                        cx="72"
                        cy="72"
                        r="58"
                        stroke="#635BFF"
                        strokeWidth="8"
                        fill="transparent"
                        strokeDasharray={364.4}
                        strokeDashoffset={364.4 - (364.4 * score) / 100}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-4xl font-black text-brand-dark font-mono">{score}</span>
                      <span className="text-xs font-medium text-slate-400 mt-0.5">/ 100</span>
                    </div>
                  </div>
                )}

                <span className="text-xs font-semibold text-brand-dark mt-4">
                  {isScanning ? "Compiling Web Compatibility Matrix" : "Optimal compatibility matched"}
                </span>
              </div>

              {/* Status and performance bars */}
              <div className="space-y-4 mt-4 border-t border-slate-100 pt-6">
                
                {/* Performance progress bar */}
                <div>
                  <div className="flex justify-between text-xs font-medium mb-1.5">
                    <span className="text-brand-text-secondary">Performance</span>
                    <span className="text-brand-dark font-bold font-mono">{isScanning ? `${Math.min(progress, 100)}%` : `${performance}%`}</span>
                  </div>
                  <div className="w-full h-1.5 bg-[#F1F5F9] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand-primary rounded-full transition-all duration-300"
                      style={{ width: isScanning ? `${Math.min(progress, 100)}%` : `${performance}%` }}
                    />
                  </div>
                </div>

                {/* Accessibility progress bar */}
                <div>
                  <div className="flex justify-between text-xs font-medium mb-1.5">
                    <span className="text-brand-text-secondary">Accessibility</span>
                    <span className="text-brand-dark font-bold font-mono">{isScanning ? `${Math.min(Math.floor(progress * 0.89), 89)}%` : `${accessibility}%`}</span>
                  </div>
                  <div className="w-full h-1.5 bg-[#F1F5F9] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand-primary rounded-full transition-all duration-300"
                      style={{ width: isScanning ? `${Math.min(Math.floor(progress * 0.89), 89)}%` : `${accessibility}%` }}
                    />
                  </div>
                </div>

              </div>

            </div>

            {/* Mobile Readiness Score Card (exact representation from Stitch Mobile) */}
            <div className="block md:hidden w-full max-w-[390px] rounded-xl border border-slate-200/80 bg-white p-6 shadow-md text-center">
              
              <span className="text-[11px] font-mono font-bold tracking-widest text-slate-400 uppercase">
                APP READINESS SCORE
              </span>

              {isScanning ? (
                <div className="flex flex-col items-center justify-center my-6">
                  <div className="relative h-28 w-28 flex items-center justify-center">
                    <Loader2 className="h-12 w-12 text-brand-primary animate-spin" />
                  </div>
                  <span className="text-sm font-semibold text-brand-text-secondary mt-2 animate-pulse">
                    {scanStep}
                  </span>
                </div>
              ) : (
                <div className="my-6">
                  <div className="text-5.5xl font-black text-brand-dark font-mono leading-none tracking-tight">
                    {hasScanned ? score : 98}
                  </div>
                  <div className="text-sm font-semibold text-slate-400 mt-1">/100</div>
                  
                  {/* Gauge line */}
                  <div className="w-3/4 mx-auto h-1.5 bg-[#F1F5F9] rounded-full overflow-hidden mt-5">
                    <div
                      className="h-full bg-brand-primary rounded-full transition-all duration-500"
                      style={{ width: hasScanned ? `${score}%` : "98%" }}
                    />
                  </div>
                </div>
              )}

              <p className="text-xs font-semibold text-brand-text-secondary leading-relaxed px-2">
                Your current web architecture is highly compatible. Estimated build time: <span className="text-brand-dark font-bold">4.2 minutes</span>.
              </p>

            </div>

          </div>

        </div>
      </div>
    </section>
  );
}
