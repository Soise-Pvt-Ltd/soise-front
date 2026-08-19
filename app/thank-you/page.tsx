import Footer from '@/components/footer';
import Nav from '@/components/home/nav/Nav';
import Link from 'next/link';
import { siteConfig } from '@/lib/site-config';
import ReferralPromoCard from '@/components/ReferralPromoCard';
import RecommendationCarousel from '@/components/RecommendationCarousel';
import StatueWatermark from '@/components/brand/StatueWatermark';
import { getRecommendations, getFeaturedProducts } from '@/app/shop/product-listing/[id]/recs-actions';
import ClearPendingOrderMarker from './ClearPendingOrderMarker';
import PostPaymentAddress from './PostPaymentAddress';
import { apiForwardCookie } from '@/lib/tracking';

import type { Metadata } from 'next';
import { NOINDEX } from '@/lib/seo';
// Personalised / transactional page — no search value, and indexing it would
// expose order-flow URLs. Explicit noindex (robots.txt alone can't prevent
// URL-only indexing of a linked page).
export const metadata: Metadata = NOINDEX;

/**
 * PRESSED INK — the post-purchase page. Deliberately continues the checkout
 * it follows (app/shop/order-summary is already Pressed Ink), so the shopper
 * never crosses a visual seam between paying and being thanked.
 *
 * Renders inside the global site Nav/Footer — no standalone masthead bar.
 */
const serif = { fontFamily: 'var(--font-display, Georgia, serif)' } as const;

