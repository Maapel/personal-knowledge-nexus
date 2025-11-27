/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    mdxRs: true,
  },
  images: {
    // Allow unoptimized images since we're serving them ourselves
    unoptimized: true,
  },
  // Serve images from trail directories
  async rewrites() {
    return [
      {
        source: '/content/trails/:path*',
        destination: '/api/static/:path*',
      },
    ]
  },
}

export default nextConfig
