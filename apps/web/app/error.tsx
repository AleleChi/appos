"use client";

import React from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#F7F9FC] font-sans text-center px-4">
      <h1 className="text-4xl font-extrabold text-slate-900 mb-2">500</h1>
      <p className="text-slate-500 mb-6">Something went wrong on our end</p>
      <button
        onClick={() => reset()}
        className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-600/10 hover:bg-indigo-700 transition-colors mr-2 cursor-pointer"
      >
        Try Again
      </button>
      <a href="/" className="px-5 py-2.5 bg-slate-600 text-white rounded-xl font-bold text-sm shadow-lg hover:bg-slate-700 transition-colors inline-block">
        Go Home
      </a>
    </div>
  );
}
