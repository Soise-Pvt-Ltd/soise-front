'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface to monitoring; the digest links to the server-side stack.
    console.error('App error boundary:', error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center text-[#121212]">
      <p className="text-[13px] font-medium tracking-wide text-[#8E8E93] uppercase">
        Something went wrong
      </p>
      <h1 className="font-display mt-4 text-[36px] leading-tight md:text-[48px]">
        We hit an unexpected error
      </h1>
      <p className="mt-3 max-w-[420px] text-[14px] text-[#8E8E93]">
        Sorry about that. You can try again, or head back to the homepage.
      </p>
      <div className="mt-8 flex w-full max-w-[320px] flex-col gap-3">
        <button
          onClick={() => reset()}
          className="btn_black flex items-center justify-center"
        >
          Try Again
        </button>
        <Link href="/" className="btn_outline flex items-center justify-center">
          Back to Home
        </Link>
      </div>
    </main>
  );
}
