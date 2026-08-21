/**
 * Mirrors app/domain/flash_sales.py `sale_price` so an operator sees the exact
 * figure the shopper will be charged, naira flooring included.
 *
 * Shared by the campaign page and the in-product quick-sale panel: two copies
 * of a money rule is two chances for the admin preview to disagree with the
 * charge. If the backend rule ever changes, this is the single line to follow.
 */
export function previewSalePrice(base: number, pct: number): number {
  if (!base || !pct || pct <= 0) return base || 0;
  const raw = (base * (100 - pct)) / 100;
  return raw >= 1000 ? Math.floor(raw / 100) * 100 : Math.round(raw * 100) / 100;
}

export const ngn = (n: number) =>
  `₦${(Number(n) || 0).toLocaleString('en-NG', { maximumFractionDigits: 0 })}`;
