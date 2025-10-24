//import type { NextConfig } from "next";
// Removed TypeScript-only import since this is a .mjs file
import { createMDX } from 'fumadocs-mdx/next';

const nextConfig = {
  /* config options here */
  output: "standalone",
  turbopack: {
    root: new URL('.', import.meta.url).pathname,
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
  // customise the config file path
  // configPath: "source.config.ts"
});

export default withMDX(nextConfig);
