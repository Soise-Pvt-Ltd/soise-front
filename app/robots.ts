import type { MetadataRoute } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://soise.ng';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        // /team is internal — except the publicly shareable playbook (longest-match wins).
        allow: ['/', '/team/playbook'],
        disallow: ['/dashboard/', '/team/', '/api/', '/creators/dashboard/'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
