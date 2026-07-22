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
    // Next's serverless output tracer only follows static imports, so it never
    // sees pdfjs-dist's runtime require() of pdf.worker.mjs (or its cmaps/fonts)
    // and strips them from the deployed function — breaking this on Vercel even
    // though it works with a full node_modules on disk locally. Force them in.
    outputFileTracingIncludes: {
      '/api/parse-hover': ['./node_modules/pdfjs-dist/**/*'],
    },
  },
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    return config;
  },
};

module.exports = nextConfig;
