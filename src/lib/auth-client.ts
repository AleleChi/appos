import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: "https://appos.onrender.com",
  fetchOptions: {
    onSuccess: (ctx) => {
      const authToken = ctx.response.headers.get("set-auth-token");
      if (authToken) {
        // Automatically save active session token for Header validation
        localStorage.setItem("bearer_token", authToken);
      }
    },
    auth: {
      type: "Bearer",
      token: () => localStorage.getItem("bearer_token") || ""
    }
  }
});
