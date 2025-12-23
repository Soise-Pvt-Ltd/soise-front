'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios, { isAxiosError } from 'axios';
import { Toaster, toast } from 'sonner';

function Divider() {
  return (
    <div className="flex w-full items-center">
      <div className="h-px flex-grow bg-[#AEAEB2]"></div>
      <span className="px-3 text-[13px] text-[#8E8E93]">or</span>
      <div className="h-px flex-grow bg-[#AEAEB2]"></div>
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

    if (!email || !password || !username || !firstName || !lastName) {
      toast.error('All fields are required.');
      return;
    }

    setIsLoading(true);

    try {
      // Assuming the signup endpoint creates the user and sends an OTP
      await axios.post('/api/signup', {
        email,
        password,
        username,
        firstName,
        lastName,
      });

      // On successful submission, redirect to OTP page with email
      router.push(`/otp?email=${email}`);
    } catch (err) {
      if (isAxiosError(err)) {
        const errorMessage =
          err.response?.data?.error || 'An unexpected error occurred.';
        toast.error(errorMessage);
      } else {
        toast.error('A network or unknown error occurred.');
      }
      console.error('Signup error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Toaster position="top-center" />
      <div className="mx-auto px-[16px] py-[100px] md:max-w-xl">
        <div className="mb-2 cursor-pointer" onClick={() => router.push('/')}>
          <Image src="/logo.png" alt="Soise Logo" width={100} height={58} />
        </div>
        <div className="auth">
          <form onSubmit={handleSignup}>
            <div className="gap-y-[16px] pb-[40px]">
              <div className="text-[18px]">Create an Account</div>
              <div className="text-[14px] text-[#8E8E93]">
                Let's get you started.
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
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
                <div className="flex gap-4">
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
                </div>
                <input
                  type="email"
                  className="solid"
                  placeholder="Email"
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
              <button
                type="submit"
                className="btn_black !my-[36px]"
                disabled={isLoading}
              >
                {isLoading ? 'Signing Up...' : 'Sign Up'}
              </button>
              <div className="text-center text-sm text-[#8E8E93]">
                Already have an account?{' '}
                <Link
                  href="/signin"
                  className="font-medium text-black underline"
                >
                  Sign in
                </Link>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
