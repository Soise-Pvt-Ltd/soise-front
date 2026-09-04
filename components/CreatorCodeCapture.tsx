'use client';

import { useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

/**
 * Cookie that holds a creator code arriving via a share link (`?code=...`).
 * It is auto-applied at the order summary so the creator gets attributed and
 * the customer gets their discount without typing anything.
 *
 * NOTE: param is `code` (NOT `ref`/`referral_code`, which the customer
 * store-credit referral loop already claims at signup).
 */
export const PENDING_CREATOR_CODE_COOKIE = 'pending_creator_code';

export default function CreatorCodeCapture() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const raw = searchParams.get('code');
    if (!raw) return;

    const code = raw.trim().toUpperCase().slice(0, 50);
    if (!code) return;

    // Persist for 30 days so it survives browsing → checkout.
    document.cookie = `${PENDING_CREATOR_CODE_COOKIE}=${encodeURIComponent(
      code,
    )}; path=/; max-age=${60 * 60 * 24 * 30}; samesite=lax`;

    // Strip the param so it doesn't linger in copied/shared URLs.
    const params = new URLSearchParams(searchParams.toString());
    params.delete('code');
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [searchParams, pathname, router]);

  return null;
}
