import type { Metadata } from 'next';
import ProductPageClient from './ProductPageClient';
import { notFound } from 'next/navigation';
import Nav from '@/components/home/nav/Nav';
import { SITE_URL, SITE_NAME, productJsonLd } from '@/lib/seo';

async function getProducts() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  if (!baseUrl) return [];
  try {
    const res = await fetch(`${baseUrl}/products`, { cache: 'no-store' });
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
    return { title: 'Product Not Found' };
  }

  const image = product.sample_variants?.[0]?.media?.[0]?.url;
  const price = product.base_price;
  const title = `${product.name} — Buy Online in Nigeria`;
  const description =
    product.description?.slice(0, 155) ||
    `Shop ${product.name} from ${SITE_NAME}. Premium Nigerian streetwear with fast delivery across Lagos & Nigeria. Starting from NGN ${price?.toLocaleString()}.`;

  return {
    title,
    description,
    alternates: {
      canonical: `/shop/product-listing/${slug}`,
    },
    openGraph: {
      title: `${product.name} | ${SITE_NAME}`,
      description,
      url: `${SITE_URL}/shop/product-listing/${slug}`,
      type: 'website',
      images: image ? [{ url: image, alt: product.name }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${product.name} | ${SITE_NAME}`,
      description,
      images: image ? [image] : [],
    },
  };
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

  let recommendedProducts = [];

  if (product.collection) {
    recommendedProducts = allProducts
      .filter(
        (p: { collection: { name: string } | null; slug: string }) =>
          p.collection &&
          p.collection.name === product.collection.name &&
          p.slug !== product.slug,
      )
      .splice(0, 6);
  }

  const jsonLd = productJsonLd(product);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Nav />
      <ProductPageClient
        product={product}
        recommendedProducts={recommendedProducts}
      />
    </>
  );
}
