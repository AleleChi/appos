export const getApiUrl = (path: string): string => {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  
  // Detect if we are running in local development or AI Studio preview
  const isLocal = typeof window !== "undefined" && (
    window.location.hostname === "localhost" || 
    window.location.hostname.includes("aistudio") ||
    window.location.hostname.includes("run.app")
  );

  // In preview/dev, use the current window origin instead of empty string so we have a valid absolute URL for both fetch and better-auth.
  // In production, force the call directly to our Render backend.
  const base = isLocal && typeof window !== "undefined" ? window.location.origin : "https://appos.onrender.com";
  return `${base}${cleanPath}`;
};
