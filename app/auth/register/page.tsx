'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Toaster } from 'sonner';
import { register } from './actions';
import { googleAuth } from '../google/actions';
import { motion } from 'framer-motion';
import { showToast, validateField } from '@/lib/toast-utils';

function Divider() {
  return (
    <div className="flex w-full items-center">
      <div className="h-px flex-grow bg-[#AEAEB2]"></div>
      <span className="px-3 text-[13px] text-[#8E8E93]">or</span>
      <div className="h-px flex-grow bg-[#AEAEB2]"></div>
    </div>
  );
}

const staggerItem = {
  hidden: { opacity: 0, y: 20 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  }),
};

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
          <form onSubmit={handleSignup}>
            <motion.div
              className="gap-y-[16px] pb-[40px]"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="text-[18px]">Create an Account</div>
              <div className="text-[14px] text-[#8E8E93]">
                Let&apos;s get you started.
              </div>
            </motion.div>
            <div>
              <motion.div
                className="pt-[40px]"
                custom={0}
                variants={staggerItem}
                initial="hidden"
                animate="show"
              >
                <motion.button
                  type="button"
                  className="btn_black flex items-center justify-center gap-x-[4px]"
                  onClick={handleGoogleSignup}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <img src="/google.png" alt="google" className="size-[16px]" />
                  Continue with Google
                </motion.button>
              </motion.div>
              <motion.div
                className="py-[16px]"
                custom={1}
                variants={staggerItem}
                initial="hidden"
                animate="show"
              >
                <Divider />
              </motion.div>
              <div className="space-y-4">
                <motion.div
                  custom={2}
                  variants={staggerItem}
                  initial="hidden"
                  animate="show"
                >
                  <input
                    type="text"
                    className="solid"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </motion.div>
                <motion.div
                  className="flex gap-4"
                  custom={3}
                  variants={staggerItem}
                  initial="hidden"
                  animate="show"
                >
                  <input
                    type="text"
                    className="solid flex-1"
                    placeholder="First Name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                  />
                  <input
                    type="text"
                    className="solid flex-1"
                    placeholder="Last Name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                  />
                </motion.div>
                <motion.div
                  custom={4}
                  variants={staggerItem}
                  initial="hidden"
                  animate="show"
                >
                  <input
                    type="email"
                    className="solid"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </motion.div>
                <motion.div
                  custom={5}
                  variants={staggerItem}
                  initial="hidden"
                  animate="show"
                >
                  <input
                    type="password"
                    className="solid"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </motion.div>
              </div>
              <motion.div
                custom={6}
                variants={staggerItem}
                initial="hidden"
                animate="show"
              >
                <motion.button
                  type="submit"
                  className="btn_black !my-[36px]"
                  disabled={isLoading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                >
                  {isLoading ? 'Signing Up...' : 'Sign Up'}
                </motion.button>
              </motion.div>
              <motion.div
                className="text-center text-sm text-[#8E8E93]"
                custom={7}
                variants={staggerItem}
                initial="hidden"
                animate="show"
              >
                Already have an account?{' '}
                <Link
                  href="/auth/login"
                  className="font-medium text-black underline"
                >
                  Sign in
                </Link>
              </motion.div>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
