import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Supabase Storage public buckets
      {
        protocol: 'https',
        hostname: 'dfppzlixnmznlqlmthxy.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      // Marketplace seed imagery
      { protocol: 'https', hostname: 'images.unsplash.com' },
      // YouTube thumbnails (legacy clip URLs)
      { protocol: 'https', hostname: 'img.youtube.com' },
      { protocol: 'https', hostname: 'i.ytimg.com' },
    ],
  },
};

export default nextConfig;
