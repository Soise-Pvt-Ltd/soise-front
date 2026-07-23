export const runtime = 'nodejs';

// Revalidate the catalog fetch at most once a minute so repeat visits are served
// from Next's Data Cache instead of hitting the backend every time (CWV/SEO win).
export const revalidate = 60;

import type { Metadata } from 'next';
import Nav from '@/components/home/nav/Nav';
import ProductListingClient from './ProductListingClient';
import { SITE_NAME, breadcrumbJsonLd } from '@/lib/seo';

export async function generateMetadata(props: {
  searchParams: Promise<{ collection?: string }>;
}): Promise<Metadata> {
  const { collection } = await props.searchParams;
  const collectionName = collection ? decodeURIComponent(collection) : null;

  const title = collectionName
    ? `Shop ${collectionName} — ${SITE_NAME} Collections`
    : `Shop All Collections — ${SITE_NAME}`;
  const description = collectionName
    ? `Browse the ${collectionName} collection from ${SITE_NAME}. Limited capsule drops and creator-led streetwear collabs, shipped across Nigeria.`
    : `Browse every SOISE collection. Limited capsule drops and creator-led collabs — premium streetwear shipped across Nigeria.`;
  const canonical = collectionName
    ? `/shop/product-listing?collection=${encodeURIComponent(collectionName)}`
    : '/shop/product-listing';
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? '';

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: `${siteUrl}${canonical}`,
      type: 'website',
    },
  };
}

export default async function ProductListingPage(props: {
  searchParams: Promise<{ collection?: string }>;
}) {
  const { collection } = await props.searchParams;
  let products = [];
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

  try {
    if (baseUrl) {
      const res = await fetch(`${baseUrl}/products`, {
        next: { revalidate: 60 },
      });
      if (res.ok) {
        const data = await res.json();
        products = (data.data || []).filter(
          (product: { status?: string }) => product.status === 'active',
        );
      }
    }
  } catch (error) {
    console.error('Failed to fetch products:', error);
  }

  const breadcrumbLd = breadcrumbJsonLd([
    { name: 'Home', path: '/' },
    ...(collection
      ? [
          { name: 'Shop', path: '/shop/product-listing' },
          {
            name: decodeURIComponent(collection),
            path: `/shop/product-listing?collection=${encodeURIComponent(collection)}`,
          },
        ]
      : [{ name: 'Shop', path: '/shop/product-listing' }]),
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <Nav />
      <ProductListingClient products={products} initialCollection={collection} />
    </>
  );
}
