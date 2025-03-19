/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  
  // Configure static page generation
  output: 'standalone',
  
  // Disable static page generation for protected routes
  // This prevents build errors for pages that require authentication
  
  // Note: Server Actions are now available by default in Next.js
  experimental: {
    // Only generate pages during build time that don't require authentication
    // Other pages will be generated on-demand at runtime
  },
  
  async headers() {
    return [
      {
        // Apply these headers to all routes
        source: '/:path*',
        headers: [
          // Security headers
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          }
        ]
      }
    ];
  }
};

module.exports = nextConfig;