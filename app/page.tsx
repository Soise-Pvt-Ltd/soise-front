import type { Metadata } from 'next';
import Footer from '@/components/footer';
import ExploreCollection from '@/components/home/explore-collection';
import BeforeExploreCollection from '@/components/home/before-explore-collection';
import FeaturedCollection, {
  type FeaturedCollection as FeaturedCollectionData,
} from '@/components/home/featured-collection';
import AfterHero from '@/components/home/after-hero';
import Hero from '@/components/home/hero';
import ImageGallerySection from '@/components/home/image-gallery-section';
import { SITE_URL, SITE_NAME } from '@/lib/seo';

export const metadata: Metadata = {
  title: `${SITE_NAME} — Creator-Led Streetwear, Worn by the Culture`,
  description:
    'Fashion moves on what you see the culture wearing. SOISE is creator-led streetwear — hoodies, tees, beanies and denim in considered, limited capsule drops, worn first by Nigeria\'s creatives. Say less, look more.',
  alternates: { canonical: '/' },
  openGraph: {
    title: `${SITE_NAME} — Creator-Led Streetwear, Worn by the Culture`,
    description:
      'Creator-led streetwear, worn first by the creatives shaping the culture. Considered capsule drops, deliberately limited — a stage for Nigeria\'s stylists, artists and designers. Say less, look more.',
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
  primary_image?: string | null;
}

interface HomepageImages {
  hero?: string | null;
  mens_top?: string | null;
  explore_collection?: string | null;
  gallery_1?: string | null;
  gallery_2?: string | null;
  gallery_3?: string | null;
}

interface HomepageTexts {
  hero_headline?: string | null;
  hero_subheadline?: string | null;
  mens_tops_title?: string | null;
  mens_tops_cta?: string | null;
}

interface CollectionResponse {
  id: string;
  name: string;
  banner?: { url?: string | null } | string | null;
}

export default async function Home() {
  let products: Product[] = [];
  let collections: CollectionResponse[] = [];
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

  // Admin-managed homepage imagery and copy. On ANY failure we fall back to
  // bundled defaults so the homepage never breaks and looks like before.
  let homeImages: HomepageImages = {};
  let homeTexts: HomepageTexts = {};
  let featuredCollectionId: string | null = null;
  try {
    if (baseUrl) {
      const [contentRes, collectionsRes] = await Promise.all([
        fetch(`${baseUrl}/content/homepage`, { cache: 'no-store' }),
        fetch(`${baseUrl}/products/collections`, { cache: 'no-store' }),
      ]);
      if (contentRes.ok) {
        const json = await contentRes.json();
        homeImages = json?.data?.images || {};
        homeTexts = json?.data?.texts || {};
        featuredCollectionId = json?.data?.featured_collection_id || null;
      }
      if (collectionsRes.ok) {
        const json = await collectionsRes.json();
        collections = json?.data || [];
      }
    }
  } catch (error) {
    console.error('Error fetching homepage content:', error);
  }

  const featuredCollectionRaw = featuredCollectionId
    ? collections.find((c) => c.id === featuredCollectionId)
    : null;

  const featuredCollection: FeaturedCollectionData | null =
    featuredCollectionRaw
      ? {
          id: featuredCollectionRaw.id,
          name: featuredCollectionRaw.name,
          bannerUrl:
            typeof featuredCollectionRaw.banner === 'string'
              ? featuredCollectionRaw.banner
              : featuredCollectionRaw.banner?.url || null,
        }
      : null;

  // First 5 products
  const category1Products = products.slice(0, 5);

  // Second 5 products (from index 5 to 10)
  const category2Products = products.slice(5, 10);

  const images = [
    homeImages.gallery_1 || '/before-explore-collection-1.png',
    homeImages.gallery_2 || '/before-explore-collection-2.png',
    homeImages.gallery_3 || '/before-explore-collection-3.png',
  ];

  // ItemList JSON-LD — gives Google a structured product carousel
  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'SOISE Collections',
    description: 'Shop the latest capsule drops and collabs from SOISE',
    numberOfItems: products.length,
    itemListElement: products.slice(0, 20).map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `${SITE_URL}/shop/product-listing/${p.slug}`,
      name: p.name,
      image: p.primary_image || p.sample_variants?.[0]?.media?.[0]?.url,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />
      <Hero img={homeImages.hero} texts={homeTexts} />
      {category1Products.length > 0 && (
        <AfterHero products={category1Products} />
      )}
      <FeaturedCollection
        collection={featuredCollection}
        img={homeImages.mens_top}
        texts={homeTexts}
      />
      {category2Products.length > 0 && (
        <BeforeExploreCollection products={category2Products} />
      )}
      <ImageGallerySection images={images} />
      <ExploreCollection image={homeImages.explore_collection} />
      <Footer />
    </>
  );
}
