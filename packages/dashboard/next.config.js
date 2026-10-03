const path = require("node:path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: path.join(__dirname, "..", ".."),
  env: {
    NEXT_PUBLIC_REGISTRY_URL: process.env.REGISTRY_URL || "http://localhost:4000",
  },
};

module.exports = nextConfig;
