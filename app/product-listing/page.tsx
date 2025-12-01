import ProductListingClient from './ProductListingClient';

export default async function ProductListingPage() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/products`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      // Authorization: `Bearer ${process.env.API_KEY}`,
    },
  });

  if (!res.ok) throw new Error('Failed to fetch products');

  const product = await res.json();

  return <ProductListingClient products={product.data} />;
}
