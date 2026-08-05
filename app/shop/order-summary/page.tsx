export const runtime = 'nodejs';

import Nav from '@/components/home/nav/Nav';
import OrderSummaryClient from './OrderSummaryClient';
import { cookies } from 'next/headers';
import {
  ProductVariant,
  CartItem,
  EnrichedCartItem,
} from '@/components/home/nav/types';
import type { Metadata } from 'next';
import { NOINDEX } from '@/lib/seo';
import { migrateGuestCart } from '@/lib/cart-migrate';

// Personalised / transactional page — no search value, and indexing it would
// expose order-flow URLs. Explicit noindex (robots.txt alone can't prevent
// URL-only indexing of a linked page).
export const metadata: Metadata = NOINDEX;

export default async function OrderHistoryPage() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;
  const isLoggedIn = cookieStore.has('access_token');
  const guestId = cookieStore.get('soise_guestId')?.value;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

  let cartData: any = { data: [] };
  // Distinguishes "your bag is empty" from "we couldn't load your bag". Showing
  // the empty state for a failed fetch tells a shopper their cart vanished, and
  // they leave instead of retrying.
  let cartLoadFailed = false;
  let shippingFee: number | null = null;
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

    // Defensive: if the shopper signed in somewhere that predates the shared
    // migration helper (or it failed then), move the guest bag now rather than
    // showing them an empty checkout.
    if (isLoggedIn && accessToken && guestId) {
      await migrateGuestCart(accessToken);
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

    if (cartRes.ok) {
      cartData = await cartRes.json();
      // No shipping fee is read here on purpose. GET /cart's `meta` carries
      // only `session_id`, and the backend has no shipping pricing at all —
      // checkout hardcodes shipping to zero. If that changes, surface the fee
      // here so the total on this page matches what Bachs collects; the
      // Shipping line in OrderSummaryClient is already wired for it.
    } else if (cartRes.status !== 404) {
      // 404 is the backend's "this cart doesn't exist yet" — a genuinely empty
      // bag, not a failure. Anything else (5xx, auth, network) is us failing to
      // read a cart that may well have items in it.
      cartLoadFailed = true;
    }

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
    console.error('Order summary page fetch failed:', error);
    cartLoadFailed = true;
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
        cartLoadFailed={cartLoadFailed}
        shippingFee={shippingFee}
      />
    </>
  );
}
