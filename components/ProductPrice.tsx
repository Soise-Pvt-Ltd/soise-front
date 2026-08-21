'use client';

import { useCurrency } from '@/lib/currency-context';
import { getDisplayPrice, type PricedProduct } from '@/lib/product-price';

/**
 * One product price, rendered the same way everywhere it appears.
 *
 * This exists because it did NOT, and the surfaces drifted. The catalog card
 * and product page were taught about flash sales; the home-page carousel and
 * the nav's search results were not. Both called getDisplayPrice but
 * destructured only `{ amount, isFrom }`, so a live sale silently lowered the
 * number with nothing to say why — a shopper saw the tracksuit at ₦112,500 on
 * the home page with no struck-through ₦150,000 and no badge. That is worse
 * than not discounting at all: the margin is spent and the persuasion isn't
 * bought, and the price appears to change for no reason between two pages.
 *
 * Anything that shows a product price should use this rather than formatting
 * `amount` itself.
 */
export function ProductPrice({
  product,
  now = null,
  className = '',
}: {
  product: PricedProduct;
  /** Client clock from useNow(); drops a sale whose window has closed. */
  now?: number | null;
  className?: string;
}) {
  const { formatPrice } = useCurrency();
  const { amount, isFrom, originalAmount } = getDisplayPrice(product, now);

  return (
    <span className={className}>
      {isFrom && (
        <span className="font-sans mr-1 text-[11px] font-normal text-[#8E8E93]">
          from
        </span>
      )}
      {/* The old price is the argument for the new one, so it has to be
          legible rather than hidden. */}
      {originalAmount !== null && (
        <span className="mr-[6px] font-normal text-[#8E8E93] line-through">
          {formatPrice(originalAmount)}
        </span>
      )}
      <span className={originalAmount !== null ? 'text-[#B3101C]' : undefined}>
        {formatPrice(amount)}
      </span>
    </span>
  );
}

/**
 * The corner flag. Renders nothing unless a sale covers every purchasable
 * variant — see lib/product-price.ts for why a partial sale must not badge.
 */
export function SaleBadge({
  product,
  now = null,
  className = '',
}: {
  product: PricedProduct;
  now?: number | null;
  className?: string;
}) {
  const { onSale, discountPct } = getDisplayPrice(product, now);
  if (!onSale || !discountPct) return null;

  return (
    <span
      className={`bg-[#B3101C] px-[6px] py-[2px] text-[11px] font-bold tracking-[0.14em] text-white uppercase ${className}`}
    >
      −{discountPct}%
    </span>
  );
}
