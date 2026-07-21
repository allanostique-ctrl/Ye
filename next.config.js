/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  // pdfjs-dist ships its own worker file that it locates via a runtime require
  // relative to its own package folder; letting webpack bundle it breaks that
  // lookup, so it must load straight from node_modules instead.
  experimental: {
    serverComponentsExternalPackages: ['pdfjs-dist'],
  },
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    return config;
  },
};

module.exports = nextConfig;
