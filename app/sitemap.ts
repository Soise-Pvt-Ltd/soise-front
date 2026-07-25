import type { MetadataRoute } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.soise.ng';

/**
 * A sitemap is a statement that every URL in it is canonical, indexable and
 * returns 200. The previous version listed five URLs that were none of those:
 *
 *   /shop/wishlist   → 307 to /auth/login (middleware-gated)
 *   /creators        → 307 to /auth/login (middleware-gated)
 *   /auth/login      → thin, now noindex
 *   /auth/register   → thin, now noindex
 *   /swaz-loop       → personalised signed-in dashboard, now noindex
 *
 * Google reports those as "Page with redirect" / "Excluded by noindex" errors
 * and discounts the sitemap's trustworthiness overall. Only genuinely public,
 * 200-returning pages belong here.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${SITE_URL}/shop/product-listing`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/about`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      // Public, logged-out explainer (whitelisted in middleware PUBLIC_PATHS).
      // The signed-in /swaz-loop dashboard is deliberately NOT listed.
      url: `${SITE_URL}/creators/swaz-loop`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/contact`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/team/playbook`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.4,
    },
  ];

  // Dynamic collection and product routes
  let productRoutes: MetadataRoute.Sitemap = [];
  let collectionRoutes: MetadataRoute.Sitemap = [];
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    if (baseUrl) {
      const [productsRes, collectionsRes] = await Promise.all([
        fetch(`${baseUrl}/products`, {
          next: { revalidate: 3600 },
        }),
        fetch(`${baseUrl}/products/collections`, {
          next: { revalidate: 3600 },
        }),
      ]);

      if (productsRes.ok) {
        const data = await productsRes.json();
        const products: {
          slug: string;
          updated_at?: string;
          status?: string;
        }[] = data.data ?? [];
        productRoutes = products
          // Only active products render a real page — listing drafts/archived
          // items produces soft-404s in Search Console.
          .filter((p) => p.slug && (!p.status || p.status === 'active'))
          .map((p) => ({
            url: `${SITE_URL}/shop/product-listing/${p.slug}`,
            lastModified: p.updated_at ? new Date(p.updated_at) : now,
            changeFrequency: 'daily' as const,
            priority: 0.8,
          }));
      }

      if (collectionsRes.ok) {
        const data = await collectionsRes.json();
        const collections: { name: string }[] = data.data ?? [];
        // Each collection view self-canonicalises to its own ?collection= URL
        // (see generateMetadata in the listing page), so these are legitimate
        // indexable pages rather than duplicates of the bare listing.
        collectionRoutes = collections
          .filter((c) => c.name)
          .map((c) => ({
            url: `${SITE_URL}/shop/product-listing?collection=${encodeURIComponent(c.name)}`,
            lastModified: now,
            changeFrequency: 'daily' as const,
            priority: 0.7,
          }));
      }
    }
  } catch {
    // Fail silently — static routes still get indexed
  }

  return [...staticRoutes, ...collectionRoutes, ...productRoutes];
}
