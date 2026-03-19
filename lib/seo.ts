/**
 * SEO constants and helpers for the Soise brand.
 * Single source of truth for all search-engine-facing copy.
 */

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://soise.ng';
export const SITE_NAME = 'SOISE';
export const SITE_TAGLINE = 'Wear the Culture';

export const DEFAULT_DESCRIPTION =
  'SOISE is Nigeria\'s leading streetwear brand. Shop authentic African-inspired urban fashion, hoodies, tees, joggers & more. Fast delivery across Lagos & Nigeria.';

export const KEYWORDS = [
  'SOISE',
  'streetwear Nigeria',
  'buy streetwear online Nigeria',
  'Nigerian streetwear brand',
  'Lagos streetwear',
  'African streetwear',
  'urban fashion Nigeria',
  'buy clothes online Nigeria',
  'online clothing store Nigeria',
  'Nigerian fashion brand',
  'Lagos fashion',
  'mens streetwear Nigeria',
  'womens streetwear Nigeria',
  'affordable streetwear Lagos',
  'street fashion Nigeria',
  'hoodies Nigeria',
  'tees Nigeria',
  'joggers Nigeria',
  'designer clothes Nigeria',
  'fashion brand Lagos',
  'soise.ng',
];

/** Build a Product JSON-LD blob for a single product page. */
export function productJsonLd(product: {
  name: string;
  description?: string;
  slug: string;
  base_price: number;
  sample_variants?: { media?: { url: string }[] }[];
}) {
  const image =
    product.sample_variants?.[0]?.media?.[0]?.url ?? `${SITE_URL}/hero.jpg`;

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description:
      product.description ??
      `Shop ${product.name} from SOISE — Nigeria's #1 streetwear brand. Fast delivery across Lagos & Nigeria.`,
    image,
    url: `${SITE_URL}/shop/product-listing/${product.slug}`,
    brand: {
      '@type': 'Brand',
      name: SITE_NAME,
    },
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

/** Organization + WebSite JSON-LD for the root layout. */
export const ORG_JSONLD = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${SITE_URL}/#organization`,
      name: SITE_NAME,
      url: SITE_URL,
      logo: `${SITE_URL}/logo.png`,
      sameAs: [
        'https://instagram.com/soise',
        'https://tiktok.com/@soise',
        'https://x.com/soise',
      ],
      contactPoint: {
        '@type': 'ContactPoint',
        email: 'support@soise.ng',
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
