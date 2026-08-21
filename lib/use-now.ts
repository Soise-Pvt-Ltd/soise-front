'use client';

import { useEffect, useState } from 'react';

/**
 * The wall clock, as React state.
 *
 * Returns `null` until mounted, so server render and first client paint agree
 * — reading the clock during render is non-idempotent and makes hydration
 * non-deterministic.
 *
 * Exists because the catalog and product pages are ISR'd with
 * `revalidate = 60`: for up to a minute after a flash sale ends, a cached page
 * can still be serving the sale price while checkout — which enforces the
 * window server-side — correctly charges full price. Showing a price we won't
 * honour is the one direction of that mismatch that costs trust, so the
 * pricing helpers take this clock and drop an expired sale immediately.
 */
export function useNow(intervalMs = 30_000): number | null {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const id = setInterval(tick, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}
