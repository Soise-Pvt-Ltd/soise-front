import type { MetadataRoute } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.soise.ng';

/**
 * Disallow and noindex do DIFFERENT jobs, and using the wrong one is how pages
 * get stuck in the index forever:
 *
 *   Disallow = "don't crawl this". Google can still index a disallowed URL it
 *              found via a link — showing it title-less in results — because it
 *              was never allowed to fetch the page and SEE the noindex tag.
 *   noindex  = "don't index this". Requires the page to stay CRAWLABLE.
 *
 * /auth/*, /swaz-loop, /shop/wishlist and friends were previously listed in
 * sitemap.xml, so they are likely already indexed. They now carry an explicit
 * noindex (see lib/seo.ts NOINDEX) and must stay crawlable so Google can read
 * that tag and drop them. Blocking them here instead would freeze them in the
 * index permanently.
 *
 * So the only entries below are areas that have never been public and have no
 * index presence to clean up.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        // Longest-match wins, so /team/playbook stays crawlable despite /team/.
        allow: ['/', '/team/playbook'],
        disallow: [
          '/api/',
          '/dashboard/',
          '/team/',
          '/creators/dashboard/',
          '/creators/onboarding/',
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
