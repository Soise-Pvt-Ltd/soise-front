export const runtime = 'nodejs';

import NavClient from './navClient';
import axios from 'axios';

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
    const productsRes = await axios.get<{ data: Product[] }>(
      `${process.env.NEXT_PUBLIC_BASE_URL}/products`,
    );

    const variantsMap = new Map<string, ProductVariant>();
    productsRes.data.data.forEach((product) => {
      product.sample_variants.forEach((variant) => {
        variantsMap.set(variant.id, variant);
      });
    });

    const res = await axios.get(
      `${process.env.NEXT_PUBLIC_BASE_URL_COMPONENTS}/api/checkstatus`,
    );

    const isLoggedIn = res.data.isLoggedIn;

    return <NavClient variantsMap={variantsMap} isLoggedIn={isLoggedIn} />;
  } catch (error) {
    console.error(error);
    return <h1>Something went wrong</h1>;
  }
}
