import type {NextConfig} from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  // output: 'export', // Commented out for Vercel deployment. Uncomment for Capacitor build.
  outputFileTracingRoot: path.join(__dirname),
  images: {
    unoptimized: true, // Keep true if you want to switch back to export easily, or remove to use Vercel Image Optimization
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https' as const,
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  /*
  eslint: {
    ignoreDuringBuilds: true,
  },
  serverActions: {
    allowedOrigins: [
        '9000-firebase-studio-1767125161249.cluster-dwvm25yncracsxpd26rcd5ja3m.cloudworkstations.dev',
    ]
  },
  */
};

export default nextConfig;