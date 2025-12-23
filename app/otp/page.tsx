'use client';

import { useState, Suspense, useEffect } from 'react';
import axios, { isAxiosError } from 'axios';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';

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
        router.replace('/signup');
      }
    }
  }, [email, router]);

  if (!email) {
    return (
      <div className="mx-auto px-[16px] py-[100px] text-center md:max-w-xl">
        Loading...
      </div>
    );
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // API call to verify OTP
      await axios.post(
        `${process.env.NEXT_PUBLIC_BASE_URL}/auth/verify-email`,
        { code: otp, email },
      );
      // On success, redirect to signin page to log in
      router.push('/signin');
    } catch (err) {
      if (isAxiosError(err)) {
        const responseData = err.response?.data;
        const errorMessage =
          responseData?.message ||
          responseData?.error ||
          'OTP verification failed.';

        if (errorMessage === 'Invalid or expired verification code') {
          try {
            await axios.post(
              `${process.env.NEXT_PUBLIC_BASE_URL}/api/resend-otp`,
              { email },
            );
            setError(
              'Invalid or expired code. A new code has been sent to your email.',
            );
            setOtp('');
          } catch (resendErr) {
            setError('Invalid or expired code. Failed to resend new code.');
          }
        } else {
          setError(errorMessage);
        }
      } else {
        setError('OTP verification failed. Please try again.');
      }
      console.error('OTP submission error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setError(null);
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_BASE_URL}/api/resend-otp`, {
        email,
      });
      setError('A new code has been sent to your email.');
    } catch (err) {
      if (isAxiosError(err)) {
        setError(err.response?.data?.message || 'Failed to resend code.');
      }
    }
  };

  return (
    <div className="mx-auto px-[16px] py-[100px] md:max-w-xl">
      <div className="mb-2 cursor-pointer" onClick={() => router.push('/')}>
        <Image src="/logo.png" alt="Soise Logo" width={100} height={58} />
      </div>
      <div className="auth">
        <form onSubmit={handleVerify}>
          <div className="gap-y-[16px] pb-[40px]">
            <div className="text-[18px]">Enter Verification Code</div>
            <div className="text-[14px] text-[#8E8E93]">
              A code has been sent to <strong>{email}</strong>
            </div>
          </div>
          <input
            type="text"
            className="solid"
            placeholder="6-Digit Code"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            maxLength={6}
            required
          />
          {error && <div className="mt-2 text-sm text-red-500">{error}</div>}
          <button
            type="submit"
            className="btn_black !my-[36px]"
            disabled={isLoading}
          >
            {isLoading ? 'Verifying...' : 'Verify Account'}
          </button>
          <div className="text-center text-sm text-[#8E8E93]">
            Didn't receive code?{' '}
            <button
              type="button"
              onClick={handleResend}
              className="cursor-pointer font-medium text-black underline"
            >
              Resend
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function OtpPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto px-[16px] pt-[100px] text-center md:max-w-xl">
          Loading...
        </div>
      }
    >
      <OtpFormComponent />
    </Suspense>
  );
}
