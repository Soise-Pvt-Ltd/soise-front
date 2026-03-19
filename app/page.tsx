import type { Metadata } from 'next';
import Footer from '@/components/footer';
import ExploreCollection from '@/components/home/explore-collection';
import BeforeExploreCollection from '@/components/home/before-explore-collection';
import MensTops from '@/components/home/mens-tops';
import AfterHero from '@/components/home/after-hero';
import Hero from '@/components/home/hero';
import ImageGallerySection from '@/components/home/image-gallery-section';
import { SITE_URL, SITE_NAME } from '@/lib/seo';

export const metadata: Metadata = {
  title: `${SITE_NAME} — Shop Streetwear Online in Nigeria | Lagos Fashion`,
  description:
    'Shop the latest streetwear collection from SOISE. Hoodies, tees, joggers & more. Premium African-inspired urban fashion with fast delivery across Lagos & Nigeria. Free shipping on select orders.',
  alternates: { canonical: '/' },
  openGraph: {
    title: `${SITE_NAME} — Shop Streetwear Online in Nigeria`,
    description:
      'Nigeria\'s #1 streetwear brand. Premium hoodies, tees, joggers & more with fast delivery across Lagos & all of Nigeria.',
    url: SITE_URL,
  },
};

interface Product {
  id: string | number;
  name: string;
  title: string;
  price: number;
  base_price: number;
  thumbnail: string;
  category: string;
  slug: string;
  sample_variants?: { media?: { url: string }[] }[];
}

export default async function Home() {
  let products: Product[] = [];
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

  try {
    if (!baseUrl) {
      throw new Error('Base URL is not configured');
    }

    const response = await fetch(`${baseUrl}/products`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch products: ${response.status}`);
    }

    const data = await response.json();
    products = data.data || [];
  } catch (error) {
    console.error('Error fetching products:', error);
  }

  // First 5 products
  const category1Products = products.slice(0, 5);

  // Second 5 products (from index 5 to 10)
  const category2Products = products.slice(5, 10);

  const images = [
    '/before-explore-collection-1.png',
    '/before-explore-collection-2.png',
    '/before-explore-collection-3.png',
  ];

  // ItemList JSON-LD — gives Google a structured product carousel
  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'SOISE Streetwear Collection',
    description: 'Shop the latest Nigerian streetwear from SOISE',
    numberOfItems: products.length,
    itemListElement: products.slice(0, 20).map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `${SITE_URL}/shop/product-listing/${p.slug}`,
      name: p.name,
      image: p.sample_variants?.[0]?.media?.[0]?.url,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />
      <Hero />
      {category1Products.length > 0 && (
        <AfterHero products={category1Products} />
      )}
      <MensTops />
      {category2Products.length > 0 && (
        <BeforeExploreCollection products={category2Products} />
      )}
      <ImageGallerySection images={images} />
      <ExploreCollection />
      <Footer />
    </>
  );
}
