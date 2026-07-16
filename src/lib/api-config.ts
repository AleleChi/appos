export const getApiUrl = (path: string): string => {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  
  // Detect if we are running in local development or AI Studio preview
  const isLocal = typeof window !== "undefined" && (
    window.location.hostname === "localhost" || 
    window.location.hostname.includes("aistudio") ||
    window.location.hostname.includes("run.app")
  );

  // In preview/dev, use relative paths to let Vite's proxy route requests safely same-origin.
  // In production, force the call directly to our Render backend.
  const base = isLocal ? "" : "https://appos.onrender.com";
  return `${base}${cleanPath}`;
};
