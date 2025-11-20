import ProductPageClient from "./ProductPageClient";

export default async function ProductPage({ params }: { params: { id: string } }) {
 
  const res = await fetch(`https://dummyjson.com/products/${params.id}`, {
    // Example of revalidating data every hour
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    return <ProductPageClient product={null} />;
  }
  const product = await res.json();

  return <ProductPageClient product={product} />;
}