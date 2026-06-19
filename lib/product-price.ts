// Compute the price to show on a product card.
//
// `base_price` is only a fallback/default — the actual purchasable prices live
// on the variants. Showing `base_price` when it's lower than every variant
// (e.g. base 85k but variants 90–100k) advertises a price the customer can't
// actually buy at. So: when variants have prices, show the MINIMUM variant
// price, flagged as "from" whenever there's a spread or it differs from base.

export interface PricedProduct {
  base_price?: number | null;
  sample_variants?: Array<{ price?: number | null } | null> | null;
}

export function getDisplayPrice(product: PricedProduct): {
  amount: number;
  isFrom: boolean;
} {
  const variantPrices = (product?.sample_variants ?? [])
    .map((v) => Number(v?.price))
    .filter((p) => Number.isFinite(p) && p > 0);

  const base = Number(product?.base_price) || 0;

  if (variantPrices.length === 0) {
    return { amount: base, isFrom: false };
  }

  const min = Math.min(...variantPrices);
  const max = Math.max(...variantPrices);
  // "from" when variants span a range, or the cheapest variant differs from base.
  const isFrom = max !== min || min !== base;
  return { amount: min, isFrom };
}
