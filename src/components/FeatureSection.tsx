import React from "react";
import { Bell, Fingerprint, WifiOff, BarChart3 } from "lucide-react";
import { motion } from "motion/react";

export default function FeatureSection() {
  return (
    <section id="resources" className="py-16 md:py-24 bg-[#F7F9FC]">
      <div className="mx-auto max-w-7xl px-6 md:px-8">
        
        {/* Section Heading */}
        <div className="text-left mb-12 md:mb-16">
          <h2 className="font-display text-3xl md:text-4.5xl font-extrabold tracking-tight text-brand-dark">
            Native Capabilities
          </h2>
          <p className="mt-4 text-base md:text-lg text-brand-text-secondary max-w-xl">
            Unleash the full potential of mobile hardware. AppOS compiles native features directly into your application binary.
          </p>
        </div>

        {/* Responsive Grid Layout */}
        
        {/* Desktop & Tablet Layout (screen >= 768px) */}
        <div className="hidden md:grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left: Push Notifications (Tall Card) */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.3 }}
            className="lg:col-span-6 flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-8 shadow-sm transition-all hover:shadow-md hover:border-slate-300 group"
          >
            <div>
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-brand-primary border border-indigo-100 mb-8 group-hover:scale-105 transition-transform">
                <Bell className="h-6 w-6" />
              </div>
              <h3 className="font-display text-2xl font-bold text-brand-dark mb-4">
                Push Notifications
              </h3>
              <p className="text-sm md:text-base text-brand-text-secondary leading-relaxed max-w-md">
                Engage users with targeted, rich media notifications directly to their lock screens. High delivery rates guaranteed.
              </p>
            </div>
            
            <div className="mt-12 pt-6 border-t border-slate-100 flex items-center gap-3">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">Supported OS:</span>
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">iOS APNS</span>
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">Android FCM</span>
            </div>
          </motion.div>

          {/* Right: Nested Grids */}
          <div className="lg:col-span-6 flex flex-col gap-6">
            
            {/* Top: Biometric Auth (Wide Card) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="rounded-2xl border border-slate-200/80 bg-white p-8 shadow-sm transition-all hover:shadow-md hover:border-slate-300 flex items-start gap-6 group"
            >
              <div className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600 border border-purple-100 group-hover:scale-105 transition-transform">
                <Fingerprint className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-display text-xl font-bold text-brand-dark mb-2">
                  Biometric Auth
                </h3>
                <p className="text-sm md:text-base text-brand-text-secondary leading-relaxed">
                  FaceID and TouchID integration for seamless, secure login experiences.
                </p>
              </div>
            </motion.div>

            {/* Bottom side-by-side Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              
              {/* Offline Mode */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.3, delay: 0.2 }}
                className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:border-slate-300 group"
              >
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 border border-blue-100 mb-4 group-hover:scale-105 transition-transform">
                  <WifiOff className="h-5 w-5" />
                </div>
                <h3 className="font-display text-lg font-bold text-brand-dark mb-2">
                  Offline Mode
                </h3>
                <p className="text-xs md:text-sm text-brand-text-secondary leading-relaxed">
                  Intelligent caching for offline access.
                </p>
              </motion.div>

              {/* Native Analytics */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.3, delay: 0.3 }}
                className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:border-slate-300 group"
              >
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-slate-50 text-slate-600 border border-slate-100 mb-4 group-hover:scale-105 transition-transform">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <h3 className="font-display text-lg font-bold text-brand-dark mb-2">
                  Native Analytics
                </h3>
                <p className="text-xs md:text-sm text-brand-text-secondary leading-relaxed">
                  Deep insights into app usage.
                </p>
              </motion.div>

            </div>
          </div>

        </div>

        {/* Mobile Stack Layout (screen < 768px - exact mobile design match) */}
        <div className="flex md:hidden flex-col gap-5">
          
          {/* Card 1: Push Notifications */}
          <div className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-sm">
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-brand-primary border border-indigo-100 mb-4">
              <Bell className="h-5.5 w-5.5" />
            </div>
            <h3 className="font-display text-lg font-extrabold text-brand-dark mb-2">
              Push Notifications
            </h3>
            <p className="text-sm font-medium text-brand-text-secondary leading-relaxed">
              Engage users with rich, segmented alerts.
            </p>
          </div>

          {/* Card 2: Offline Mode */}
          <div className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-sm">
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100 mb-4">
              <WifiOff className="h-5.5 w-5.5" />
            </div>
            <h3 className="font-display text-lg font-extrabold text-brand-dark mb-2">
              Offline Mode
            </h3>
            <p className="text-sm font-medium text-brand-text-secondary leading-relaxed">
              Intelligent caching keeps your app functional without connectivity.
            </p>
          </div>

          {/* Card 3: Biometric Auth */}
          <div className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-sm">
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50 text-purple-600 border border-purple-100 mb-4">
              <Fingerprint className="h-5.5 w-5.5" />
            </div>
            <h3 className="font-display text-lg font-extrabold text-brand-dark mb-2">
              Biometric Auth
            </h3>
            <p className="text-sm font-medium text-brand-text-secondary leading-relaxed">
              Seamless login with FaceID and TouchID integration.
            </p>
          </div>

        </div>

      </div>
    </section>
  );
}
