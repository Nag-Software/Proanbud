//import type { NextConfig } from "next";
// Removed TypeScript-only import since this is a .mjs file
import { createMDX } from 'fumadocs-mdx/next';

const nextConfig = {
  /* config options here */
  turbopack: {
    root: new URL('.', import.meta.url).pathname,
  },
  // Allow app.localhost for local subdomain development
  // Add this to /etc/hosts: 127.0.0.1 app.localhost
  async headers() {
    return [];
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.sanity.io',
        pathname: '**',
      },
    ],
  },
};

const withMDX = createMDX({
});

export default withMDX(nextConfig);