import type { NextConfig } from "next";

const isGhPages = process.env.GITHUB_PAGES === "true";

const nextConfig: NextConfig = {
  output: "export",
  basePath: isGhPages ? "/schedstack" : "",
  images: { unoptimized: true },
};

export default nextConfig;
