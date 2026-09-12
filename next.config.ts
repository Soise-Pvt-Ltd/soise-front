import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  async redirects() {
    return [
      // Product slugs are derived from the product name by the
      // set_product_slug DB event, so renaming a product silently moves its
      // URL. On 2026-09-12 the redundant "swaz" prefix came off both product
      // names; these keep every old link alive — Google's index, the merchant
      // feed's last crawl, TikTok/Instagram bios and anything already shared.
      // Permanent so search engines transfer the old URL's standing. Query
      // strings (utm_*, fbclid, ttclid) pass through, so attribution survives.
      // If a product is ever renamed again, add its old slug here too.
      {
        source: '/shop/product-listing/swaz-motion-tracksuit',
        destination: '/shop/product-listing/motion-tracksuit',
        permanent: true,
      },
      {
        source: '/shop/product-listing/swaz-motion-layered-jersey',
        destination: '/shop/product-listing/motion-layered-jersey',
        permanent: true,
      },
    ];
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
