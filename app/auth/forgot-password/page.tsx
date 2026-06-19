'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Toaster } from 'sonner';
import { motion } from 'framer-motion';
import { showToast, validateField } from '@/lib/toast-utils';
import { requestRecoveryOtp } from './actions';

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
    <>
      <Toaster position="top-center" />
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
              <div className="text-[18px]">Recover your account</div>
              <div className="text-[14px] text-[#8E8E93]">
                Enter your email and we&apos;ll send you a one-time code to sign
                in. You can update your password afterwards from your account
                settings.
              </div>
            </div>
            <div className="space-y-4">
              <input
                type="email"
                className="solid"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                {isLoading ? 'Sending...' : 'Send recovery code'}
              </motion.button>
            </div>
            <div className="text-center text-sm text-[#8E8E93]">
              Remembered your password?{' '}
              <Link
                href="/auth/login"
                className="font-medium text-black underline"
              >
                Sign in
              </Link>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
