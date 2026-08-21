'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Toaster } from 'sonner';
import { login } from './actions';
import { googleAuth } from '../google/actions';
import { showToast, validateField } from '@/lib/toast-utils';

/**
 * PRESSED INK — the auth screens run through the same letterpress as
 * /contact and checkout (see the brut- tokens in globals.css). These pages
 * render outside the global Nav, so each carries its own masthead bar: a logo
 * plate back to the shop on the left, an escape hatch on the right.
 *
 * Entrance is the CSS-only .brut-rise stagger rather than Framer Motion — a
 * shopper bounced here by the middleware gets painted content, not a
 * hydration pause.
 */

const serif = { fontFamily: 'var(--font-display, Georgia, serif)' } as const;

/**
 * Where the guard wanted us to end up.
 *
 * `requireRole` and the middleware both attach ?callbackUrl= when they bounce
 * someone here, and it was being discarded: `login()` has always accepted the
 * argument and honoured it (`redirect(callbackUrl || '/')`), but the page
 * called login(email, password) and then hardcoded router.push('/'). Every
 * guarded deep link — most visibly /dashboard — therefore dumped you on the
 * home page after a correct sign-in, which reads as "the dashboard redirects
 * to home".
 *
 * Read from `window.location` at submit time rather than with
 * useSearchParams(): this route is statically prerendered (`○ /auth/login`),
 * and that hook would force it behind a Suspense boundary or out of static
 * rendering entirely — a real cost to the first paint of a page shoppers get
 * bounced to, for a value nothing needs until the form is submitted.
 *
 * Only same-origin paths are honoured. Accepting an absolute URL would make
 * this an open redirect: ?callbackUrl=https://evil.example would land a
 * freshly authenticated user, cookies and all, on someone else's site.
 */
function readCallbackUrl(): string | null {
  if (typeof window === 'undefined') return null;
  const raw = new URLSearchParams(window.location.search).get('callbackUrl');
  if (!raw) return null;
  // A leading "//" is protocol-relative and leaves the origin.
  return raw.startsWith('/') && !raw.startsWith('//') ? raw : null;
}


function Divider() {
  return (
    <div className="flex w-full items-center gap-x-3">
      <span className="brut-rule flex-1 opacity-20"></span>
      <span className="brut-label text-[#5C544A]">or</span>
      <span className="brut-rule flex-1 opacity-20"></span>
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    const emailError = validateField(email, 'Email', {
      required: true,
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    });
    const passwordError = validateField(password, 'Password', {
      required: true,
      minLength: 6,
    });

    if (emailError) {
      showToast.error(emailError);
      return;
    }
    if (passwordError) {
      showToast.error(passwordError);
      return;
    }

    setIsLoading(true);
    const toastId = showToast.loading('Signing in...');

    const callbackUrl = readCallbackUrl();
    const result = await login(email, password, callbackUrl);

    showToast.dismiss(toastId);

    if (result.success) {
      showToast.success('Welcome back!');
      setTimeout(() => {
        router.push(callbackUrl ?? '/');
        router.refresh();
      }, 500);
    } else {
      showToast.error(
        result.message || 'Login failed. Please check your credentials.',
      );
    }
    setIsLoading(false);
  };

  const handleGoogleLogin = async () => {
    const toastId = showToast.loading('Redirecting to Google...');
    const result = await googleAuth();
    showToast.dismiss(toastId);

    if (result.success) {
      if (result.data?.url) {
        window.location.href = result.data.url;
      }
    } else {
      showToast.error(result.message || 'Google login failed. Please try again.');
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
          <p className="brut-label text-[#B3101C]">Sign in</p>
          <h1
            className="mt-4 text-[44px] leading-[0.95] tracking-tight uppercase sm:text-[64px]"
            style={serif}
          >
            Welcome Back<span className="text-[#B3101C]">.</span>
          </h1>
          <p className="mt-5 text-[15px] leading-relaxed text-[#3F3830]">
            Please enter your details.
          </p>
        </header>

        <form onSubmit={handleLogin} className="mt-10">
          <div className="brut-rise" style={{ animationDelay: '0.08s' }}>
            <button
              type="button"
              className="brut-btn-paper brut-press gap-x-[8px]"
              onClick={handleGoogleLogin}
            >
              <img src="/google.png" alt="google" className="size-[16px]" />
              Continue with Google
            </button>
          </div>

          <div
            className="brut-rise py-[24px]"
            style={{ animationDelay: '0.16s' }}
          >
            <Divider />
          </div>

          <div className="space-y-[16px]">
            <div className="brut-rise" style={{ animationDelay: '0.24s' }}>
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
              />
            </div>
            <div className="brut-rise" style={{ animationDelay: '0.32s' }}>
              <label htmlFor="password" className="brut-label mb-[8px] block">
                Password
              </label>
              <input
                id="password"
                type="password"
                className="brut-input"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <div
            className="brut-rise mt-4 text-right text-[13px]"
            style={{ animationDelay: '0.4s' }}
          >
            <Link
              href="/auth/forgot-password"
              className="font-bold text-[#B3101C] underline underline-offset-2"
            >
              Forgot password?
            </Link>
          </div>

          {/* The one thing we want pressed gets the ink plate. */}
          <div
            className="brut-rise mt-[32px]"
            style={{ animationDelay: '0.48s' }}
          >
            <button
              type="submit"
              className="brut-btn brut-press"
              disabled={isLoading}
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </button>
          </div>

          <div
            className="brut-rise mt-[28px] text-center text-[13px] text-[#5C544A]"
            style={{ animationDelay: '0.56s' }}
          >
            Don't have an account?{' '}
            <Link
              href="/auth/register"
              className="font-bold text-[#B3101C] underline underline-offset-2"
            >
              Sign up
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}
