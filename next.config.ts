import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "img.youtube.com",
      },
      {
        protocol: "https",
        hostname: "i.ytimg.com",
      },
      {
        protocol: "https",
        hostname: "placehold.co",
      },
      {
        protocol: "https",
        hostname: "bxfythwshfmlmytfbhpk.supabase.co",
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/:locale/robots.txt',
        destination: '/robots.txt',
      },
      {
        source: '/robots.txt',
        destination: '/robots.txt',
      },
    ];
  },
};

export default nextConfig;
