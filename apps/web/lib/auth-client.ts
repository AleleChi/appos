'use client';

import { createAuthClient } from "better-auth/react";
import { getApiUrl } from "./api-config";
import { safeStorage } from "./safe-storage";

export const authClient = createAuthClient({
  // Dynamically resolves target backend based on active environment (local / sandbox / production)
  baseURL: getApiUrl("/api/auth"),
  fetchOptions: {
    onSuccess: (ctx) => {
      const authToken = ctx.response.headers.get("set-auth-token");
      if (authToken) {
        safeStorage.setItem("bearer_token", authToken);
      }
    },
    auth: {
      type: "Bearer",
      token: () => safeStorage.getItem("bearer_token") || ""
    }
  }
});



