export const runtime = 'nodejs';

import Nav from '@/components/home/nav/Nav';
import OrderSummaryClient from './OrderSummaryClient';
import { cookies } from 'next/headers';
import {
  Product,
  ProductVariant,
  CartItem,
  EnrichedCartItem,
} from '@/components/home/nav/types';

export default async function OrderHistoryPage() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;
  const isLoggedIn = cookieStore.has('access_token');
  const guestId = cookieStore.get('soise_guestId')?.value;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

  let productsData = { data: [] };
  let cartData = { data: [] };

  try {
    if (!baseUrl) {
      throw new Error('Base URL is not configured');
    }

    const cartUrl =
      isLoggedIn && accessToken
        ? `${baseUrl}/cart`
        : `${baseUrl}/cart${guestId ? `?session_id=${guestId}` : ''}`;

    const [productsRes, cartRes] = await Promise.all([
      fetch(`${baseUrl}/products`, {
        cache: 'no-store',
      }),
      fetch(cartUrl, {
        cache: 'no-store',
        headers: {
          ...(isLoggedIn && accessToken
            ? { Cookie: `access_token=${accessToken}` }
            : {}),
        },
      }),
    ]);

    if (productsRes.ok) productsData = await productsRes.json();
    if (cartRes.ok) cartData = await cartRes.json();
  } catch (error) {
    console.error('Order history page fetch failed:', error);
  }

  // Build variants map
  const variantsMap = new Map<string, ProductVariant>();
  productsData.data?.forEach((product: Product) => {
    product.sample_variants?.forEach((variant: ProductVariant) => {
      variantsMap.set(variant.id, {
        ...variant,
        product_name: product.name,
      });
    });
  });

  // Enrich cart
  const enrichedCart: EnrichedCartItem[] =
    cartData?.data?.map((item: CartItem) => ({
      ...item,
      variantDetails: variantsMap.get(item.variant),
    })) ?? [];

  return (
    <>
      <Nav />
      <OrderSummaryClient cart={enrichedCart} isLoggedIn={isLoggedIn} />
    </>
  );
}
