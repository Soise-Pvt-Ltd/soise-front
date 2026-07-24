import Footer from '@/components/footer';
import Nav from '@/components/home/nav/Nav';
import { ArrowLeftIcon, AdminCheckCircleIcon } from '@/components/icons';
import Link from 'next/link';
import { siteConfig } from '@/lib/site-config';
import ReferralPromoCard from '@/components/ReferralPromoCard';
import RecommendationCarousel from '@/components/RecommendationCarousel';
import { getRecommendations, getFeaturedProducts } from '@/app/shop/product-listing/[id]/recs-actions';
import ClearPendingOrderMarker from './ClearPendingOrderMarker';
import { apiForwardCookie } from '@/lib/tracking';

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
    <div className="min-h-screen bg-white">
      {/* Payment confirmed (or store-credit covered): drop the resume marker so
          the order-summary page stops nudging to pay for this order. */}
      {showConfirmed && <ClearPendingOrderMarker />}
      {/* Navigation */}
      <header className="relative h-[607px] w-full overflow-hidden" role="banner">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0072BB] to-[#2D2C54]" aria-hidden="true" />
        <div className="relative z-10 h-full">
          <Nav />
        </div>
      </header>

      {/* Main Content */}
      <main className="relative -mt-[400px] z-20 mx-auto max-w-screen-2xl px-4 pb-20" role="main">
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-center">
            {/* Success Icon */}
            <div className="mb-8 flex justify-center" role="img" aria-label="Success">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[#CCEAD6]">
                <AdminCheckCircleIcon color="#32AC5B" className="h-12 w-12" aria-hidden="true" />
              </div>
            </div>

            {/* Thank You Message */}
            <h1 className="mb-4 text-5xl font-bold text-[#121212] md:text-6xl">
              Thank You!
            </h1>
            
            <p className="mb-8 text-xl text-[#35373C] md:text-2xl">
              {showConfirmed
                ? 'Your order has been successfully placed'
                : "We're confirming your payment — this can take a moment"}
            </p>

            {/* Order Details */}
            <section className="mb-12 rounded-[20px] bg-[#F5F5F5] p-8 text-left" aria-labelledby="order-details">
              <h2 id="order-details" className="mb-4 text-lg font-semibold text-[#121212]">Order Details</h2>
              <div className="space-y-2 text-[#35373C]">
                <p className="flex justify-between">
                  <span>Order Reference:</span>
                  <span className="font-medium">{orderRef ?? '—'}</span>
                </p>
                <p className="flex justify-between">
                  <span>Status:</span>
                  <span
                    className={`font-medium ${showConfirmed ? 'text-[#32AC5B]' : 'text-[#B8860B]'}`}
                  >
                    {showConfirmed ? 'Confirmed' : 'Processing'}
                  </span>
                </p>
                <p className="flex justify-between">
                  <span>Estimated Delivery:</span>
                  <span className="font-medium">{siteConfig.estimatedDelivery}</span>
                </p>
              </div>
            </section>

            {/* Invite & earn store credit */}
            <div className="mb-12">
              <ReferralPromoCard />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-[10px] bg-[#0072BB] px-8 py-3 text-white transition-colors hover:bg-[#005a8f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0072BB] focus-visible:ring-offset-2"
              >
                <ArrowLeftIcon className="mr-2 h-4 w-4" />
                Continue Shopping
              </Link>
              
              <Link
                href="/shop/order-history"
                className="inline-flex items-center justify-center rounded-[10px] border-2 border-[#0072BB] bg-white px-8 py-3 text-[#0072BB] transition-colors hover:bg-[#F5F5F5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0072BB] focus-visible:ring-offset-2"
              >
                View Orders
              </Link>
            </div>

            {/* Additional Info */}
            <div className="mt-12 text-sm text-[#AFB1B0]">
              <p className="mb-2">A confirmation email has been sent to your registered email address.</p>
              <p>Need help? Contact our support team at <a href={`mailto:${siteConfig.supportEmail}`} className="underline">{siteConfig.supportEmail}</a></p>
            </div>
          </div>
        </div>

        {/* You may also like — generic recommendation row. Hidden when empty. */}
        <RecommendationCarousel
          title="You may also like"
          items={youMayAlsoLike}
          headingId="thank-you-recs"
          className="mt-[56px] md:mt-[80px]"
        />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
