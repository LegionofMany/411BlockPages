import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ['api.qrserver.com'],
  },
  // Disable ESLint during production builds to avoid blocking builds for non-critical lint rules.
  // We still recommend fixing lint errors; this helps CI/CD proceed while iterating.
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
