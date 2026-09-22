import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // The parent folder holds other experiments with their own lockfiles; keep Turbopack's root here.
  turbopack: { root: __dirname },
};

export default nextConfig;
