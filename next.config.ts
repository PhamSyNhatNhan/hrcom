import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    eslint: {
        ignoreDuringBuilds: true,
    },
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'kflnfvctczbqzkudgssz.supabase.co',
                pathname: '/storage/v1/object/public/images/**',
            },
        ],
    },
};

export default nextConfig;
