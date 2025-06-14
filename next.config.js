const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // ✅ Enable static export
  trailingSlash: true,
  reactStrictMode: false,

  webpack: config => {
    config.resolve.alias = {
      ...config.resolve.alias,
      apexcharts: path.resolve(__dirname, './node_modules/apexcharts-clevision')
    };

    return config;
  }
};

module.exports = nextConfig;
