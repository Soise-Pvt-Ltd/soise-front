'use client';

import { useEffect } from 'react';

/**
 * Cookie that holds a creator code arriving via a creator's share link
 * (`?code=...`). Auto-applied at the order summary so the creator is
 * attributed and the customer gets their discount without typing anything.
 * Distinct from `swaz_ref` (the customer store-credit referral token).
 */
export const PENDING_CREATOR_CODE_COOKIE = 'pending_creator_code';

/**
 * Captures referral params on ANY page load and persists them as cookies so
 * they survive until they're needed:
 *  - `?ref=CODE`  → `swaz_ref`, read by the register action and forwarded as
 *    `ref` to /auth/signup (customer-to-customer store-credit attribution).
 *  - `?code=CODE` → `pending_creator_code`, auto-applied at the order summary
 *    (creator-code discount + commission attribution).
 *
 * Lives in the shared Providers tree (not middleware) because the auth
 * middleware only runs on protected paths, whereas these links typically land
 * on public pages like "/".
 */
export default function RefCapture() {
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      // 30 days; lax so it persists across the normal signup/checkout nav.
      const maxAge = 60 * 60 * 24 * 30;

      const ref = params.get('ref');
      if (ref && ref.trim()) {
        document.cookie = `swaz_ref=${encodeURIComponent(
          ref.trim(),
        )}; path=/; max-age=${maxAge}; samesite=lax`;
      }

      const code = params.get('code');
      if (code && code.trim()) {
        document.cookie = `${PENDING_CREATOR_CODE_COOKIE}=${encodeURIComponent(
          code.trim().toUpperCase().slice(0, 50),
        )}; path=/; max-age=${maxAge}; samesite=lax`;
      }
    } catch {
      // non-fatal — referral attribution is best-effort
    }
  }, []);

  return null;
}
