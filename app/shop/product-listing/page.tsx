export const runtime = 'nodejs';

import type { Metadata } from 'next';
import Nav from '@/components/home/nav/Nav';
import ProductListingClient from './ProductListingClient';

export const metadata: Metadata = {
  title: 'Shop All Streetwear — Hoodies, Tees, Joggers & More',
  description:
    'Browse the full SOISE streetwear collection. Hoodies, tees, joggers, shorts and more — premium Nigerian streetwear with fast delivery across Lagos & all of Nigeria.',
  alternates: { canonical: '/shop/product-listing' },
  openGraph: {
    title: 'Shop All — SOISE Streetwear Nigeria',
    description:
      'Browse the full SOISE collection. Premium hoodies, tees, joggers & more. Fast delivery across Nigeria.',
  },
};

export default async function ProductListingPage() {
  let products = [];
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

  try {
    if (baseUrl) {
      const res = await fetch(`${baseUrl}/products`, {
        cache: 'no-store',
      });
      if (res.ok) {
        const data = await res.json();
        products = (data.data || []).filter(
          (product: any) => product.status === 'active',
        );
      }
    }
  } catch (error) {
    console.error('Failed to fetch products:', error);
  }

  return (
    <>
      <Nav />
      <ProductListingClient products={products} />
    </>
  );
}
