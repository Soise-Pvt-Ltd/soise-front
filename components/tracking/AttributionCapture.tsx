'use client';

import { useEffect } from 'react';

/**
 * Persists the ad-attribution fingerprint of the visit as a first-party cookie
 * so the ORDER RECORD itself can say which platform bought it.
 *
 * Every ad we run carries utm_source/utm_campaign/utm_content, and the
 * platforms append their click ids (fbclid, ttclid) — but none of that ever
 * reached the database, so when the first stranger checkout landed (order #24,
 * 17 Aug 2026) neither platform's reporting claimed it and the question
 * "was it TikTok or Meta?" had no ground-truth answer. This closes that gap:
 * last ad touch wins, checkout forwards the cookie (lib/tracking.ts), and the
 * backend stamps it into checkout_metadata.attribution on the order.
 */
export default function AttributionCapture() {
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const touch: Record<string, string> = {};
      for (const key of [
        'utm_source',
        'utm_medium',
        'utm_campaign',
        'utm_content',
        'fbclid',
        'ttclid',
      ]) {
        const value = params.get(key);
        if (value) touch[key] = value.slice(0, 256);
      }
      // Only an actual ad landing overwrites the stored touch — organic page
      // views between the click and the checkout must not erase it.
      if (!touch.utm_source && !touch.fbclid && !touch.ttclid) return;
      touch.landed_at = new Date().toISOString();

      const onSoise = window.location.hostname.endsWith('soise.ng');
      const domain = onSoise ? '; Domain=.soise.ng' : '';
      const secure = window.location.protocol === 'https:' ? '; Secure' : '';
      const maxAge = 60 * 60 * 24 * 30;

      document.cookie = `soise_attrib=${encodeURIComponent(
        JSON.stringify(touch),
      )}; Path=/; Max-Age=${maxAge}; SameSite=Lax${domain}${secure}`;
    } catch {
      /* attribution is best-effort — never break the page over it */
    }
  }, []);

  return null;
}
