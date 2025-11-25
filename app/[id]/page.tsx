import ProductPageClient from './ProductPageClient';

export default async function ProductPage({
  params: paramsPromise,
}: {
  params: Promise<{ id: string }>;
}) {
  const params = await paramsPromise;

  const res = await fetch(`https://dummyjson.com/products/${params.id}`, {
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    return <ProductPageClient product={null} recommendedProducts={[]} />;
  }
  const product = await res.json();

  const recommendedRes = await fetch(
    `https://dummyjson.com/products/category/${product.category}`,
    {
      next: { revalidate: 3600 },
    },
  );

  let recommendedProducts = null;
  if (recommendedRes.ok) {
    const recommendedData = await recommendedRes.json();
    recommendedProducts = recommendedData.products;
  }

  return (
    <ProductPageClient
      product={product}
      recommendedProducts={recommendedProducts}
    />
  );
}
