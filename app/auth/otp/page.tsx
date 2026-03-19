'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Toaster } from 'sonner';
import Image from 'next/image';
import { verifyOtp, resendOtp } from './actions';
import { showToast, validateField } from '@/lib/toast-utils';

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
