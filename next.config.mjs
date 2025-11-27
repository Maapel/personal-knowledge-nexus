/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    mdxRs: true,
  },
  images: {
    // Allow unoptimized images since we're serving them ourselves
    unoptimized: true,
  },
}

export default nextConfig
