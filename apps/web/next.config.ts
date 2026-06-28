import type { NextConfig } from 'next';

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  transpilePackages: ['@travelos/types'],
  ...(basePath ? { basePath, assetPrefix: basePath, skipTrailingSlashRedirect: true } : {}),
};

export default nextConfig;
