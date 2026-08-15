import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  async headers() {
    return [
      {
        // Static files in /public.
        //
        // Next marks /_next/static immutable but leaves everything in /public on
        // `max-age=0, must-revalidate`, so every returning visitor revalidates
        // the statue, the logo and every favicon on EVERY navigation. Cloudflare
        // holds them at the edge, but the browser still spends a round trip
        // asking — which on a Lagos mobile connection is the whole cost.
        //
        // Fixed here rather than with a Cloudflare Cache Rule on purpose: this
        // travels with the repo, applies on every environment and preview, and
        // does not depend on rule ordering in a dashboard.
        //
        // One week, not one year: /public filenames are NOT content-hashed the
        // way /_next/static ones are, so replacing an asset under the same name
        // leaves returning visitors on the old bytes until this expires. A week
        // bounds that. If you do replace one, rename it or add ?v=2.
        source: '/:all*(png|jpg|jpeg|webp|avif|gif|svg|ico|woff|woff2)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=604800, stale-while-revalidate=86400',
          },
        ],
      },
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // HSTS: force HTTPS for two years incl. subdomains.
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          // Clickjacking protection.
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          // Lock down powerful browser APIs we don't use.
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
        ],
      },
    ];
  },
};

export default nextConfig;
