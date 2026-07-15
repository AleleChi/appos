import { createAuthClient } from "better-auth/react";

const getBaseURL = () => {
  const envUrl = (import.meta as any).env.VITE_API_URL;
  if (envUrl) {
    return envUrl.trim();
  }
  
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    if (hostname === "appos-ten.vercel.app") {
      return "https://appos.onrender.com";
    }
    if (hostname === "appos.onrender.com") {
      return "https://appos.onrender.com";
    }
    if (hostname.endsWith(".run.app") || hostname === "localhost" || hostname === "127.0.0.1") {
      return window.location.origin;
    }
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


