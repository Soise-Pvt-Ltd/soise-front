'use client';

import { Suspense, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Toaster } from 'sonner';
import { motion } from 'framer-motion';
import { showToast } from '@/lib/toast-utils';
import { requestRecoveryOtp, verifyRecoveryOtp } from '../actions';

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
    <div className="mx-auto px-[16px] py-[100px] md:max-w-xl">
      <motion.div
        className="mb-2 cursor-pointer"
        onClick={() => router.push('/')}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <Image src="/logo.png" alt="Soise Logo" width={100} height={58} />
      </motion.div>
      <div className="auth">
        <form onSubmit={handleSubmit}>
          <div className="gap-y-[16px] pb-[40px]">
            <div className="text-[18px]">Enter your code</div>
            <div className="text-[14px] text-[#8E8E93]">
              We sent a one-time code to{' '}
              <span className="font-medium text-black">
                {email || 'your email'}
              </span>
              . Enter it below to sign in.
            </div>
          </div>
          <div className="space-y-4">
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              className="solid tracking-[0.4em]"
              placeholder="------"
              value={code}
              onChange={(e) =>
                setCode(e.target.value.replace(/\D/g, '').slice(0, 6))
              }
              required
              autoFocus
            />
            <motion.button
              type="submit"
              className="btn_black !my-[36px]"
              disabled={isLoading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
            >
              {isLoading ? 'Verifying...' : 'Verify & sign in'}
            </motion.button>
          </div>
          <div className="text-center text-sm text-[#8E8E93]">
            Didn&apos;t get a code?{' '}
            <button
              type="button"
              onClick={handleResend}
              disabled={isResending}
              className="font-medium text-black underline disabled:opacity-50"
            >
              {isResending ? 'Resending...' : 'Resend'}
            </button>
            <span className="mx-2">·</span>
            <Link
              href="/auth/forgot-password"
              className="font-medium text-black underline"
            >
              Use a different email
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function NewPasswordPage() {
  return (
    <>
      <Toaster position="top-center" />
      <Suspense fallback={null}>
        <RecoveryCodeForm />
      </Suspense>
    </>
  );
}
