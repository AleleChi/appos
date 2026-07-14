export const API_URL = (import.meta as any).env?.VITE_API_URL || "https://appos.onrender.com";

// NOTE: Legacy AUTH_ENDPOINTS have been removed. All authentication is now handled
// exclusively by the same-origin Better Auth client SDK in src/lib/auth-client.ts.
