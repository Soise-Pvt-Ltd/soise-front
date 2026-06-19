'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://api.soise.ng';

export async function addToWishlist(productId: string) {
  if (!productId) return { success: false, message: 'Missing product' };

  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;
  if (!accessToken) {
    return { success: false, unauthenticated: true, message: 'Please sign in' };
  }

  try {
    const res = await fetch(`${BASE_URL}/wishlist/products/${productId}`, {
      method: 'POST',
      headers: { Cookie: `access_token=${accessToken}` },
    });
    if (res.ok) revalidatePath('/shop/wishlist');
    return { success: res.ok };
  } catch {
    return { success: false, message: 'Could not update wishlist' };
  }
}

export async function removeFromWishlist(productId: string) {
  if (!productId) return { success: false };

  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;
  if (!accessToken) {
    return { success: false, unauthenticated: true };
  }

  try {
    const res = await fetch(`${BASE_URL}/wishlist/products/${productId}`, {
      method: 'DELETE',
      headers: { Cookie: `access_token=${accessToken}` },
    });
    if (res.ok) revalidatePath('/shop/wishlist');
    return { success: res.ok };
  } catch {
    return { success: false };
  }
}
