import NavClient from './navClient';

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
    const [cartRes, productsRes] = await Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/cart`),
      fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/products`),
    ]);

    if (!cartRes.ok) throw new Error('Failed to load cart');
    if (!productsRes.ok) throw new Error('Failed to load products');

    const cartData: { data: CartItem[] } = await cartRes.json();
    const productsData: { data: Product[] } = await productsRes.json();

    const variantsMap = new Map<string, ProductVariant>();
    productsData.data.forEach((product) => {
      product.sample_variants.forEach((variant) => {
        variantsMap.set(variant.id, variant);
      });
    });

    const enrichedCart: EnrichedCartItem[] = cartData.data.map((item) => ({
      ...item,
      variantDetails: variantsMap.get(item.variant),
    }));

    return <NavClient cart={enrichedCart} />;
  } catch (error) {
    console.error(error);
    // In a real app, you might want a more user-friendly error component here.
    return <h1>Something went wrong</h1>;
  }
}
