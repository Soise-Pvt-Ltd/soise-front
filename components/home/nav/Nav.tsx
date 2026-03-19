'use server';

import { cookies } from 'next/headers';
import NavClient from './NavClient';
import { Product, ProductVariant, CartItem, EnrichedCartItem } from './types';

export default async function Nav() {
  const cookieStore = await cookies();
  let productsData = { data: [] };
  let collectionData = { data: [] };
  let cartData = { data: [] };
  let userData: any = { data: null };

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  const isLoggedIn = cookieStore.has('access_token');
  const accessToken = cookieStore.get('access_token')?.value;
  const guestId = cookieStore.get('soise_guestId')?.value;

  try {
    if (baseUrl) {
      const [productsRes, collectionRes, cartRes] = await Promise.all([
        fetch(`${baseUrl}/products`, {
          cache: 'no-store',
        }),
        fetch(`${baseUrl}/products/collections`, {
          cache: 'no-store',
        }),
        fetch(
          `${baseUrl}/cart${!accessToken && guestId ? `?session_id=${guestId}` : ''}`,
          {
            cache: 'no-store',
            headers: {
              ...(accessToken
                ? { Cookie: `access_token=${accessToken}` }
                : {}),
              Accept: 'application/json',
            },
          },
        ),
      ]);

      if (isLoggedIn && accessToken) {
        const userRes = await fetch(`${baseUrl}/profiles`, {
          method: 'GET',
          headers: {
            Cookie: `access_token=${accessToken}`,
            Accept: 'application/json',
          },
          cache: 'no-store',
        });
        if (userRes.ok) userData = await userRes.json();
      }

      if (productsRes.ok) productsData = await productsRes.json();
      if (collectionRes.ok) collectionData = await collectionRes.json();
      if (cartRes.ok) cartData = await cartRes.json();
    }
  } catch (error) {
    console.error('Nav fetch failed:', error);
  }

  // console.log(cartData.data);

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
    <NavClient
      cart={enrichedCart}
      collections={collectionData.data ?? []}
      isLoggedIn={isLoggedIn}
      admin={userData?.data?.role === 'admin'}
    />
  );
}
