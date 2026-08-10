/**
 * SEO constants and helpers for the Soise brand.
 * Single source of truth for all search-engine-facing copy.
 */

import type { Metadata } from 'next';
import { siteConfig } from './site-config';
import { shareCard } from './images';

// Canonical host. Must match the host the site actually serves on (apex
// redirects to www), otherwise og:url / canonical point at a 308 and social
// scrapers resolve the wrong page.
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.soise.ng';
export const SITE_NAME = 'SOISE';
export const SITE_TAGLINE = 'Wear the Culture';
export const SITE_LOCALE = 'en_NG';

/** X/Twitter handle, derived from the real profile URL in site-config. */
export const X_HANDLE = `@${siteConfig.social.x.split('/').filter(Boolean).pop()}`;

/**
 * The social share card. Generated from the live homepage hero (see
 * `app/og/route.tsx`) so a WhatsApp/iMessage/X preview shows the same image a
 * visitor lands on. `/og-image.jpg` remains as a static, never-fails fallback.
 */
export const OG_IMAGE = {
  url: '/og',
  width: 1200,
  height: 630,
  type: 'image/png',
  alt: `${SITE_NAME} — creator-led streetwear from Nigeria`,
} as const;

/**
 * Turn arbitrary CMS body copy into a clean meta description.
 *
 * Raw product copy arrives with `\r\n` paragraph breaks and gets hard-sliced
 * mid-word ("…engineered from ligh"), which is what both the SERP snippet and
 * the WhatsApp preview then show. This collapses whitespace and cuts on a word
 * boundary just under Google's ~155-character display limit.
 */
export function snippet(text: string, max = 155): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[,;:.\-—]$/, '')}…`;
}

/**
 * A landscape share card for OpenGraph/Twitter.
 *
 * The transform itself now lives in lib/images.ts alongside the other delivery
 * helpers; it's re-exported here because every metadata builder below and
 * app/og/route.tsx reach for it through this module.
 */
export { shareCard };

/**
 * Build a COMPLETE Open Graph block.
 *
 * Next.js does NOT deep-merge `openGraph` between a layout and a page: a page
 * that sets `openGraph: { title }` REPLACES the layout's entire block, silently
 * dropping `images`, `type`, `siteName` and `locale`. That is what left the
 * homepage — the most-shared URL on the site — with no `og:image` at all, so
 * WhatsApp/Facebook/LinkedIn rendered a bare text link.
 *
 * Every page must go through this helper so the required tags can never be
 * dropped by an override again.
 */
export function buildOpenGraph(opts: {
  title: string;
  description: string;
  path: string;
  images?: { url: string; alt?: string }[];
  type?: 'website' | 'article';
}): Metadata['openGraph'] {
  return {
    type: opts.type ?? 'website',
    siteName: SITE_NAME,
    locale: SITE_LOCALE,
    url: `${SITE_URL}${opts.path}`,
    title: opts.title,
    description: opts.description,
    images: opts.images?.length
      ? opts.images.map((img) => {
          const url = shareCard(img.url);
          // Only declare dimensions we actually know. Cloudflare-transformed
          // URLs are exactly 1200×630; for anything else, asserting those
          // numbers would make scrapers lay the card out wrong.
          const isCard = url !== img.url;
          return {
            url,
            ...(isCard ? { width: 1200, height: 630 } : {}),
            alt: img.alt ?? opts.title,
          };
        })
      : [OG_IMAGE],
  };
}

/** Build a complete Twitter/X card block. Same replacement hazard as above. */
export function buildTwitter(opts: {
  title: string;
  description: string;
  images?: string[];
}): Metadata['twitter'] {
  return {
    card: 'summary_large_image',
    site: X_HANDLE,
    creator: X_HANDLE,
    title: opts.title,
    description: opts.description,
    images: opts.images?.length ? opts.images : [OG_IMAGE.url],
  };
}

/**
 * Convenience wrapper for a standard public page — guarantees canonical +
 * complete OG + complete Twitter from a single description.
 */
export function pageMetadata(opts: {
  title: string;
  description: string;
  path: string;
  ogTitle?: string;
  ogDescription?: string;
  images?: { url: string; alt?: string }[];
  type?: 'website' | 'article';
}): Metadata {
  const ogTitle = opts.ogTitle ?? opts.title;
  const ogDescription = opts.ogDescription ?? opts.description;
  return {
    title: opts.title,
    description: opts.description,
    alternates: { canonical: opts.path },
    openGraph: buildOpenGraph({
      title: ogTitle,
      description: ogDescription,
      path: opts.path,
      images: opts.images,
      type: opts.type,
    }),
    twitter: buildTwitter({
      title: ogTitle,
      description: ogDescription,
      images: opts.images?.map((i) => shareCard(i.url)),
    }),
  };
}

/**
 * Metadata for pages that must never appear in search: authenticated areas,
 * transactional flows and personalised pages. robots.txt only stops crawling —
 * a URL discovered via a link can still be indexed URL-only without this.
 */
export const NOINDEX: Metadata = {
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false },
  },
};

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
      image: `${SITE_URL}${OG_IMAGE.url}`,
      slogan: SITE_TAGLINE,
      description: DEFAULT_DESCRIPTION,
      // Must be the REAL profile URLs — Google uses sameAs to bind the site to
      // its social entities. Pointing at handles the brand doesn't own breaks
      // that link (and the knowledge panel). Sourced from site-config so the
      // footer links and the structured data can never drift apart.
      sameAs: [
        siteConfig.social.instagram,
        siteConfig.social.tiktok,
        siteConfig.social.x,
      ],
      // Legal entity — SOISE PVT. LTD, CAC RC 8413888.
      legalName: 'SOISE PVT. LTD',
      identifier: siteConfig.registrationNumber,
      contactPoint: {
        '@type': 'ContactPoint',
        email: siteConfig.supportEmail,
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
