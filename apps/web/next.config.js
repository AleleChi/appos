/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["framer-motion"],
  async rewrites() {
    // Proxy /api requests to backend API server
    const apiHost = process.env.API_ORIGIN || "http://localhost:3001";
    return [
      {
        source: "/api/:path*",
        destination: `${apiHost}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
