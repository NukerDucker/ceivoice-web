import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Output standalone for Docker (not needed for Vercel — Vercel handles this)
  // output: 'standalone',

  // Only allow images from known sources
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com', // Google profile photos
      },
    ],
  },

  // Strict mode for catching issues early
  reactStrictMode: true,

  // Allow the backend API origin in production
  async headers() {
    return [
      {
        source: '/api/(.*)',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
        ],
      },
    ];
  },
};

export default nextConfig;
