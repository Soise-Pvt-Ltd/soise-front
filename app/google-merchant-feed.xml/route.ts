import { NextResponse } from 'next/server';
import { SITE_NAME, SITE_URL, DEFAULT_DESCRIPTION } from '@/lib/seo';

/**
 * Google Merchant Center product feed (RSS 2.0 + g: namespace).
 *
 * One <item> per product VARIANT, grouped by g:item_group_id, because apparel
 * listings need color/size at the item level — a single per-product item can't
 * carry "Crimson Red / M" and Google rejects or flattens it.
 *
 * Registered in Merchant Center as a scheduled fetch of
 *   https://www.soise.ng/google-merchant-feed.xml
 * which powers free listings (and Shopping ads if ever enabled). Served
 * dynamically: Google fetches a feed at most a few times a day, so freshness
 * (stock flips, price changes) is worth more than caching this render.
 */

export const dynamic = 'force-dynamic';

const API = process.env.NEXT_PUBLIC_BASE_URL || 'https://api.soise.ng';

/** Feed-level constants. Own-brand apparel: no GTIN/MPN exists, so
 * identifier_exists=no keeps items eligible instead of "missing GTIN" limbo. */
const BRAND = SITE_NAME;
// Apparel & Accessories > Clothing — Google taxonomy id. Intentionally generic:
// a wrong specific category hurts more than a broad correct one.
const GOOGLE_PRODUCT_CATEGORY = '1604';

interface MediaEntry {
  url?: string;
  variants?: { large?: string; medium?: string };
}

interface Variant {
  id?: string;
  color?: string;
  size?: string;
  price?: number;
  stock?: number;
  media?: MediaEntry[];
  display_media?: MediaEntry[];
}

interface Product {
  id?: string;
  slug?: string;
  name?: string;
  description?: string;
  status?: string;
  base_price?: number;
}

function esc(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** Plain record key whether the API returns "table:key" or bare "key". */
function recordKey(id: unknown): string {
  const s = String(id ?? '');
  return s.includes(':') ? s.split(':').pop()! : s;
}

function imageUrls(variant: Variant): string[] {
  const media = variant.media?.length ? variant.media : variant.display_media;
  return (media ?? [])
    .map((m) => m.variants?.large || m.url || '')
    .filter(Boolean);
}

function itemXml(product: Product, variant: Variant): string {
  const productUrl = `${SITE_URL}/shop/product-listing/${product.slug}`;
  const images = imageUrls(variant);
  if (!images.length) return ''; // Google rejects imageless items — skip, don't 4x the error count.

  const size = String(variant.size ?? '').toUpperCase();
  const color = variant.color ?? '';
  const title = [product.name, color && size ? `${color} / ${size}` : color || size]
    .filter(Boolean)
    .join(' — ');
  const price = Number(variant.price ?? product.base_price ?? 0);
  const description = (product.description || DEFAULT_DESCRIPTION)
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 4900);

  const additionalImages = images
    .slice(1, 4)
    .map((u) => `      <g:additional_image_link>${esc(u)}</g:additional_image_link>`)
    .join('\n');

  return `    <item>
      <g:id>${esc(recordKey(variant.id))}</g:id>
      <g:item_group_id>${esc(recordKey(product.id))}</g:item_group_id>
      <g:title>${esc(title)}</g:title>
      <g:description>${esc(description)}</g:description>
      <g:link>${esc(productUrl)}</g:link>
      <g:image_link>${esc(images[0])}</g:image_link>
${additionalImages ? additionalImages + '\n' : ''}      <g:availability>${(variant.stock ?? 0) > 0 ? 'in_stock' : 'out_of_stock'}</g:availability>
      <g:price>${price.toFixed(2)} NGN</g:price>
      <g:brand>${esc(BRAND)}</g:brand>
      <g:condition>new</g:condition>
      <g:identifier_exists>no</g:identifier_exists>
      <g:google_product_category>${GOOGLE_PRODUCT_CATEGORY}</g:google_product_category>
      <g:color>${esc(color)}</g:color>
      <g:size>${esc(size)}</g:size>
      <g:age_group>adult</g:age_group>
      <g:gender>unisex</g:gender>
      <g:shipping>
        <g:country>NG</g:country>
        <g:service>Standard</g:service>
        <g:price>0.00 NGN</g:price>
      </g:shipping>
    </item>`;
}

export async function GET() {
  let products: Product[];
  try {
    const res = await fetch(`${API}/products/`, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });
    if (!res.ok) throw new Error(`products fetch ${res.status}`);
    const body = await res.json();
    products = Array.isArray(body?.data) ? body.data : [];
  } catch {
    // 503 (not an empty 200) so Merchant Center keeps yesterday's items and
    // retries, instead of ingesting an empty feed and delisting the catalog.
    return new NextResponse('feed temporarily unavailable', { status: 503 });
  }

  const active = products.filter((p) => p.status === 'active' && p.slug);

  const items: string[] = [];
  for (const product of active) {
    try {
      const res = await fetch(
        `${API}/products/${recordKey(product.id)}/variants`,
        { headers: { Accept: 'application/json' }, cache: 'no-store' },
      );
      if (!res.ok) continue;
      const body = await res.json();
      const variants: Variant[] = Array.isArray(body?.data) ? body.data : [];
      for (const variant of variants) {
        const xml = itemXml(product, variant);
        if (xml) items.push(xml);
      }
    } catch {
      // One product failing shouldn't blank the whole catalog.
    }
  }

  if (!items.length) {
    return new NextResponse('feed temporarily unavailable', { status: 503 });
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>${esc(SITE_NAME)}</title>
    <link>${esc(SITE_URL)}</link>
    <description>${esc(DEFAULT_DESCRIPTION)}</description>
${items.join('\n')}
  </channel>
</rss>
`;

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      // CDN-cache an hour so Google's fetches don't hammer the API.
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=600',
    },
  });
}
