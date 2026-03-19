/**
 * Central source of truth for business / brand variables.
 * Server-only values use NEXT_PUBLIC_ prefix if they need to be readable
 * in client components; keep secret values without that prefix.
 */
export const siteConfig = {
  name: process.env.NEXT_PUBLIC_SITE_NAME ?? 'SOISE',
  supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? 'support@soise.ng',
  officeAddress: process.env.NEXT_PUBLIC_OFFICE_ADDRESS ?? 'Better Days, Heaven.',
  registrationNumber: process.env.NEXT_PUBLIC_COMPANY_REG_NUMBER ?? '1234567890',
  estimatedDelivery: process.env.NEXT_PUBLIC_ESTIMATED_DELIVERY ?? '3-5 business days',
  social: {
    instagram: process.env.NEXT_PUBLIC_INSTAGRAM_URL ?? 'https://instagram.com/soise',
    tiktok: process.env.NEXT_PUBLIC_TIKTOK_URL ?? 'https://tiktok.com/@soise',
    x: process.env.NEXT_PUBLIC_X_URL ?? 'https://x.com/soise',
  },
} as const;
