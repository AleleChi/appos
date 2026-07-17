/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["framer-motion"],
  async rewrites() {
    const isProduction = process.env.NODE_ENV === "production";
    const isRealProduction = isProduction && (process.env.VERCEL === "1" || process.env.RENDER === "true" || process.env.STRICT_ENV_CHECK === "true");
    let apiOrigin = process.env.API_ORIGIN;

    if (isRealProduction) {
      if (!apiOrigin) {
        throw new Error(
          "PRODUCTION CONFIGURATION ERROR: The 'API_ORIGIN' environment variable is missing. It must be explicitly defined in production."
        );
      }

      apiOrigin = apiOrigin.trim().replace(/\/+$/, "");

      let parsedUrl;
      try {
        parsedUrl = new URL(apiOrigin);
      } catch (err) {
        throw new Error(
          `PRODUCTION CONFIGURATION ERROR: 'API_ORIGIN' ("${apiOrigin}") is malformed. It must be a valid absolute HTTP or HTTPS URL.`
        );
      }

      const hostname = parsedUrl.hostname.toLowerCase();

      if (hostname === "localhost") {
        throw new Error(
          "PRODUCTION CONFIGURATION ERROR: 'API_ORIGIN' cannot point to 'localhost' in production."
        );
      }

      if (hostname === "127.0.0.1" || hostname === "::1" || hostname.includes("loopback")) {
        throw new Error(
          `PRODUCTION CONFIGURATION ERROR: 'API_ORIGIN' cannot point to a loopback address ("${hostname}") in production.`
        );
      }

      const isPrivateIp = (ip) => {
        if (ip.startsWith("10.")) return true;
        if (ip.startsWith("192.168.")) return true;
        if (ip.startsWith("172.")) {
          const parts = ip.split(".");
          if (parts.length >= 2) {
            const secondOctet = parseInt(parts[1], 10);
            if (secondOctet >= 16 && secondOctet <= 31) return true;
          }
        }
        return false;
      };

      if (isPrivateIp(hostname)) {
        throw new Error(
          `PRODUCTION CONFIGURATION ERROR: 'API_ORIGIN' cannot point to a private IP address ("${hostname}") in production.`
        );
      }
    } else {
      apiOrigin = (apiOrigin || "http://localhost:3001").trim().replace(/\/+$/, "");
    }

    return [
      {
        source: "/api/:path*",
        destination: `${apiOrigin}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
