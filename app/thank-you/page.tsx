import Footer from '@/components/footer';
import Nav from '@/components/home/nav/Nav';
import { ArrowLeftIcon, AdminCheckCircleIcon } from '@/components/icons';
import Link from 'next/link';
import { siteConfig } from '@/lib/site-config';

export default async function ThankYouPage({
  searchParams,
}: {
  searchParams: Promise<{ reference?: string; trxref?: string }>;
}) {
  const params = await searchParams;
  const orderRef = params.reference || params.trxref;

  return (
    <div className="min-h-screen bg-white">
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
              Your order has been successfully placed
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
                  <span className="font-medium text-[#32AC5B]">Confirmed</span>
                </p>
                <p className="flex justify-between">
                  <span>Estimated Delivery:</span>
                  <span className="font-medium">{siteConfig.estimatedDelivery}</span>
                </p>
              </div>
            </section>

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
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
