'use client';

import { useEffect } from 'react';

/**
 * Captures a `?ref=CODE` query param on ANY page load and persists it in the
 * `swaz_ref` cookie so it survives until the visitor signs up. The register
 * server action reads this cookie and forwards it as `ref` to /auth/signup,
 * attributing the new user to whoever referred them.
 *
 * Lives in the shared Providers tree (not middleware) because the auth
 * middleware only runs on protected paths, whereas referral links typically
 * land on public pages like "/".
 */
export default function RefCapture() {
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const ref = params.get('ref');
      if (ref && ref.trim()) {
        // 30 days; lax so it persists across the normal signup navigation.
        const maxAge = 60 * 60 * 24 * 30;
        document.cookie = `swaz_ref=${encodeURIComponent(
          ref.trim(),
        )}; path=/; max-age=${maxAge}; samesite=lax`;
      }
    } catch {
      // non-fatal — referral attribution is best-effort
    }
  }, []);

  return null;
}
