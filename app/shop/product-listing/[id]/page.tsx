import type { Metadata } from 'next';
import ProductPageClient, { type Product } from './ProductPageClient';
import { notFound } from 'next/navigation';
import Nav from '@/components/home/nav/Nav';
import {
  SITE_NAME,
  productJsonLd,
  breadcrumbJsonLd,
  pageMetadata,
  NOINDEX,
  snippet,
} from '@/lib/seo';
import {
  getRecommendations,
  getSimilarProducts,
  type RecProduct,
} from './recs-actions';

// Prerender a static page per product at build time, and keep them fresh with
// 60s ISR. New products (not in the build-time list) render on-demand and cache.
// Static product pages are the fastest to serve and the best for crawlers.
export const revalidate = 60;

export async function generateStaticParams() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  if (!baseUrl) return [];
  try {
    const res = await fetch(`${baseUrl}/products`, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.data ?? [])
      .filter((p: { slug?: string }) => p.slug)
      .map((p: { slug: string }) => ({ id: String(p.slug) }));
  } catch {
    return [];
  }
}

async function getProducts() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  if (!baseUrl) return [];
  try {
    const res = await fetch(`${baseUrl}/products`, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    const data = await res.json();
    return data.data ?? [];
  } catch {
    return [];
  }
}

export async function generateMetadata(props: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id: slug } = await props.params;
  const products = await getProducts();
  const product = products.find(
    (p: { slug: string }) => String(p.slug) === String(slug),
  );

  if (!product) {
    // A 404 must never be indexable, and must never inherit the site's OG card
    // — otherwise a dead product link still previews as a valid page.
    return { title: 'Product Not Found', ...NOINDEX };
  }

  const image = product.primary_image || product.sample_variants?.[0]?.media?.[0]?.url;
  const price = product.base_price;
  const collectionName = product.collection?.name;
  const title = collectionName
    ? `${product.name} — ${collectionName} | ${SITE_NAME}`
    : `${product.name} | ${SITE_NAME}`;
  // `snippet` collapses the CMS copy's \r\n paragraph breaks and cuts on a word
  // boundary — a raw 155-char slice was ending snippets mid-word ("…from ligh").
  const description = product.description
    ? snippet(product.description)
    : `Shop ${product.name}${collectionName ? ` from the ${collectionName} collection` : ''} at ${SITE_NAME}. Limited capsule drops and creator-led streetwear, shipped across Nigeria. Starting from NGN ${price?.toLocaleString()}.`;

  // `images: []` is NOT the same as omitting it — an empty array emits no
  // og:image and blocks the fallback, so a product without a photo used to
  // share as a bare link. Passing undefined lets the brand card take over.
  return pageMetadata({
    title,
    description,
    path: `/shop/product-listing/${slug}`,
    images: image ? [{ url: image, alt: product.name }] : undefined,
  });
}

export default async function ProductPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id: slug } = await props.params;
  const allProducts = await getProducts();

  const product = allProducts.find(
    (p: { slug: string }) => String(p.slug) === String(slug),
  );

  if (!product) {
    notFound();
  }

  // Fetch both recommendation rows server-side, in parallel. Each helper never
  // throws and returns [] on error, so a failing row just hides itself.
  const [boughtTogether, similar] = await Promise.all([
    getRecommendations(product.id, 8),
    getSimilarProducts(product.id, 8),
  ]);

  // Backend already excludes the seed product, but dedupe defensively by id/slug.
  const dedupe = (list: RecProduct[]) =>
    list.filter(
      (p) => p && p.id !== product.id && p.slug !== product.slug,
    );

  const frequentlyBoughtTogether = dedupe(boughtTogether);
  const similarProducts = dedupe(similar);

  const jsonLd = productJsonLd(product);
  const collectionName = product.collection?.name;
  const breadcrumbLd = breadcrumbJsonLd([
    { name: 'Home', path: '/' },
    { name: 'Shop', path: '/shop/product-listing' },
    ...(collectionName
      ? [
          {
            name: collectionName,
            path: `/shop/product-listing?collection=${encodeURIComponent(collectionName)}`,
          },
        ]
      : []),
    { name: product.name, path: `/shop/product-listing/${slug}` },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <Nav />
      <ProductPageClient
        product={product}
        frequentlyBoughtTogether={frequentlyBoughtTogether as unknown as Product[]}
        similarProducts={similarProducts as unknown as Product[]}
      />
    </>
  );
}
