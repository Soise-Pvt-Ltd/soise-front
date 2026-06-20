'use client';

import { useEffect, useState } from 'react';

/**
 * The user-facing brand mark. Soise has two public faces — the bold oval badge
 * (logo.png) and the refined muse-in-meander emblem (swz.jpg) — and we show them
 * alternately each visit so the brand feels alive without ever exposing the
 * formal main-logo (which is reserved for the internal admin / team surfaces).
 *
 * Height-driven so the two different aspect ratios (oval vs square emblem) sit at
 * a consistent height. Chosen on the client after mount to avoid hydration
 * mismatch; the slot reserves space so there's no layout shift.
 */
const MARKS = ['/logo.png', '/swz.jpg'];

export default function BrandMark({
  height = 52,
  className = '',
}: {
  height?: number;
  className?: string;
}) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let n = 0;
    try {
      n = Number(localStorage.getItem('soise_mark') || '0');
      localStorage.setItem('soise_mark', String((n + 1) % 1000));
    } catch {
      n = Math.random() < 0.5 ? 0 : 1;
    }
    setSrc(MARKS[n % MARKS.length]);
  }, []);

  return (
    <span
      className={`inline-flex items-center justify-center ${className}`}
      style={{ height, minWidth: height }}
      aria-label="Soise"
    >
      {src && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt="Soise"
          style={{ height: '100%', width: 'auto', objectFit: 'contain' }}
        />
      )}
    </span>
  );
}
