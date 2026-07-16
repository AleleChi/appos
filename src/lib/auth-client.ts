import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  // Direct client queries to our centralized Render API gateway
  baseURL: "https://appos.onrender.com"
});
