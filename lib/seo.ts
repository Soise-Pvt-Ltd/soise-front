/**
 * SEO constants and helpers for the Soise brand.
 * Single source of truth for all search-engine-facing copy.
 */

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://soise.ng';
export const SITE_NAME = 'SOISE';
export const SITE_TAGLINE = 'Wear the Culture';

export const DEFAULT_DESCRIPTION =
  'Creator-led streetwear in considered, limited capsule drops — worn first by the creatives shaping the culture. Quiet luxury, deliberately scarce; a stage for Nigeria\'s stylists, artists and designers. Say less, look more.';

export const KEYWORDS = [
  'SOISE',
  'streetwear Nigeria',
  'buy streetwear online Nigeria',
  'Nigerian streetwear brand',
  'creator streetwear Nigeria',
  'African streetwear',
  'urban fashion Nigeria',
  'buy clothes online Nigeria',
  'online clothing store Nigeria',
  'Nigerian fashion brand',
  'African streetwear brand',
  'affordable streetwear Nigeria',
  'street fashion Nigeria',
  'SOISE collections',
  'streetwear collections Nigeria',
  'capsule collections Nigeria',
  'limited capsule drops Nigeria',
  'creator collaborations Nigeria',
  'collab streetwear Nigeria',
  'streetwear collabs Nigeria',
  'Nigerian creator collabs',
  'Nigerian creators',
  'capsule drops Nigeria',
  'creator brand Nigeria',
  'designer clothes Nigeria',
  'creator fashion brand Nigeria',
  'soise.ng',
];

/** Build a Product JSON-LD blob for a single product page. */
export function productJsonLd(product: {
  name: string;
  description?: string;
  slug: string;
  base_price: number;
  sample_variants?: { media?: { url: string }[] }[];
  primary_image?: string | null;
  collection?: { name?: string } | null;
}) {
  const image =
    product.primary_image ??
    product.sample_variants?.[0]?.media?.[0]?.url ??
    `${SITE_URL}/hero.jpg`;

  const collectionName = product.collection?.name;

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description:
      product.description ??
      `Shop ${product.name}${collectionName ? ` from the ${collectionName} collection` : ''} from SOISE — creator-led streetwear in limited capsule drops, worn by the culture. Considered, scarce, and shipped across Nigeria.`,
    image,
    url: `${SITE_URL}/shop/product-listing/${product.slug}`,
    brand: {
      '@type': 'Brand',
      name: SITE_NAME,
    },
    category: collectionName,
    offers: {
      '@type': 'Offer',
      priceCurrency: 'NGN',
      price: product.base_price,
      availability: 'https://schema.org/InStock',
      url: `${SITE_URL}/shop/product-listing/${product.slug}`,
      seller: {
        '@type': 'Organization',
        name: SITE_NAME,
      },
    },
  };
}

/**
 * Build a BreadcrumbList JSON-LD blob. Gives Google the page's position in the
 * site hierarchy, which renders as a breadcrumb trail in search results (higher
 * CTR) and reinforces topical structure. Pass items in order, root first.
 */
export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      // Google recommends omitting `item` on the last (current) crumb.
      ...(i < items.length - 1
        ? { item: `${SITE_URL}${item.path}` }
        : {}),
    })),
  };
}

/** Organization + WebSite JSON-LD for the root layout. */
export const ORG_JSONLD = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${SITE_URL}/#organization`,
      name: SITE_NAME,
      alternateName: 'Soise',
      url: SITE_URL,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/main-logo.png`,
        width: 1000,
        height: 1000,
        caption: 'SOISE — Say less, look more.',
      },
      image: `${SITE_URL}/og-image.jpg`,
      slogan: SITE_TAGLINE,
      sameAs: [
        'https://instagram.com/soise',
        'https://tiktok.com/@soise',
        'https://x.com/soise',
      ],
      contactPoint: {
        '@type': 'ContactPoint',
        email: 'hello@soise.ng',
        contactType: 'customer service',
        areaServed: 'NG',
        availableLanguage: 'English',
      },
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      url: SITE_URL,
      name: SITE_NAME,
      description: DEFAULT_DESCRIPTION,
      publisher: { '@id': `${SITE_URL}/#organization` },
      potentialAction: {
        '@type': 'SearchAction',
        target: `${SITE_URL}/shop/product-listing?q={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    },
  ],
};
