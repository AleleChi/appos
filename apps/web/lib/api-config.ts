export const getApiUrl = (path: string): string => {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  
  // Force same-origin browser calls so Next.js securely rewrites/proxies them
  if (typeof window !== "undefined") {
    return `${window.location.origin}${cleanPath}`;
  }
  
  // Server-side/prerender fallback for Better Auth (it requires a valid absolute URL)
  const serverUrl = process.env.BETTER_AUTH_URL || process.env.VITE_API_URL || "http://localhost:3000";
  // Strip trailing slash if any to prevent double slashes
  const base = serverUrl.endsWith("/") ? serverUrl.slice(0, -1) : serverUrl;
  return `${base}${cleanPath}`;
};
