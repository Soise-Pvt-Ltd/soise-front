'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Toaster } from 'sonner';
import Image from 'next/image';
import Link from 'next/link';
import { verifyOtp, resendOtp } from './actions';
import { showToast, validateField } from '@/lib/toast-utils';

/**
 * PRESSED INK — see app/contact/page.tsx for the canonical treatment and the
 * brut- tokens in globals.css. No site Nav here, so the page carries its own
 * masthead bar; the entrance is the CSS-only .brut-rise stagger.
 */

const serif = { fontFamily: 'var(--font-display, Georgia, serif)' } as const;

/** The masthead bar every auth screen wears in place of the site Nav. */
function AuthMasthead() {
  return (
    <div className="mx-auto flex max-w-[440px] items-center justify-between px-5 pt-7">
      <Link
        href="/"
        aria-label="Back to shop"
        className="brut-plate brut-press flex h-[48px] w-[48px] items-center justify-center bg-white"
      >
        <Image
          src="/main-logo.png"
          alt="Soise"
          width={34}
          height={34}
          className="h-[30px] w-[30px] object-contain"
        />
      </Link>
      <Link
        href="/"
        className="brut-plate brut-press px-4 py-2.5 text-[11px] font-bold tracking-[0.14em] uppercase"
      >
        Back to shop
      </Link>
    </div>
  );
}

function OtpFormComponent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paramEmail = searchParams.get('email');

  const [email, setEmail] = useState<string | null>(paramEmail);
  const [otp, setOtp] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!email) {
      const storedEmail = sessionStorage.getItem('email');
      if (storedEmail) {
        setEmail(storedEmail);
      } else {
        router.replace('/auth/register');
      }
    }
  }, [email, router]);

  if (!email) {
    return (
      <div className="mx-auto max-w-[440px] px-5 pt-14 pb-24 text-center">
        <p className="brut-label text-[#5C544A]">Loading...</p>
      </div>
    );
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const codeError = validateField(otp, 'Verification code', {
      required: true,
      minLength: 4,
    });

    if (codeError) {
      showToast.error(codeError);
      return;
    }

    setIsLoading(true);
    const toastId = showToast.loading('Verifying your code...');

    try {
      const result = await verifyOtp({ code: otp, email });

      showToast.dismiss(toastId);

      if (!result.success) {
        if (result.message === 'Invalid or expired verification code') {
          showToast.error('Code expired. Sending a new one...');
          const resendResult = await resendOtp({ email });

          if (resendResult.success) {
            showToast.success('New code sent to your email!');
          } else {
            showToast.error('Failed to resend code. Please try again.');
          }
          setOtp('');
        } else {
          showToast.error(result.message || 'Verification failed. Please try again.');
        }
      } else {
        showToast.success('Email verified! Redirecting to login...');
        setTimeout(() => {
          router.push('/auth/login');
        }, 500);
      }
    } catch (err) {
      showToast.dismiss(toastId);
      showToast.error('Verification failed. Please try again.');
      console.error('OTP submission error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setError(null);
    const toastId = showToast.loading('Sending new code...');

    const result = await resendOtp({ email });
    showToast.dismiss(toastId);

    if (result.success) {
      showToast.success(result.message || 'New code sent to your email!');
    } else {
      showToast.error(result.message || 'Failed to resend code. Please try again.');
    }
  };

  return (
    <div className="mx-auto max-w-[440px] px-5 pt-12 pb-24">
      <header className="brut-rise">
        <p className="brut-label text-[#B3101C]">Verify</p>
        <h1
          className="mt-4 text-[44px] leading-[0.95] tracking-tight uppercase sm:text-[64px]"
          style={serif}
        >
          Enter Verification Code<span className="text-[#B3101C]">.</span>
        </h1>
        <p className="mt-5 text-[15px] leading-relaxed text-[#3F3830]">
          A code has been sent to{' '}
          <strong className="font-bold text-[#121212] break-all">
            {email}
          </strong>
        </p>
      </header>

      <form onSubmit={handleVerify} className="mt-10">
        <div className="brut-rise" style={{ animationDelay: '0.08s' }}>
          <label htmlFor="otp" className="brut-label mb-[8px] block">
            6-Digit Code
          </label>
          <input
            id="otp"
            type="text"
            className="brut-input text-center text-[22px] font-bold tracking-[0.4em]"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            maxLength={6}
            required
          />
        </div>

        {error && (
          <div className="mt-3 text-[13px] font-bold text-[#B3101C]">
            {error}
          </div>
        )}

        {/* The one thing we want pressed gets the ink plate. */}
        <div className="brut-rise mt-[32px]" style={{ animationDelay: '0.16s' }}>
          <button
            type="submit"
            className="brut-btn brut-press"
            disabled={isLoading}
          >
            {isLoading ? 'Verifying...' : 'Verify Account'}
          </button>
        </div>

        <div
          className="brut-rise mt-[28px] text-center text-[13px] text-[#5C544A]"
          style={{ animationDelay: '0.24s' }}
        >
          Didn't receive code?{' '}
          <button
            type="button"
            onClick={handleResend}
            className="cursor-pointer font-bold text-[#B3101C] underline underline-offset-2"
          >
            Resend
          </button>
        </div>
      </form>
    </div>
  );
}

export default function OtpPage() {
  return (
    <main className="min-h-screen bg-[#F5F0E8] text-[#121212]">
      <Toaster position="top-center" />
      <AuthMasthead />
      <Suspense
        fallback={
          <div className="mx-auto max-w-[440px] px-5 pt-14 pb-24 text-center">
            <p className="brut-label text-[#5C544A]">Loading...</p>
          </div>
        }
      >
        <OtpFormComponent />
      </Suspense>
    </main>
  );
}
