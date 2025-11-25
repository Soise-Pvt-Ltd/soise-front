import ProductListingClient from './ProductListingClient';

// This is the default export, the Server Component.
// It runs on the server to fetch data.
export default async function ProductListingPage() {
  // Fetch data on the server. This code won't be sent to the client.
  const res = await fetch('https://dummyjson.com/products', {
    // Revalidate the data every hour to keep it fresh
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    // In a real app, you'd want a more robust error component here
    return <h1>Failed to load products.</h1>;
  }

  const data = await res.json();

  // Pass the fetched data as a prop to the Client Component.
  return <ProductListingClient products={data.products} />;
}