export default async function ThankYouPage({
  searchParams,
}: {
  searchParams: Promise<{
    reference?: string;
    // Bachs appends ?checkout_id= to the success redirect; the backend can
    // verify by either handle. trxref is the retired Paystack callback param,
    // kept so links already in shoppers' tabs/inboxes still confirm.
    checkout_id?: string;
    trxref?: string;
    product?: string;
  }>;
}) {
  const params = await searchParams;
  const orderRef = params.reference || params.checkout_id || params.trxref;

  // Confirm the payment on the Bachs callback. This is the reliable client
  // path: Bachs redirects the browser here after charging, and we verify by
  // reference (or checkout_id) server-side. `confirm_payment` is idempotent,
  // so this is safe to run alongside the webhook. Without this, a paid order
  // can sit forever in `pending_payment` if the webhook is missed.
  let paymentConfirmed = false;
  // Checkout takes payment before asking where to ship, so a confirmed order can
  // still owe us an address. The verify response is the only place that knows,
  // and it answers with the order id too — the address endpoint is keyed by id
  // while this page only holds a payment reference, and since references became
  // per-attempt the two are no longer the same string.
  let addressPendingOrderId: string | null = null;
  if (orderRef) {
    try {
      // Forward TikTok attribution cookies (_ttp / ttclid) so the Purchase
      // event this verify call fires server-side is attributed to the ad that
      // drove the sale. The webhook is the backup confirmation path, but it has
      // no browser cookies, so this client verify is the only path that can
      // attribute revenue to the ad.
      const forwardCookie = await apiForwardCookie();
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/payments/verify`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            ...(forwardCookie ? { Cookie: forwardCookie } : {}),
          },
          body: JSON.stringify({ reference: orderRef }),
          cache: 'no-store',
        },
      );
      paymentConfirmed = res.ok;
      if (res.ok) {
        const json = await res.json().catch(() => null);
        if (json?.data?.address_pending && json?.data?.order_id) {
          addressPendingOrderId = json.data.order_id as string;
        }
      }
    } catch {
      // Network/verify hiccup — the webhook is the backup. Show a soft
      // "processing" state rather than a hard error.
    }
  }
  // Fully-covered (store-credit) orders redirect here with no reference; they
  // are already paid, so treat the absence of a reference as confirmed.
  const showConfirmed = paymentConfirmed || !orderRef;

  // "You may also like": if a purchased product id is available in the URL
  // context, recommend against it; otherwise fall back to a generic featured row.
  // Both helpers never throw and return [] on failure, so the row simply hides.
  const purchasedProductId = params.product;
  const youMayAlsoLike = purchasedProductId
    ? await getRecommendations(purchasedProductId, 8)
    : await getFeaturedProducts(8);

  return (
    <>
      {/* Payment confirmed (or store-credit covered): drop the resume marker so
          the order-summary page stops nudging to pay for this order. */}
      {/* Hold the marker until the address is in: it carries the guest order's
          per-order secret, and PostPaymentAddress needs that to prove ownership
          when it PATCHes the shipping address. It clears the marker itself once
          saved, so the resume nudge still goes away. */}
      {showConfirmed && !addressPendingOrderId && <ClearPendingOrderMarker />}
      <Nav />
      <main className="bg-[#F5F0E8] text-[#121212]" role="main">
        {/* ── Confirmation ─────────────────────────────────────── */}
        <section className="relative px-5 pt-14 pb-16">
          <div className="relative mx-auto max-w-[680px]">
            <StatueWatermark
              tone="dark"
              width={520}
              opacity={0.05}
              className="pointer-events-none absolute -top-10 right-[-260px] hidden lg:block"
            />
            <header className="brut-rise relative">
              <p className="brut-label text-[#B3101C]">
                {showConfirmed ? 'Order confirmed' : 'Confirming payment'}
              </p>
              <h1
                className="mt-4 text-[48px] leading-[0.95] tracking-tight uppercase sm:text-[72px]"
                style={serif}
              >
                {showConfirmed ? (
                  <>
                    Thank you. It’s in motion<span className="text-[#B3101C]">.</span>
                  </>
                ) : (
                  <>
                    Almost there<span className="text-[#B3101C]">.</span>
                  </>
                )}
              </h1>
              <p className="mt-6 max-w-[46ch] text-[15px] leading-relaxed text-[#3F3830]">
                {showConfirmed
                  ? 'Your order is confirmed, and a receipt is on its way to your inbox.'
                  : 'We’re confirming your payment — this can take a moment. You don’t need to do anything.'}
              </p>
            </header>

            {/* Paid, but we still don't know where to send it. Only reached
                when the overlay was unavailable and the hosted redirect landed
                here — the overlay path asks on the order-summary page instead. */}
            {addressPendingOrderId && (
              <PostPaymentAddress orderId={addressPendingOrderId} />
            )}

            {/* The receipt — heaviest plate on the page. It is the thing the
                shopper came here to see and the thing they'll screenshot. */}
            <section
              className="brut-rise brut-plate brut-shadow mt-10 px-6 py-5 sm:px-8"
              style={{ animationDelay: '0.08s' }}
              aria-labelledby="order-details"
            >
              <h2 id="order-details" className="sr-only">
                Order details
              </h2>
              <dl className="divide-y-2 divide-[#121212]">
                <div className="flex items-baseline justify-between gap-x-6 py-4">
                  <dt className="brut-label text-[#5C544A]">Reference</dt>
                  <dd className="text-[18px] break-all sm:text-[22px]" style={serif}>
                    {orderRef ?? '—'}
                  </dd>
                </div>
                <div className="flex items-baseline justify-between gap-x-6 py-4">
                  <dt className="brut-label text-[#5C544A]">Status</dt>
                  <dd
                    className={`text-[13px] font-bold tracking-[0.1em] uppercase ${showConfirmed ? 'text-[#121212]' : 'text-[#B3101C]'}`}
                  >
                    {showConfirmed ? 'Confirmed' : 'Processing'}
                  </dd>
                </div>
                <div className="flex items-baseline justify-between gap-x-6 py-4">
                  <dt className="brut-label text-[#5C544A]">Estimated delivery</dt>
                  <dd className="text-[14px] font-medium">{siteConfig.estimatedDelivery}</dd>
                </div>
              </dl>
            </section>

            {/* Swaz Loop — the one pitch this page makes */}
            <div className="brut-rise mt-8" style={{ animationDelay: '0.16s' }}>
              <ReferralPromoCard variant="editorial" />
            </div>

            {/* Actions */}
            <div
              className="brut-rise mt-10 flex flex-col gap-3 sm:flex-row"
              style={{ animationDelay: '0.24s' }}
            >
              <Link
                href="/shop/product-listing"
                className="brut-btn brut-press"
              >
                Continue shopping
              </Link>
              <Link
                href="/shop/order-history"
                className="brut-btn-paper brut-press"
              >
                View orders
              </Link>
            </div>

            <p
              className="brut-rise brut-rule mt-12 max-w-[52ch] pt-8 text-[13px] leading-relaxed text-[#5C544A]"
              style={{ animationDelay: '0.32s' }}
            >
              Need help with this order? Write to{' '}
              <a
                href={`mailto:${siteConfig.supportEmail}`}
                className="font-bold text-[#B3101C] underline underline-offset-2"
              >
                {siteConfig.supportEmail}
              </a>
              .
            </p>
          </div>
        </section>

        {/* You may also like — generic recommendation row. Hidden when empty. */}
        <div className="shell-max px-4 pb-20">
          <RecommendationCarousel
            title="You may also like"
            items={youMayAlsoLike}
            headingId="thank-you-recs"
          />
        </div>
      </main>
      <Footer />
    </>
  );
}
