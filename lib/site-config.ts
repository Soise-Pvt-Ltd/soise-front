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
  officeAddress: 'Sub-Saharan Africa',
  // CAC registration (RC) number from the certificate of incorporation
  // (SOISE PVT. LTD, incorporated 15 Apr 2025). Hardcoded so it reflects the
  // real entity and can't be overridden by a stale host env var.
  registrationNumber: '8413888',
  estimatedDelivery: process.env.NEXT_PUBLIC_ESTIMATED_DELIVERY ?? '3-5 business days',
  // One human on the other end. The local number is what a Nigerian shopper
  // dials; the international form is what wa.me needs. Hardcoded so the three
  // places that used to carry their own copy of it can never disagree.
  phone: '0813 575 7947',
  phoneHref: 'tel:08135757947',
  whatsapp: '2348135757947',
  // Mon–Sat, 9:00–18:00 WAT — the hours the number is actually answered.
  hours: 'Mon–Sat · 9:00–18:00 WAT',
  social: {
    instagram: process.env.NEXT_PUBLIC_INSTAGRAM_URL ?? 'https://www.instagram.com/soise.ng',
    tiktok: process.env.NEXT_PUBLIC_TIKTOK_URL ?? 'https://www.tiktok.com/@soise.ng',
    x: process.env.NEXT_PUBLIC_X_URL ?? 'https://x.com/soise_ng',
    swazChannel:
      process.env.NEXT_PUBLIC_SWAZ_CHANNEL_URL ??
      'https://www.instagram.com/channel/AbYt4--G-jL1eyFC/',
  },
} as const;

/** A WhatsApp deep link to the store, optionally with a prefilled message. */
export function whatsappUrl(text?: string): string {
  const base = `https://wa.me/${siteConfig.whatsapp}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}
