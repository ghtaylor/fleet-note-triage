import type { NextConfig } from "next";

const backendUrl = process.env.BACKEND_URL;

if (!backendUrl) {
  throw new Error("BACKEND_URL is required");
}

try {
  new URL(backendUrl);
} catch {
  throw new Error("BACKEND_URL must be a valid URL");
}

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
