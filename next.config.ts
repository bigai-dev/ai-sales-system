import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @react-pdf/renderer ships native fontkit/yoga workers that can confuse
  // Next.js's bundler under certain cold-start conditions. Marking it as a
  // server-external package keeps it out of the bundle and uses Node's
  // resolution at runtime.
  serverExternalPackages: ["@react-pdf/renderer"],

  // Pages have moved over time — keep old links and bookmarks working.
  async redirects() {
    return [
      // "Drills" became "Role play".
      { source: "/training/drills", destination: "/training/role-play", permanent: true },
      {
        source: "/training/drills/:bucket",
        destination: "/training/role-play/:bucket",
        permanent: true,
      },
      // Today is now the home page; the dashboard moved to /dashboard.
      { source: "/today", destination: "/", permanent: true },
      // The deals board is at /deals.
      { source: "/pipeline", destination: "/deals", permanent: true },
      // Readiness checks live under Clients.
      { source: "/health-check", destination: "/clients/readiness", permanent: true },
      {
        source: "/clients/:id/health-check",
        destination: "/clients/:id/readiness",
        permanent: true,
      },
      // Trends merged into the Training page.
      { source: "/training/trends", destination: "/training", permanent: true },
    ];
  },

  experimental: {
    // Turbopack's on-disk dev cache can go stale after restarts and serve
    // random 404s (known Next 16 issue). In-memory only is fine for dev.
    turbopackFileSystemCacheForDev: false,
  },
};

export default nextConfig;
