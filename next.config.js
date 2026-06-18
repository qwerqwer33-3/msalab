/** @type {import('next').NextConfig} */
const path = require("path");

const defaultRepo = "MSQ";
const repo =
  process.env.NEXT_PUBLIC_SITE_REPO ||
  process.env.GITHUB_REPOSITORY?.split("/").pop() ||
  defaultRepo;
const configuredBasePath = process.env.NEXT_PUBLIC_BASE_PATH;
const rawBasePath = configuredBasePath ?? `/${repo}`;
const basePath = rawBasePath === "/" ? "" : rawBasePath.replace(/\/$/, "");

const nextConfig = {
  output: "export",
  outputFileTracingRoot: path.resolve(__dirname),
  trailingSlash: true,
  basePath,
  assetPrefix: basePath ? `${basePath}/` : undefined,
  images: { unoptimized: true },
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath
  }
};

module.exports = nextConfig;
