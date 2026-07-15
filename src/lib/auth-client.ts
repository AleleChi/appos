import { createAuthClient } from "better-auth/react";

export const baseURL = typeof window !== "undefined" 
  ? window.location.origin 
  : (((import.meta as any).env?.VITE_APP_API_URL || (process as any).env?.VITE_APP_API_URL || "https://appos.onrender.com") as string);

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


