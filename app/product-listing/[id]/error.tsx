'use client'; // Error components must be Client Components

import { useEffect } from 'react';
import ErrorDisplay from '@/components/ErrorDisplay';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <ErrorDisplay
      title="Product Not Found"
      message="Sorry, we couldn't find the product you were looking for."
      buttonText="Back to Products"
      onButtonClick={() => (window.location.href = '/product-listing')}
    />
  );
}
