/** @type {import('next').NextConfig} */
const nextConfig = {
  // Force dynamic rendering for all pages to avoid database access during build
  experimental: {
    dynamicIO: true,
  },
}

export default nextConfig