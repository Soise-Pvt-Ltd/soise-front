import ProductListingClient from './ProductListingClient';

export default async function ProductListingPage() {
  const res = await fetch('https://dummyjson.com/products', {
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    return <h1>Failed to load products.</h1>;
  }

  const data = await res.json();

  return <ProductListingClient products={data.products} />;
}
