import { cookies } from 'next/headers';

/**
 * Move a guest's cart onto their account.
 *
 * This used to live inline in `addToBag`, which meant it only ever ran when a
 * signed-in user added *another* item. The common path — browse as a guest,
 * fill the bag, sign in to check out — never triggered it, so the shopper
 * landed on checkout looking at an empty cart with their card already out.
 * Now every place that mints an `access_token` calls this, and the order
 * summary calls it defensively on the way in.
 *
 * Best-effort by design: a failed migration must never block auth or checkout.
 * Returns true only when items actually moved.
 */
export async function migrateGuestCart(
  accessToken?: string,
): Promise<boolean> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  if (!baseUrl) return false;

  let cookieStore;
  try {
    cookieStore = await cookies();
  } catch {
    return false;
  }

  const token = accessToken || cookieStore.get('access_token')?.value;
  const guestId = cookieStore.get('soise_guestId')?.value;
  if (!token || !guestId) return false;

  try {
    // Don't POST /cart/migrate for an empty guest cart — it's a no-op that can
    // still clobber a cart the user already had on their account.
    const guestCartRes = await fetch(
      `${baseUrl}/cart/items?session_id=${encodeURIComponent(guestId)}`,
      { headers: { Accept: 'application/json' }, cache: 'no-store' },
    );
    if (!guestCartRes.ok) return false;

    const guestCart = await guestCartRes.json().catch(() => ({}) as any);
    if (!Array.isArray(guestCart?.data) || guestCart.data.length === 0) {
      return false;
    }

    const migrateRes = await fetch(
      `${baseUrl}/cart/migrate?session_id=${encodeURIComponent(guestId)}`,
      {
        method: 'POST',
        headers: {
          Cookie: `access_token=${token}`,
          Accept: 'application/json',
        },
        cache: 'no-store',
      },
    );

    if (!migrateRes.ok) {
      console.error(
        'Cart migration failed:',
        await migrateRes.text().catch(() => ''),
      );
      return false;
    }

    // Cookie writes throw during a Server Component render (only actions and
    // route handlers may set them). The migration itself already succeeded, so
    // a lingering guest cookie is cosmetic — the next add or auth call clears
    // it, and the empty-guest-cart guard above keeps it from doing harm.
    try {
      cookieStore.delete('soise_guestId');
    } catch {
      /* render context — cookie clears on the next action */
    }

    return true;
  } catch (error) {
    console.error('Cart migration error:', error);
    return false;
  }
}
