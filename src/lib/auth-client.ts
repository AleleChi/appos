import { createAuthClient } from "better-auth/react";

const getBaseURL = () => {
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    // Detect if we are in local development, a preview sandbox frame, or a Vercel preview
    const isLocalOrPreview =
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname.endsWith(".run.app") ||
      hostname.endsWith(".google.com") ||
      hostname.endsWith(".googleusercontent.com") ||
      hostname.includes("gitpod") ||
      hostname.includes("github") ||
      (hostname !== "appos.onrender.com" && hostname !== "appos-ten.vercel.app");

    if (isLocalOrPreview) {
      return window.location.origin;
    }
  }

  const envUrl = (import.meta as any).env.VITE_API_URL;
  if (envUrl) {
    return envUrl.trim();
  }
  
  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  const isDev = (import.meta as any).env.DEV || (import.meta as any).env.MODE === "development";
  return isDev ? "http://localhost:3000" : "https://appos.onrender.com";
};

export const baseURL = getBaseURL();

console.log("[AppOS Auth Client] Initialized with baseURL:", baseURL);

export const authClient = createAuthClient({
  baseURL,
  fetchOptions: {
    credentials: "include",
    onRequest(context: any) {
      console.log(`[AppOS Auth Client Request] API Base URL: ${baseURL}`);
      console.log(`[AppOS Auth Client Request] Request Destination: ${context.request}`);
    },
    onResponse(context: any) {
      console.log(`[AppOS Auth Client Response] Status: ${context.response.status}`);
    }
  }
});


