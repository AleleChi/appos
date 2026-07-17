"use client";

import React from "react";
import { Link, Wrench, Rocket } from "lucide-react";
import { motion } from "framer-motion";

export default function ProcessSection() {
  const steps = [
    {
      id: "connect",
      title: "Connect",
      icon: Link,
      desktopDesc: "Instant website analysis and intelligent sync configuration.",
      mobileDesc: "Securely link your existing web infrastructure. AppOS syncs instantly without disrupting your current backend.",
      color: "bg-brand-primary/10 text-brand-primary border-brand-primary/20",
    },
    {
      id: "build",
      title: "Build",
      icon: Wrench,
      desktopDesc: "Native feature integration: Push, Biometrics, and Offline mode.",
      mobileDesc: "Our engine automatically maps your web components to native UI elements, optimizing for iOS and Android.",
      color: "bg-blue-50 text-blue-600 border-blue-100",
    },
    {
      id: "launch",
      title: "Launch",
      icon: Rocket,
      desktopDesc: "Managed submission process and continuous compliance scoring.",
      mobileDesc: "Deploy directly to the App Store and Google Play with a single click. Continuous updates are handled automatically.",
      color: "bg-indigo-50 text-indigo-600 border-indigo-100",
    },
  ];

  return (
    <section id="solutions" className="py-16 md:py-24 bg-white border-y border-slate-100">
      <div className="mx-auto max-w-7xl px-6 md:px-8">
        
        {/* Section Heading */}
        <div className="text-center mb-16 md:mb-20">
          <h2 className="font-display text-3xl md:text-4.5xl font-extrabold tracking-tight text-brand-dark">
            From URL to App Store.
          </h2>
          <p className="mt-4 text-base md:text-lg text-brand-text-secondary max-w-2xl mx-auto">
            Our automated compile-and-submit pipeline gets your application approved in days, not months.
          </p>
        </div>

        {/* Process Flow - Responsive Layout */}
        <div className="relative">
          {/* Connector Line (Desktop Only) */}
          <div className="absolute top-1/4 left-[12%] right-[12%] h-[1.5px] bg-[#E2E8F0] hidden lg:block z-0" />

          {/* Steps Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-8 relative z-10">
            {steps.map((step, index) => {
              const StepIcon = step.icon;
              return (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.35, delay: index * 0.1 }}
                  className="flex flex-col items-center text-center px-4"
                >
                  {/* Icon Circle */}
                  <div className={`relative flex h-16 w-16 items-center justify-center rounded-full border shadow-sm ${step.color} bg-white mb-6 transition-transform hover:scale-105 duration-300`}>
                    <StepIcon className="h-6 w-6" />
                    {/* Progress Badge for UX */}
                    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-[10px] font-bold text-white font-mono border border-white">
                      0{index + 1}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="font-display text-xl font-bold text-brand-dark mb-3">
                    {step.title}
                  </h3>

                  {/* Desktop Description */}
                  <p className="hidden md:block text-sm font-normal leading-relaxed text-brand-text-secondary max-w-xs">
                    {step.desktopDesc}
                  </p>

                  {/* Mobile Description */}
                  <p className="block md:hidden text-sm font-normal leading-relaxed text-brand-text-secondary max-w-sm">
                    {step.mobileDesc}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>

      </div>
    </section>
  );
}
