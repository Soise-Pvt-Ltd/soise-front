// Compute the price to show on a product card.
//
// `base_price` is only a fallback/default — the actual purchasable prices live
// on the variants. Showing `base_price` when it's lower than every variant
// (e.g. base 85k but variants 90–100k) advertises a price the customer can't
// actually buy at. So: when variants have prices, show the MINIMUM variant
// price. Flag it "from" only when variants genuinely span a range - a base/
// variant mismatch alone isn't a range, and labeling a single fixed price as
// "from X" implies options the shopper won't find on the product page.
//
// Flash sales ride on the same rule, with one extra condition. A sale can
// cover a single size, and the card shows the MINIMUM price — so badging a
// partial sale would advertise a discount that exists on one size, possibly a
// sold-out one, and the price climbs when the shopper picks their actual size.
// The backend already decides this and sends `sale.coverage`: only "all"
// (every purchasable variant discounted) changes the card. A "partial" sale is
// real and still discounts at checkout — it just prices itself on the product
// page, per size, where the shopper can see which sizes it applies to.

export interface ProductSale {
  id?: string;
  name?: string;
  /** "all" = every purchasable variant discounted; "partial" = some sizes only. */
  coverage?: 'all' | 'partial';
  /** Discount on the variant that sets the displayed price. */
  discount_pct?: number | null;
  max_discount_pct?: number | null;
  /** Soonest end across covering sales — never promises more time than exists. */
  ends_at?: string | null;
  sale_price?: number | null;
  original_price?: number | null;
  variants_on_sale?: number | null;
  variants_total?: number | null;
}

export interface PricedProduct {
  base_price?: number | null;
  sale?: ProductSale | null;
  sample_variants?: Array<{
    price?: number | null;
    sale_price?: number | null;
  } | null> | null;
}

export interface DisplayPrice {
  /** What to render large — the sale price when one applies. */
  amount: number;
  isFrom: boolean;
  /** List price to strike through, or null when nothing is on sale. */
  originalAmount: number | null;
  /** Whole-number percentage for the badge, or null. */
  discountPct: number | null;
  onSale: boolean;
  saleEndsAt: string | null;
}

function spread(values: number[]): boolean {
  return values.length > 0 && Math.min(...values) !== Math.max(...values);
}

/**
 * @param now Client wall-clock (see lib/use-now.ts), or null/undefined on the
 *   server. When supplied, a sale whose `ends_at` has passed is ignored — the
 *   catalog is ISR'd at 60s, so a cached page can outlive the sale it renders,
 *   and quoting a price checkout won't honour is worse than a stale full price.
 */
export function getDisplayPrice(
  product: PricedProduct,
  now?: number | null,
): DisplayPrice {
  const variants = product?.sample_variants ?? [];

  const variantPrices = variants
    .map((v) => Number(v?.price))
    .filter((p) => Number.isFinite(p) && p > 0);

  const base = Number(product?.base_price) || 0;
  const sale = product?.sale;

  // Only a sale covering every purchasable variant is allowed to move the card.
  const expired =
    typeof now === 'number' && !!sale?.ends_at
      ? new Date(sale.ends_at).getTime() <= now
      : false;

  const saleApplies =
    !!sale &&
    !expired &&
    sale.coverage === 'all' &&
    Number.isFinite(Number(sale.sale_price)) &&
    Number(sale.sale_price) > 0;

  if (saleApplies) {
    const salePrices = variants
      .map((v) => Number(v?.sale_price))
      .filter((p) => Number.isFinite(p) && p > 0);

    const amount = salePrices.length ? Math.min(...salePrices) : Number(sale!.sale_price);
    const original = Number(sale!.original_price) || base || null;

    return {
      amount,
      // "from" tracks the sale prices now, since those are what's displayed.
      isFrom: spread(salePrices),
      originalAmount: original && original > amount ? original : null,
      discountPct: Number.isFinite(Number(sale!.discount_pct))
        ? Math.round(Number(sale!.discount_pct))
        : null,
      onSale: true,
      saleEndsAt: sale!.ends_at ?? null,
    };
  }

  const noSale = { originalAmount: null, discountPct: null, onSale: false, saleEndsAt: null };

  if (variantPrices.length === 0) {
    return { amount: base, isFrom: false, ...noSale };
  }

  return { amount: Math.min(...variantPrices), isFrom: spread(variantPrices), ...noSale };
}

/**
 * What one unit of a variant actually costs right now.
 *
 * The bag and the checkout total both go through here so a sale can't show on
 * the product page and quietly vanish in the cart. `sale_price` is only
 * honoured when it genuinely undercuts `price` — a malformed or stale value
 * must never raise the price.
 */
export function effectiveUnitPrice(variant?: {
  price?: number | null;
  sale_price?: number | null;
} | null): number {
  const list = Number(variant?.price) || 0;
  const sale = Number(variant?.sale_price) || 0;
  return sale > 0 && sale < list ? sale : list;
}
