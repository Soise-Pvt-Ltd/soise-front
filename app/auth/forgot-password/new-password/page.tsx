'use client';

import { Suspense, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Toaster } from 'sonner';
import { showToast } from '@/lib/toast-utils';
import { requestRecoveryOtp, verifyRecoveryOtp } from '../actions';

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

function RecoveryCodeForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';

  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      showToast.error('Missing email. Please start over.');
      router.replace('/auth/forgot-password');
      return;
    }
    if (!code.trim() || code.trim().length < 4) {
      showToast.error('Please enter the code we emailed you.');
      return;
    }

    setIsLoading(true);
    const toastId = showToast.loading('Verifying code...');
    const result = await verifyRecoveryOtp(email, code.trim());
    showToast.dismiss(toastId);

    if (result.success) {
      showToast.success('Signed in! Redirecting...');
      router.push('/');
      router.refresh();
    } else {
      showToast.error(result.message || 'Invalid or expired code.');
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) return;
    setIsResending(true);
    const toastId = showToast.loading('Resending code...');
    const result = await requestRecoveryOtp(email);
    showToast.dismiss(toastId);
    showToast[result.success ? 'success' : 'error'](
      result.message || (result.success ? 'Code resent.' : 'Could not resend.'),
    );
    setIsResending(false);
  };

  return (
    <div className="mx-auto max-w-[440px] px-5 pt-12 pb-24">
      <header className="brut-rise">
        <p className="brut-label text-[#B3101C]">Reset</p>
        <h1
          className="mt-4 text-[44px] leading-[0.95] tracking-tight uppercase sm:text-[64px]"
          style={serif}
        >
          Enter your code<span className="text-[#B3101C]">.</span>
        </h1>
        <p className="mt-5 text-[15px] leading-relaxed text-[#3F3830]">
          We sent a one-time code to{' '}
          <span className="font-bold break-all text-[#121212]">
            {email || 'your email'}
          </span>
          . Enter it below to sign in.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="mt-10">
        <div className="brut-rise" style={{ animationDelay: '0.08s' }}>
          <label htmlFor="code" className="brut-label mb-[8px] block">
            One-time code
          </label>
          <input
            id="code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            className="brut-input text-center text-[22px] font-bold tracking-[0.4em]"
            placeholder="------"
            value={code}
            onChange={(e) =>
              setCode(e.target.value.replace(/\D/g, '').slice(0, 6))
            }
            required
            autoFocus
          />
        </div>

        {/* The one thing we want pressed gets the ink plate. */}
        <div className="brut-rise mt-[32px]" style={{ animationDelay: '0.16s' }}>
          <button
            type="submit"
            className="brut-btn brut-press"
            disabled={isLoading}
          >
            {isLoading ? 'Verifying...' : 'Verify & sign in'}
          </button>
        </div>

        <div
          className="brut-rise mt-[28px] text-center text-[13px] text-[#5C544A]"
          style={{ animationDelay: '0.24s' }}
        >
          Didn&apos;t get a code?{' '}
          <button
            type="button"
            onClick={handleResend}
            disabled={isResending}
            className="cursor-pointer font-bold text-[#B3101C] underline underline-offset-2 disabled:opacity-50"
          >
            {isResending ? 'Resending...' : 'Resend'}
          </button>
          <span className="mx-2">·</span>
          <Link
            href="/auth/forgot-password"
            className="font-bold text-[#B3101C] underline underline-offset-2"
          >
            Use a different email
          </Link>
        </div>
      </form>
    </div>
  );
}

export default function NewPasswordPage() {
  return (
    <main className="min-h-screen bg-[#F5F0E8] text-[#121212]">
      <Toaster position="top-center" />
      <AuthMasthead />
      <Suspense fallback={null}>
        <RecoveryCodeForm />
      </Suspense>
    </main>
  );
}
