import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @react-pdf/renderer ships native fontkit/yoga workers that can confuse
  // Next.js's bundler under certain cold-start conditions. Marking it as a
  // server-external package keeps it out of the bundle and uses Node's
  // resolution at runtime.
  serverExternalPackages: ["@react-pdf/renderer"],
};

export default nextConfig;
