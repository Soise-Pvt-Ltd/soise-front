'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Toaster } from 'sonner';
import { register } from './actions';
import { googleAuth } from '../google/actions';
import { showToast, validateField } from '@/lib/toast-utils';

/**
 * PRESSED INK — see app/contact/page.tsx for the canonical treatment and the
 * brut- tokens in globals.css. No site Nav here, so the page carries its own
 * masthead bar; the entrance is the CSS-only .brut-rise stagger.
 */

const serif = { fontFamily: 'var(--font-display, Georgia, serif)' } as const;

function Divider() {
  return (
    <div className="flex w-full items-center gap-x-3">
      <span className="brut-rule flex-1 opacity-20"></span>
      <span className="brut-label text-[#5C544A]">or</span>
      <span className="brut-rule flex-1 opacity-20"></span>
    </div>
  );
}

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    const emailError = validateField(email, 'Email', {
      required: true,
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    });
    const passwordError = validateField(password, 'Password', {
      required: true,
      minLength: 8,
    });
    const usernameError = validateField(username, 'Username', {
      required: true,
      minLength: 3,
      maxLength: 20,
    });
    const firstNameError = validateField(firstName, 'First Name', {
      required: true,
      minLength: 2,
    });
    const lastNameError = validateField(lastName, 'Last Name', {
      required: true,
      minLength: 2,
    });

    const errors = [emailError, passwordError, usernameError, firstNameError, lastNameError].filter(Boolean);
    if (errors.length > 0) {
      showToast.error(errors[0]!);
      return;
    }

    setIsLoading(true);
    const toastId = showToast.loading('Creating your account...');

    const result = await register({
      email,
      password,
      username,
      firstName,
      lastName,
    });

    showToast.dismiss(toastId);

    if (result.success) {
      showToast.success('Account created! Verify your email to continue.');
      setTimeout(() => {
        router.push(`/auth/otp?email=${encodeURIComponent(email)}`);
      }, 500);
    } else {
      showToast.error(result.message || 'Signup failed. Please try again.');
    }
    setIsLoading(false);
  };

  const handleGoogleSignup = async () => {
    const toastId = showToast.loading('Redirecting to Google...');
    const result = await googleAuth();
    showToast.dismiss(toastId);

    if (result.success) {
      if (result.data?.url) {
        window.location.href = result.data.url;
      }
    } else {
      showToast.error(result.message || 'Google signup failed. Please try again.');
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
          <p className="brut-label text-[#B3101C]">Create account</p>
          <h1
            className="mt-4 text-[44px] leading-[0.95] tracking-tight uppercase sm:text-[64px]"
            style={serif}
          >
            Create an Account<span className="text-[#B3101C]">.</span>
          </h1>
          <p className="mt-5 text-[15px] leading-relaxed text-[#3F3830]">
            Let&apos;s get you started.
          </p>
        </header>

        <form onSubmit={handleSignup} className="mt-10">
          <div className="brut-rise" style={{ animationDelay: '0.08s' }}>
            <button
              type="button"
              className="brut-btn-paper brut-press gap-x-[8px]"
              onClick={handleGoogleSignup}
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
              <label htmlFor="username" className="brut-label mb-[8px] block">
                Username
              </label>
              <input
                id="username"
                type="text"
                className="brut-input"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div
              className="brut-rise grid grid-cols-2 gap-[12px] sm:gap-[16px]"
              style={{ animationDelay: '0.32s' }}
            >
              <div>
                <label
                  htmlFor="firstName"
                  className="brut-label mb-[8px] block"
                >
                  First Name
                </label>
                <input
                  id="firstName"
                  type="text"
                  className="brut-input"
                  autoComplete="given-name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label htmlFor="lastName" className="brut-label mb-[8px] block">
                  Last Name
                </label>
                <input
                  id="lastName"
                  type="text"
                  className="brut-input"
                  autoComplete="family-name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="brut-rise" style={{ animationDelay: '0.4s' }}>
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
            <div className="brut-rise" style={{ animationDelay: '0.48s' }}>
              <label htmlFor="password" className="brut-label mb-[8px] block">
                Password
              </label>
              <input
                id="password"
                type="password"
                className="brut-input"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          {/* The one thing we want pressed gets the ink plate. */}
          <div
            className="brut-rise mt-[32px]"
            style={{ animationDelay: '0.56s' }}
          >
            <button
              type="submit"
              className="brut-btn brut-press"
              disabled={isLoading}
            >
              {isLoading ? 'Signing Up...' : 'Sign Up'}
            </button>
          </div>

          <div
            className="brut-rise mt-[28px] text-center text-[13px] text-[#5C544A]"
            style={{ animationDelay: '0.64s' }}
          >
            Already have an account?{' '}
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
