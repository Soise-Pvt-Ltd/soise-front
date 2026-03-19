'use client';
import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Toaster } from 'sonner';
import Image from 'next/image';
import { showToast } from '@/lib/toast-utils';

function AuthSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const handleGoogleCallback = async () => {
      const accessToken = searchParams.get('access_token');
      const userId = searchParams.get('user_id');

      if (!accessToken) {
        showToast.error('Authentication failed - no access token received');
        setTimeout(() => router.push('/auth/login'), 2000);
        return;
      }

      const toastId = showToast.loading('Completing sign in...');

      try {
        const response = await fetch('/api/auth/google/callback', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ accessToken, userId }),
        });

        const result = await response.json();

        showToast.dismiss(toastId);

        if (result.success) {
          showToast.success('Successfully signed in!');
          setTimeout(() => {
            router.push('/');
            router.refresh();
          }, 1000);
        } else {
          showToast.error(result.message || 'Authentication failed. Please try again.');
          setTimeout(() => router.push('/auth/login'), 2000);
        }
      } catch (error) {
        showToast.dismiss(toastId);
        console.error('Error processing Google callback:', error);
        showToast.error('An error occurred during authentication. Please try again.');
        setTimeout(() => router.push('/auth/login'), 2000);
      } finally {
        setIsProcessing(false);
      }
    };

    handleGoogleCallback();
  }, [searchParams, router]);

  return (
    <>
      <Toaster position="top-center" />
      <div className="flex min-h-screen flex-col items-center justify-center px-4">
        <div className="mb-8">
          <Image src="/logo.png" alt="Soise Logo" width={100} height={58} />
        </div>
        <div className="text-center">
          {isProcessing ? (
            <>
              <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
              <p className="text-lg">Completing sign in...</p>
            </>
          ) : (
            <p className="text-lg">Redirecting...</p>
          )}
        </div>
      </div>
    </>
  );
}

export default function AuthSuccessPage() {
  return (
    <Suspense fallback={<div></div>}>
      <AuthSuccessContent />
    </Suspense>
  );
}
