import axios from 'axios';
import ProductPageClient from './ProductPageClient';
import { notFound } from 'next/navigation';

export default async function ProductPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id: slug } = await props.params;

  try {
    // Use axios.get for a cleaner request. It automatically handles JSON parsing.
    const res = await axios.get(`${process.env.NEXT_PUBLIC_BASE_URL}/products`);

    // The response data is directly available on the .data property.
    const allProducts = res.data.data;

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
  } catch (error) {
    console.error('Failed to fetch product data:', error);
    throw new Error('Failed to fetch product data');
  }
}
