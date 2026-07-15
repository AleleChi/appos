import { createAuthClient } from "better-auth/react";

const getBaseURL = () => {
  const envUrl = (import.meta as any).env.VITE_API_URL;
  if (envUrl) {
    return envUrl.trim();
  }
  const isDev = (import.meta as any).env.DEV || (import.meta as any).env.MODE === "development";
  return isDev ? "http://localhost:3000" : "https://appos-ten.vercel.app";
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


