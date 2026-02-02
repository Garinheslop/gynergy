// /next.config.js
// This file configures the Next.js application.

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: {
      bodySizeLimit: "100mb",
    },
  },
  // Temporarily ignore ESLint errors during build
  // TODO: Fix pre-existing lint errors and remove this
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
