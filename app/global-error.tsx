'use client';

import { useEffect } from 'react';

// global-error replaces the root layout, so it cannot rely on globals.css or
// shared components being present. Keep it fully self-contained with inline
// styles so it renders even when the app shell itself failed.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global error boundary:', error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '0 24px',
          fontFamily:
            'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
          color: '#121212',
          background: '#ffffff',
        }}
      >
        <p
          style={{
            fontSize: 13,
            fontWeight: 500,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            color: '#8E8E93',
          }}
        >
          Something went wrong
        </p>
        <h1 style={{ fontSize: 40, margin: '16px 0 0', fontWeight: 600 }}>
          We hit an unexpected error
        </h1>
        <p style={{ marginTop: 12, maxWidth: 420, fontSize: 14, color: '#8E8E93' }}>
          Sorry about that. Please try again.
        </p>
        <button
          onClick={() => reset()}
          style={{
            marginTop: 32,
            height: 53,
            width: '100%',
            maxWidth: 320,
            cursor: 'pointer',
            borderRadius: 10,
            border: 'none',
            background: '#121212',
            color: '#fff',
            fontSize: 13,
            fontWeight: 700,
            textTransform: 'uppercase',
          }}
        >
          Try Again
        </button>
      </body>
    </html>
  );
}
