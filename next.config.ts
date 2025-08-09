import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
      }
    ],
  },
  // This is to allow the Next.js dev server to be accessed from the Studio iframe.
  allowedDevOrigins: ['https://*.cluster-4xpux6pqdzhrktbhjf2cumyqtg.cloudworkstations.dev'],
};

export default nextConfig;
