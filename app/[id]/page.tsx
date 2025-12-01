import ProductPageClient from './ProductPageClient';
import { notFound } from 'next/navigation';

export default async function ProductPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id: slug } = await props.params; // ✅ FIX: await params

  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/products`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error('Failed to fetch products');
  }

  const productData = await res.json();
  const allProducts = productData.data;

  const product = allProducts.find(
    (p: { slug: string }) => String(p.slug) === String(slug),
  );

  if (!product) {
    notFound();
  }

  let recommendedProducts = [];

  if (product.collection) {
    recommendedProducts = allProducts.filter(
      (p: { collection: { name: string } | null; slug: string }) =>
        p.collection &&
        p.collection.name === product.collection.name &&
        p.slug !== product.slug,
    );
  }

  return (
    <ProductPageClient
      product={product}
      recommendedProducts={recommendedProducts}
    />
  );
}
