'use client';
import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Toaster } from 'sonner';
import Image from 'next/image';
import Link from 'next/link';
import { showToast } from '@/lib/toast-utils';

/**
 * PRESSED INK — see app/contact/page.tsx for the canonical treatment and the
 * brut- tokens in globals.css. This screen is a waypoint: Google hands the
 * token back here and we redirect, so it is a single plate on bone paper with
 * the state carried by ink weight and the crimson stamp.
 */

const serif = { fontFamily: 'var(--font-display, Georgia, serif)' } as const;

function AuthSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const handleGoogleCallback = async () => {
      const accessToken = searchParams.get('access_token');
      const userId = searchParams.get('user_id');
      // Single-use handoff code. Preferred over the raw token in the URL: it
      // carries the refresh token across too (without which a Google session
      // died after 24h instead of 30 days) and expires in 60 seconds.
      const code = searchParams.get('code');

      if (!accessToken && !code) {
        showToast.error('Authentication failed - no access token received');
        setTimeout(() => router.push('/auth/login'), 2000);
        return;
      }

      const toastId = showToast.loading('Completing sign in...');

      try {
        const response = await fetch('/api/auth/google/callback', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ accessToken, userId, code }),
        });

        const result = await response.json();

        showToast.dismiss(toastId);

        if (result.success) {
          showToast.success('Successfully signed in!');
          setTimeout(() => {
            router.push('/');
            router.refresh();
          }, 1000);
        } else {
          showToast.error(result.message || 'Authentication failed. Please try again.');
          setTimeout(() => router.push('/auth/login'), 2000);
        }
      } catch (error) {
        showToast.dismiss(toastId);
        console.error('Error processing Google callback:', error);
        showToast.error('An error occurred during authentication. Please try again.');
        setTimeout(() => router.push('/auth/login'), 2000);
      } finally {
        setIsProcessing(false);
      }
    };

    handleGoogleCallback();
  }, [searchParams, router]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#F5F0E8] px-5 text-[#121212]">
      <Toaster position="top-center" />

      <Link
        href="/"
        aria-label="Back to shop"
        className="brut-plate brut-press mb-8 flex h-[48px] w-[48px] items-center justify-center bg-white"
      >
        <Image
          src="/main-logo.png"
          alt="Soise"
          width={34}
          height={34}
          className="h-[30px] w-[30px] object-contain"
        />
      </Link>

      <div className="brut-rise brut-plate brut-shadow w-full max-w-[440px] px-6 py-8 text-center">
        <span className="brut-stamp">Google</span>
        {isProcessing ? (
          <>
            <div className="mt-5 mb-4 inline-block h-8 w-8 animate-spin rounded-full border-2 border-solid border-[#121212] border-r-transparent"></div>
            <p className="text-[24px] uppercase" style={serif}>
              Completing sign in...
            </p>
          </>
        ) : (
          <p className="mt-5 text-[24px] uppercase" style={serif}>
            Redirecting...
          </p>
        )}
      </div>
    </main>
  );
}

export default function AuthSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F5F0E8]"></div>}>
      <AuthSuccessContent />
    </Suspense>
  );
}
