'use client';

import { useEffect } from 'react';

/**
 * Captures the TikTok click id (`ttclid`) that TikTok appends to the ad landing
 * URL (`?ttclid=...`) and stores it as a first-party cookie.
 *
 * Server actions that fire CAPI events forward this cookie to the API (see
 * lib/tracking.ts) so conversions can be attributed to the ad that drove the
 * visit. The base pixel already sets `_ttp` itself; this only fills in the
 * missing click id — without it, ad-driven AddToCart/Checkout/Purchase events
 * reach TikTok with no way to match them back to the ad.
 */
export default function TikTokClickId() {
  useEffect(() => {
    try {
      const ttclid = new URLSearchParams(window.location.search).get('ttclid');
      if (!ttclid) return;

      // Scope to the apex domain so api.soise.ng receives it too, and persist
      // for 7 days to cover TikTok's click-through attribution window. Stored
      // raw (not URL-encoded) so the backend forwards the exact value TikTok
      // issued.
      const onSoise = window.location.hostname.endsWith('soise.ng');
      const domain = onSoise ? '; Domain=.soise.ng' : '';
      const secure = window.location.protocol === 'https:' ? '; Secure' : '';
      const maxAge = 60 * 60 * 24 * 7;

      document.cookie = `ttclid=${ttclid}; Path=/; Max-Age=${maxAge}; SameSite=Lax${domain}${secure}`;
    } catch {
      /* attribution is best-effort — never break the page over it */
    }
  }, []);

  return null;
}
