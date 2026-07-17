import type { Metadata } from "next";
import React from "react";
import "./globals.css";
import Providers from "./providers";

export const metadata: Metadata = {
  title: "AppOS - Web-to-Mobile Operating System",
  description: "Compliance-first website-to-mobile-app operating platform.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
