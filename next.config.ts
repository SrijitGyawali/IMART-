import type { NextConfig } from "next";

const immutable = [
  { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
];

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  async headers() {
    return [
      { source: "/models/:path*", headers: immutable },
      { source: "/renders/:path*", headers: immutable },
    ];
  },
};

export default nextConfig;
