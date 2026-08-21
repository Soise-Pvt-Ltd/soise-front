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
// Every live sale is badged, including one covering a single size — a
// discount nobody can see is money spent for nothing. What keeps that honest
// is the price beside it: the backend computes `card_price` across the whole
// purchasable census (each size at its sale price if it has one, its list
// price if not) and flags `card_is_from` when the sizes disagree. So a sale on
// one size reads "from ₦67,500" with a −25% badge, which is exactly true —
// ₦67,500 is reachable, just not in every size — and the shopper sees
// per-size prices on the product page. `card_original_price` is null when the
// cheapest size is not itself discounted, so nothing is struck through that
// was never reduced.

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
  /** What the catalog card should print, computed across every purchasable
   *  variant (sale price where there is one, list price otherwise). */
  card_price?: number | null;
  /** Struck-through price — null when the cheapest size is not itself
   *  discounted, so we never strike a number nobody reduced. */
  card_original_price?: number | null;
  card_is_from?: boolean | null;
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

  // `card_price` is preferred, but tolerate a backend that predates it: the
  // storefront and the API deploy independently, so there is always a window
  // where one is older than the other.
  const cardPrice = Number(sale?.card_price ?? sale?.sale_price);
  const saleApplies = !!sale && !expired && Number.isFinite(cardPrice) && cardPrice > 0;

  if (saleApplies) {
    const hasCardFields = sale!.card_price != null;
    const amount = cardPrice;

    const original = hasCardFields
      ? Number(sale!.card_original_price) || null
      : Number(sale!.original_price) || base || null;

    // The badge advertises the best discount available on the product. On a
    // partial sale that is deliberately not the discount on every size — the
    // "from" price beside it is what keeps the pair honest.
    const pct = Number(sale!.max_discount_pct ?? sale!.discount_pct);

    return {
      amount,
      isFrom: hasCardFields
        ? !!sale!.card_is_from
        : spread(
            variants
              .map((v) => Number(v?.sale_price))
              .filter((p) => Number.isFinite(p) && p > 0),
          ),
      originalAmount: original && original > amount ? original : null,
      discountPct: Number.isFinite(pct) ? Math.round(pct) : null,
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
