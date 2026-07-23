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
  let storeCredit: number | null = null;

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  const isLoggedIn = cookieStore.has('access_token');
  const accessToken = cookieStore.get('access_token')?.value;
  const guestId = cookieStore.get('soise_guestId')?.value;

  try {
    if (baseUrl) {
      const [productsRes, collectionRes, cartRes] = await Promise.all([
        // Catalog data is public and identical for every visitor — cache it so
        // Nav (rendered on every page) stops re-fetching the full product list
        // and collections from origin on every request. Cart below stays
        // per-request since it's user/session-specific.
        fetch(`${baseUrl}/products`, {
          next: { revalidate: 60 },
        }),
        fetch(`${baseUrl}/products/collections`, {
          next: { revalidate: 60 },
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

        // Store-credit balance for the "Invite & Earn" badge in the account
        // menu. Best-effort — never block nav rendering on it.
        try {
          const creditRes = await fetch(`${baseUrl}/referrals/credit`, {
            method: 'GET',
            headers: {
              Cookie: `access_token=${accessToken}`,
              Accept: 'application/json',
            },
            cache: 'no-store',
          });
          if (creditRes.ok) {
            const creditJson = await creditRes.json();
            const bal = creditJson?.data?.store_credit_balance;
            if (typeof bal === 'number') storeCredit = bal;
          }
        } catch {
          // ignore — badge simply won't show
        }
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

  // Identity for the account panel ("who's logged in") + the luxury Profile
  // entry point. Best-effort: any missing field simply renders less.
  const u = userData?.data ?? null;

  return (
    <NavClient
      cart={enrichedCart}
      collections={collectionData.data ?? []}
      isLoggedIn={isLoggedIn}
      admin={u?.role === 'admin'}
      storeCredit={storeCredit}
      firstName={u?.first_name ?? null}
      lastName={u?.last_name ?? null}
      email={u?.email ?? null}
      avatar={u?.avatar ?? null}
    />
  );
}
