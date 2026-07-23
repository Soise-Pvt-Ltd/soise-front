'use server';

import { cookies } from 'next/headers';
import {
  Product,
  ProductVariant,
  CartItem,
  EnrichedCartItem,
} from './types';

export interface NavSession {
  isLoggedIn: boolean;
  admin: boolean;
  storeCredit: number | null;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  avatar: string | null;
  cart: EnrichedCartItem[];
}

/**
 * Session-specific nav data (cart, auth, identity), fetched client-side on
 * mount so the Nav server shell can stay static and every page it renders can
 * be a CDN cache hit. Reads cookies for the access token / guest session.
 * Catalog data used for cart enrichment is cached (public), the cart itself is
 * always fresh. Never throws — returns a logged-out/empty session on failure.
 */
export async function getNavSession(): Promise<NavSession> {
  const empty: NavSession = {
    isLoggedIn: false,
    admin: false,
    storeCredit: null,
    firstName: null,
    lastName: null,
    email: null,
    avatar: null,
    cart: [],
  };

  const cookieStore = await cookies();
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  if (!baseUrl) return empty;

  const isLoggedIn = cookieStore.has('access_token');
  const accessToken = cookieStore.get('access_token')?.value;
  const guestId = cookieStore.get('soise_guestId')?.value;

  try {
    const [productsRes, cartRes] = await Promise.all([
      // Public catalog — cached; only needed to enrich cart lines with variant details.
      fetch(`${baseUrl}/products`, { next: { revalidate: 60 } }),
      fetch(
        `${baseUrl}/cart${!accessToken && guestId ? `?session_id=${guestId}` : ''}`,
        {
          cache: 'no-store',
          headers: {
            ...(accessToken ? { Cookie: `access_token=${accessToken}` } : {}),
            Accept: 'application/json',
          },
        },
      ),
    ]);

    let productsData: { data: Product[] } = { data: [] };
    let cartData: { data: CartItem[] } = { data: [] };
    if (productsRes.ok) productsData = await productsRes.json();
    if (cartRes.ok) cartData = await cartRes.json();

    const variantsMap = new Map<string, ProductVariant>();
    productsData.data?.forEach((product: Product) => {
      product.sample_variants?.forEach((variant: ProductVariant) => {
        variantsMap.set(variant.id, { ...variant, product_name: product.name });
      });
    });

    const cart: EnrichedCartItem[] =
      cartData?.data?.map((item: CartItem) => ({
        ...item,
        variantDetails: variantsMap.get(item.variant),
      })) ?? [];

    let admin = false;
    let storeCredit: number | null = null;
    let firstName: string | null = null;
    let lastName: string | null = null;
    let email: string | null = null;
    let avatar: string | null = null;

    if (isLoggedIn && accessToken) {
      const userRes = await fetch(`${baseUrl}/profiles`, {
        method: 'GET',
        headers: { Cookie: `access_token=${accessToken}`, Accept: 'application/json' },
        cache: 'no-store',
      });
      if (userRes.ok) {
        const u = (await userRes.json())?.data ?? null;
        admin = u?.role === 'admin';
        firstName = u?.first_name ?? null;
        lastName = u?.last_name ?? null;
        email = u?.email ?? null;
        avatar = u?.avatar ?? null;
      }

      // Store-credit balance for the "Invite & Earn" badge. Best-effort.
      try {
        const creditRes = await fetch(`${baseUrl}/referrals/credit`, {
          method: 'GET',
          headers: { Cookie: `access_token=${accessToken}`, Accept: 'application/json' },
          cache: 'no-store',
        });
        if (creditRes.ok) {
          const bal = (await creditRes.json())?.data?.store_credit_balance;
          if (typeof bal === 'number') storeCredit = bal;
        }
      } catch {
        // ignore — badge simply won't show
      }
    }

    return { isLoggedIn, admin, storeCredit, firstName, lastName, email, avatar, cart };
  } catch (error) {
    console.error('getNavSession failed:', error);
    return { ...empty, isLoggedIn };
  }
}

export async function removeFromCart(cartItemId: string) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;
  const guestId = cookieStore.get('soise_guestId')?.value;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

  const url = accessToken
    ? `${baseUrl}/cart/items/${cartItemId}`
    : `${baseUrl}/cart/items/${cartItemId}?session_id=${guestId || ''}`;

  try {
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        ...(accessToken ? { Cookie: `access_token=${accessToken}` } : {}),
      },
    });

    // No revalidatePath here: the Nav is now a static shell and the client
    // reconciles cart state via getNavSession(). Revalidating would purge the
    // ISR cache for every page on each cart mutation.
    return { success: response.ok };
  } catch (error) {
    return { success: false };
  }
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete('access_token');
  cookieStore.delete('refresh_token');
  cookieStore.delete('isAdmin');
  return { success: true };
}

export async function updateCartItemQuantity(
  cartItemId: string,
  variantId: string,
  quantity: number,
) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;
  const guestId = cookieStore.get('soise_guestId')?.value;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

  const url = accessToken
    ? `${baseUrl}/cart/items`
    : `${baseUrl}/cart/items?session_id=${guestId || ''}`;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(accessToken ? { Cookie: `access_token=${accessToken}` } : {}),
  };

  try {
    const addResponse = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ variant_id: variantId, quantity }),
      cache: 'no-store',
    });

    // See removeFromCart: client reconciles via getNavSession(), no revalidate.
    return { success: addResponse.ok };
  } catch (error) {
    return { success: false };
  }
}
