'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Toaster } from 'sonner';
import { showToast, validateField } from '@/lib/toast-utils';
import { requestRecoveryOtp } from './actions';

/**
 * PRESSED INK — see app/contact/page.tsx for the canonical treatment and the
 * brut- tokens in globals.css. No site Nav here, so the page carries its own
 * masthead bar; the entrance is the CSS-only .brut-rise stagger.
 */

const serif = { fontFamily: 'var(--font-display, Georgia, serif)' } as const;

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const emailError = validateField(email, 'Email', {
      required: true,
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    });
    if (emailError) {
      showToast.error(emailError);
      return;
    }

    setIsLoading(true);
    const toastId = showToast.loading('Sending recovery code...');
    const result = await requestRecoveryOtp(email);
    showToast.dismiss(toastId);

    if (result.success) {
      showToast.success(result.message || 'Recovery code sent.');
      router.push(
        `/auth/forgot-password/new-password?email=${encodeURIComponent(email)}`,
      );
    } else {
      showToast.error(result.message || 'Could not send a recovery code.');
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#F5F0E8] text-[#121212]">
      <Toaster position="top-center" />

      {/* Masthead bar — these pages render without the site Nav. */}
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

      <div className="mx-auto max-w-[440px] px-5 pt-12 pb-24">
        <header className="brut-rise">
          <p className="brut-label text-[#B3101C]">Reset</p>
          <h1
            className="mt-4 text-[44px] leading-[0.95] tracking-tight uppercase sm:text-[64px]"
            style={serif}
          >
            Recover your account<span className="text-[#B3101C]">.</span>
          </h1>
          <p className="mt-5 text-[15px] leading-relaxed text-[#3F3830]">
            Enter your email and we&apos;ll send you a one-time code to sign in.
            You can update your password afterwards from your account settings.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="mt-10">
          <div className="brut-rise" style={{ animationDelay: '0.08s' }}>
            <label htmlFor="email" className="brut-label mb-[8px] block">
              Email
            </label>
            <input
              id="email"
              type="email"
              className="brut-input"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
              {isLoading ? 'Sending...' : 'Send recovery code'}
            </button>
          </div>

          <div
            className="brut-rise mt-[28px] text-center text-[13px] text-[#5C544A]"
            style={{ animationDelay: '0.24s' }}
          >
            Remembered your password?{' '}
            <Link
              href="/auth/login"
              className="font-bold text-[#B3101C] underline underline-offset-2"
            >
              Sign in
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}
