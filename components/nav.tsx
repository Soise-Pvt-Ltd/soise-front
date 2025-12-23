import NavClient from './navClient';
import axios from 'axios';
import { cookies } from 'next/headers';

// Define types for the data we're fetching to make the code safer and easier to understand.
interface CartItem {
  id: string;
  quantity: number;
  variant: string; // This is the variant ID
}

interface ProductVariant {
  id: string;
  price: number;
  color: string;
  size: string;
  media: { url: string; alt_text: string }[];
  product: string;
  [key: string]: any;
}

interface Product {
  id: string;
  sample_variants: ProductVariant[];
  // Add other product properties
  [key: string]: any;
}

interface EnrichedCartItem extends CartItem {
  variantDetails?: ProductVariant;
}

export default async function Nav() {
  try {
    // Fetch only products on the server. Cart will be fetched on the client.
    const productsRes = await axios.get<{ data: Product[] }>(
      `${process.env.NEXT_PUBLIC_BASE_URL}/products`,
    );

    const variantsMap = new Map<string, ProductVariant>();
    productsRes.data.data.forEach((product) => {
      product.sample_variants.forEach((variant) => {
        variantsMap.set(variant.id, variant);
      });
    });

    // Check for the access token cookie on the server side
    const cookieStore = await cookies();
    const isLoggedIn = cookieStore.has('accessToken');

    // Pass the variantsMap to the client component.
    // The cart will be fetched and managed within NavClient.
    return <NavClient variantsMap={variantsMap} isLoggedIn={isLoggedIn} />;
  } catch (error) {
    console.error(error);
    // In a real app, you might want a more user-friendly error component here.
    return <h1>Something went wrong</h1>;
  }
}
