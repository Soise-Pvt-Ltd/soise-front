/**
 * Central source of truth for business / brand variables.
 * Server-only values use NEXT_PUBLIC_ prefix if they need to be readable
 * in client components; keep secret values without that prefix.
 */
export const siteConfig = {
  name: process.env.NEXT_PUBLIC_SITE_NAME ?? 'SOISE',
  supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? 'hello@soise.ng',
  // Operating region shown in the footer. Hardcoded (not env-driven) so it
  // can't be overridden by a stale NEXT_PUBLIC_OFFICE_ADDRESS in the host env.
  officeAddress: 'Sub-Saharan Africa, Africa',
  // CAC registration (RC) number + TIN from the certificate of incorporation
  // (SOISE PVT. LTD, incorporated 15 Apr 2025). Hardcoded so they reflect the
  // real entity and can't be overridden by a stale host env var.
  registrationNumber: '8413888',
  tin: '33081024-0001',
  estimatedDelivery: process.env.NEXT_PUBLIC_ESTIMATED_DELIVERY ?? '3-5 business days',
  social: {
    instagram: process.env.NEXT_PUBLIC_INSTAGRAM_URL ?? 'https://instagram.com/soise',
    tiktok: process.env.NEXT_PUBLIC_TIKTOK_URL ?? 'https://tiktok.com/@soise',
    x: process.env.NEXT_PUBLIC_X_URL ?? 'https://x.com/soise',
  },
} as const;
