"use client";

import React from "react";

export default function Providers({ children }: { children: React.ReactNode }) {
  // We can add any general client contexts here (e.g. state management, modals, theme providers, etc.)
  return <>{children}</>;
}
