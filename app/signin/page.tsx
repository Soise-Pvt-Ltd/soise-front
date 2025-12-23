'use client';

import { useState } from 'react';
import axios, { isAxiosError } from 'axios';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

function Divider() {
  return (
    <div className="flex w-full items-center">
      <div className="h-px flex-grow bg-[#AEAEB2]"></div>
      <span className="px-3 text-[13px] text-[#8E8E93]">or</span>
      <div className="h-px flex-grow bg-[#AEAEB2]"></div>
    </div>
  );
}

export default function SigninPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSignin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Email and password are required.');
      return;
    }

    setIsLoading(true);

    try {
      await axios.post('/api/signin', { email, password });
      router.push('/');
    } catch (err) {
      if (isAxiosError(err)) {
        const responseData = err.response?.data;
        const errorMessage =
          responseData?.error ||
          responseData?.message ||
          'Invalid email or password.';

        if (
          errorMessage ===
          'Email not verified. Please verify your email before logging in.'
        ) {
          router.push(`/otp?email=${email}`);
          return;
        }

        setError(errorMessage);
      } else {
        setError('A network or unknown error occurred.');
      }
      console.error('Signin error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="mx-auto px-[16px] py-[100px] md:max-w-xl">
        <div className="mb-2 cursor-pointer" onClick={() => router.push('/')}>
          <Image src="/logo.png" alt="Soise Logo" width={100} height={58} />
        </div>
        <div className="auth">
          <form onSubmit={handleSignin}>
            <div className="gap-y-[16px] pb-[40px]">
              <div className="text-[18px]">Sign In</div>
              <div className="text-[14px] text-[#8E8E93]">
                Enter your email and password to sign in.
              </div>
            </div>
            <div>
              <div className="pt-[40px]">
                <button
                  type="button"
                  className="btn_black flex items-center justify-center gap-x-[4px]"
                >
                  <img src="/google.png" alt="google" className="size-[16px]" />
                  Continue with Google
                </button>
              </div>
              <div className="py-[16px]">
                <Divider />
              </div>
              <div className="space-y-4">
                <input
                  type="text"
                  className="solid"
                  placeholder="Email or Username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <input
                  type="password"
                  className="solid"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              {error && (
                <div className="mt-4 text-sm text-red-500">{error}</div>
              )}
              <button
                type="submit"
                className="btn_black !my-[36px]"
                disabled={isLoading}
              >
                {isLoading ? 'Signing In...' : 'Sign In'}
              </button>
              <div className="text-center text-sm text-[#8E8E93]">
                Don't have an account?{' '}
                <Link
                  href="/signup"
                  className="font-medium text-black underline"
                >
                  Sign up
                </Link>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
