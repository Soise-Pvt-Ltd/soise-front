import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Page Not Found',
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center text-[#121212]">
      <p className="text-[13px] font-medium tracking-wide text-[#8E8E93] uppercase">
        404 — Not Found
      </p>
      <h1 className="font-display mt-4 text-[40px] leading-tight md:text-[56px]">
        This page doesn&apos;t exist
      </h1>
      <p className="mt-3 max-w-[420px] text-[14px] text-[#8E8E93]">
        The page you&apos;re looking for may have been moved or no longer
        exists. Let&apos;s get you back to shopping.
      </p>
      <div className="mt-8 flex w-full max-w-[320px] flex-col gap-3">
        <Link href="/" className="btn_black flex items-center justify-center">
          Back to Home
        </Link>
        <Link
          href="/shop/product-listing"
          className="btn_outline flex items-center justify-center"
        >
          Browse Products
        </Link>
      </div>
    </main>
  );
}
