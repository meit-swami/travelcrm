import type { NextConfig } from 'next';

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  transpilePackages: ['@travelos/types'],
  // Serve under a sub-path (e.g. /travelcrm) when NEXT_PUBLIC_BASE_PATH is set.
  ...(basePath ? { basePath, assetPrefix: basePath } : {}),
};

export default nextConfig;
