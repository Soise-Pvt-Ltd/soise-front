import axios from 'axios';
import ProductListingClient from './ProductListingClient';

export default async function ProductListingPage() {
  try {
    const res = await axios.get(
      `${process.env.NEXT_PUBLIC_BASE_URL}/products`,
      {
        // In Next.js App Router, to prevent caching with axios, you set headers.
        headers: {
          // 'Cache-Control': 'no-store',
          // Authorization: `Bearer ${process.env.API_KEY}`,
        },
      },
    );

    return <ProductListingClient products={res.data.data} />;
  } catch (error) {
    // It's good practice to handle potential errors from the API call.
    console.error('Failed to fetch products:', error);
    // You might want to throw the error to be caught by a Next.js error boundary
    // or return a specific error component.
    throw new Error('Failed to fetch products');
  }
}
