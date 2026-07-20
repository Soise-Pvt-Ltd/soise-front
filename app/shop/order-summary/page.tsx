export const runtime = 'nodejs';

import Nav from '@/components/home/nav/Nav';
import OrderSummaryClient from './OrderSummaryClient';
import { cookies } from 'next/headers';
import {
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

  let cartData = { data: [] };
  let storeCredit = 0;
  let welcomeCreditPending = false;
  let welcomeCreditAmount = 1000;
  let savedAddresses: any[] = [];
  let defaultAddressId: string | null = null;
  let prefillFirstName = '';
  let prefillLastName = '';
  let prefillPhone = '';

  try {
    if (!baseUrl) {
      throw new Error('Base URL is not configured');
    }

    const cartUrl =
      isLoggedIn && accessToken
        ? `${baseUrl}/cart`
        : `${baseUrl}/cart${guestId ? `?session_id=${guestId}` : ''}`;

    const cartRes = await fetch(cartUrl, {
      cache: 'no-store',
      headers: {
        ...(isLoggedIn && accessToken
          ? { Cookie: `access_token=${accessToken}` }
          : {}),
      },
    });

    if (cartRes.ok) cartData = await cartRes.json();

    // Fetch the signed-in user's store-credit balance so we can offer to apply
    // it at checkout. Best-effort — never block checkout on it. Guests have no
    // credit, so we only ask when authenticated.
    if (isLoggedIn && accessToken) {
      try {
        const creditRes = await fetch(`${baseUrl}/referrals/credit`, {
          cache: 'no-store',
          headers: {
            Cookie: `access_token=${accessToken}`,
            Accept: 'application/json',
          },
        });
        if (creditRes.ok) {
          const creditJson = await creditRes.json();
          const bal = creditJson?.data?.store_credit_balance;
          if (typeof bal === 'number') storeCredit = bal;
          welcomeCreditPending = Boolean(
            creditJson?.data?.welcome_credit_pending,
          );
          const amt = creditJson?.data?.welcome_credit_amount;
          if (typeof amt === 'number') welcomeCreditAmount = amt;
        }
      } catch {
        // ignore — toggle simply won't show
      }
    }

    // Fetch saved addresses (and name/phone for prefill) for logged-in users.
    // Best-effort, same pattern as store credit above — checkout must still
    // work if this fails.
    if (isLoggedIn && accessToken) {
      try {
        const profileRes = await fetch(`${baseUrl}/profiles`, {
          cache: 'no-store',
          headers: {
            Cookie: `access_token=${accessToken}`,
            Accept: 'application/json',
          },
        });
        if (profileRes.ok) {
          const profileJson = await profileRes.json();
          const profile = profileJson?.data;
          prefillFirstName = profile?.first_name || '';
          prefillLastName = profile?.last_name || '';
          prefillPhone = profile?.phone || '';
          savedAddresses = Array.isArray(profile?.addresses)
            ? profile.addresses
            : [];
          const defaultAddr = savedAddresses.find(
            (a: any) => a?.is_default,
          );
          defaultAddressId = defaultAddr?.id || null;
        }
      } catch {
        // ignore — form just falls back to blank/manual entry
      }
    }
  } catch (error) {
    console.error('Order history page fetch failed:', error);
  }

  // Cart items now arrive pre-enriched with `variant_details` (name, price,
  // color, size, media with fallback already resolved server-side) — no
  // more reconstructing this from /products' sample_variants, which was
  // capped at 3 variants per product and silently missed anything outside
  // that cap.
  const enrichedCart: EnrichedCartItem[] = Array.isArray(cartData?.data)
    ? cartData.data.map((item: CartItem & { variant_details?: ProductVariant }) => ({
        ...item,
        variantDetails: item.variant_details,
      }))
    : [];

  return (
    <>
      <Nav />
      <OrderSummaryClient
        cart={enrichedCart}
        isLoggedIn={isLoggedIn}
        storeCredit={storeCredit}
        welcomeCreditPending={welcomeCreditPending}
        welcomeCreditAmount={welcomeCreditAmount}
        savedAddresses={savedAddresses}
        defaultAddressId={defaultAddressId}
        prefillFirstName={prefillFirstName}
        prefillLastName={prefillLastName}
        prefillPhone={prefillPhone}
      />
    </>
  );
}
