import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export — the app is fully client-side (talks to the Worker backend
  // over REST/WS at runtime), so it deploys as static assets to Cloudflare Pages.
  output: "export",
};

export default nextConfig;
