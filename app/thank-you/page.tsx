import Footer from '@/components/footer';
import Nav from '@/components/home/nav/Nav';
import Link from 'next/link';
import { siteConfig } from '@/lib/site-config';
import ReferralPromoCard from '@/components/ReferralPromoCard';
import RecommendationCarousel from '@/components/RecommendationCarousel';
import StatueWatermark from '@/components/brand/StatueWatermark';
import { getRecommendations, getFeaturedProducts } from '@/app/shop/product-listing/[id]/recs-actions';
import ClearPendingOrderMarker from './ClearPendingOrderMarker';
import { apiForwardCookie } from '@/lib/tracking';

import type { Metadata } from 'next';
import { NOINDEX } from '@/lib/seo';
// Personalised / transactional page — no search value, and indexing it would
// expose order-flow URLs. Explicit noindex (robots.txt alone can't prevent
// URL-only indexing of a linked page).
export const metadata: Metadata = NOINDEX;

const serif = { fontFamily: 'var(--font-luxe, Georgia, serif)' } as const;

export default async function ThankYouPage({
  searchParams,
}: {
  searchParams: Promise<{ reference?: string; trxref?: string; product?: string }>;
}) {
  const params = await searchParams;
  const orderRef = params.reference || params.trxref;

  // Confirm the payment on the Paystack callback. This is the reliable client
  // path: Paystack redirects the browser here after charging, and we verify by
  // reference server-side. `confirm_payment` is idempotent, so this is safe to
  // run alongside the webhook. Without this, a paid order can sit forever in
  // `pending_payment` if the webhook is missed.
  let paymentConfirmed = false;
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
      {showConfirmed && <ClearPendingOrderMarker />}
      <Nav />
      <main className="bg-[#F4F1EA] text-[#14110E]" role="main">
        {/* ── Confirmation ─────────────────────────────────────── */}
        <section className="relative overflow-hidden px-6 pt-20 pb-16 text-center sm:pt-28">
          <StatueWatermark
            tone="dark"
            width={520}
            opacity={0.05}
            className="absolute -top-10 right-[-120px] hidden lg:block"
          />
          <div className="relative mx-auto max-w-[680px]">
            <p className="text-[12px] font-medium uppercase tracking-[0.34em] text-[#9C6F2E]">
              {showConfirmed ? 'Order confirmed' : 'Confirming payment'}
            </p>
            <h1
              className="mx-auto mt-5 max-w-[560px] text-[38px] leading-[1.08] tracking-tight sm:text-[56px]"
              style={serif}
            >
              {showConfirmed ? 'Thank you. It’s in motion.' : 'Almost there.'}
            </h1>
            <p className="mx-auto mt-6 max-w-[460px] text-[15px] leading-relaxed text-[#5C544A] sm:text-[17px]">
              {showConfirmed
                ? 'Your order is confirmed, and a receipt is on its way to your inbox.'
                : 'We’re confirming your payment — this can take a moment. You don’t need to do anything.'}
            </p>
          </div>

          {/* Order details — quiet ledger, not a card shout */}
          <section
            className="mx-auto mt-12 max-w-[560px] border border-[#DFD7C6] bg-[#FBF9F4] px-6 py-5 text-left sm:px-8"
            aria-labelledby="order-details"
          >
            <h2 id="order-details" className="sr-only">
              Order details
            </h2>
            <dl className="divide-y divide-[#EAE3D4]">
              <div className="flex items-baseline justify-between gap-x-6 py-3">
                <dt className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#8A8271]">
                  Reference
                </dt>
                <dd className="text-[14px] font-medium">{orderRef ?? '—'}</dd>
              </div>
              <div className="flex items-baseline justify-between gap-x-6 py-3">
                <dt className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#8A8271]">
                  Status
                </dt>
                <dd
                  className={`text-[14px] font-medium ${showConfirmed ? 'text-[#14110E]' : 'text-[#9C6F2E]'}`}
                >
                  {showConfirmed ? 'Confirmed' : 'Processing'}
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-x-6 py-3">
                <dt className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#8A8271]">
                  Estimated delivery
                </dt>
                <dd className="text-[14px] font-medium">{siteConfig.estimatedDelivery}</dd>
              </div>
            </dl>
          </section>

          {/* Swaz Loop — the one pitch this page makes, in the house dark panel */}
          <div className="mx-auto mt-8 max-w-[560px]">
            <ReferralPromoCard variant="editorial" />
          </div>

          {/* Actions */}
          <div className="mx-auto mt-10 flex max-w-[560px] flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/shop/product-listing"
              className="inline-flex h-[53px] items-center justify-center rounded-[10px] bg-[#14110E] px-10 text-[13px] font-bold uppercase text-[#F4F1EA] transition-all duration-300 ease-out hover:bg-[#2a2a2a] hover:shadow-[0_8px_30px_rgba(0,0,0,0.2)] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14110E] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F4F1EA]"
            >
              Continue shopping
            </Link>
            <Link
              href="/shop/order-history"
              className="inline-flex h-[53px] items-center justify-center rounded-[10px] border border-[#14110E] px-10 text-[13px] font-bold uppercase text-[#14110E] transition-all duration-300 ease-out hover:bg-[#14110E] hover:text-[#F4F1EA] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14110E] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F4F1EA]"
            >
              View orders
            </Link>
          </div>

          <p className="mx-auto mt-10 max-w-[460px] text-[13px] leading-relaxed text-[#8A8271]">
            Need help with this order? Write to{' '}
            <a
              href={`mailto:${siteConfig.supportEmail}`}
              className="underline underline-offset-4 transition-colors hover:text-[#14110E]"
            >
              {siteConfig.supportEmail}
            </a>
            .
          </p>
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
