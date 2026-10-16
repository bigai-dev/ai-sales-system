import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @react-pdf/renderer ships native fontkit/yoga workers that can confuse
  // Next.js's bundler under certain cold-start conditions. Marking it as a
  // server-external package keeps it out of the bundle and uses Node's
  // resolution at runtime.
  serverExternalPackages: ["@react-pdf/renderer"],

  // "Drills" was renamed to "Role play" — keep old links and bookmarks working.
  async redirects() {
    return [
      { source: "/training/drills", destination: "/training/role-play", permanent: true },
      {
        source: "/training/drills/:bucket",
        destination: "/training/role-play/:bucket",
        permanent: true,
      },
    ];
  },

  experimental: {
    // Turbopack's on-disk dev cache can go stale after restarts and serve
    // random 404s (known Next 16 issue). In-memory only is fine for dev.
    turbopackFileSystemCacheForDev: false,
  },
};

export default nextConfig;
