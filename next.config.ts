import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    ppr: true,
    optimizePackageImports: [
      'react-tweet',
      'echarts-for-react',
      '@lobehub/icons',
    ],
  },
  images: {
    remotePatterns: [
      {
        hostname: 'avatar.vercel.sh',
      },
      {
        protocol: 'https',
        hostname: '*.googleusercontent.com',
        pathname: '**',
      },
      {
        hostname: 'avatars.githubusercontent.com',
      },
    ],
  },
  rewrites: async () => {
    return [
      {
        source:
          '/((?!api|_next/static|_next/image|favicon.ico|robots.txt|auth|login|register|demo).*)',
        destination: '/shell',
      },
    ];
  },
};

export default nextConfig;
