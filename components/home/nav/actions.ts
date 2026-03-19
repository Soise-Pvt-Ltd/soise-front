'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

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

    if (response.ok) {
      revalidatePath('/', 'layout');
    }
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

    if (addResponse.ok) {
      revalidatePath('/', 'layout');
    }
    return { success: addResponse.ok };
  } catch (error) {
    return { success: false };
  }
}
