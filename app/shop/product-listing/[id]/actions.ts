'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

type AddToBagSuccess = {
  success: true;
  sessionId?: string;
  shouldMigrate: boolean;
};

type AddToBagError = {
  success: false;
  message: string;
};

type AddToBagResult = AddToBagSuccess | AddToBagError;

export async function addToBag(
  variant_id: string,
  quantity: number,
): Promise<AddToBagResult> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    if (!baseUrl) {
      console.error('NEXT_PUBLIC_BASE_URL is not set');
      return {
        success: false,
        message: 'Configuration error. Please try again later.',
      };
    }

    const cookieStore = await cookies();
    const accessToken = cookieStore.get('access_token')?.value;
    const existingGuestId = cookieStore.get('soise_guestId')?.value;

    // Build URL — only append session_id for guest users
    const url = accessToken
      ? `${baseUrl}/cart/items`
      : `${baseUrl}/cart/items?session_id=${existingGuestId || ''}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        ...(accessToken ? { Cookie: `access_token=${accessToken}` } : {}),
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ variant_id, quantity }),
      cache: 'no-store',
    });

    const data = await response.json().catch(() => ({}) as any);

    // console.log(accessToken);
    // console.log(data);

    if (!response.ok) {
      return {
        success: false,
        message: (data as any).message || 'Failed to add item to bag.',
      };
    }

    const newSessionId = (data as any)?.meta?.session_id;

    // Set guest cookie if backend returned a new session and user is not logged in
    if (newSessionId && !accessToken) {
      cookieStore.set('soise_guestId', newSessionId, {
        path: '/',
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        httpOnly: false,
        maxAge: 60 * 60 * 24 * 30, // 30 days
      });
    }

    // Handle migration: If user just logged in and has items in guest cart
    if (accessToken && existingGuestId) {
      const guestCartRes = await fetch(
        `${baseUrl}/cart/items?session_id=${existingGuestId}`,
        {
          headers: { Accept: 'application/json' },
          cache: 'no-store',
        },
      );

      if (guestCartRes.ok) {
        const guestCartData = await guestCartRes
          .json()
          .catch(() => ({}) as any);
        const hasItems =
          Array.isArray(guestCartData?.data) && guestCartData.data.length > 0;

        if (hasItems) {
          const migrateRes = await fetch(
            `${baseUrl}/cart/migrate?session_id=${encodeURIComponent(existingGuestId)}`,
            {
              method: 'POST',
              headers: {
                Cookie: `access_token=${accessToken}`,
                Accept: 'application/json',
              },
              cache: 'no-store',
            },
          );

          if (migrateRes.ok) {
            cookieStore.delete('soise_guestId');
            revalidatePath('/', 'layout');
            return { success: true, sessionId: undefined, shouldMigrate: true };
          } else {
            const errBody = await migrateRes.text().catch(() => '');
            console.error('Migration error:', errBody);
            // optionally: decide whether to keep or delete the cookie here
          }
        }
      }

      // No items or fetch failed — clean up guest cookie anyway
      cookieStore.delete('soise_guestId');
    }

    revalidatePath('/', 'layout');

    return {
      success: true,
      sessionId: newSessionId,
      shouldMigrate: false,
    };
  } catch (error) {
    console.error('Add to bag error:', error);
    return {
      success: false,
      message: 'Failed to add item to bag.',
    };
  }
}
