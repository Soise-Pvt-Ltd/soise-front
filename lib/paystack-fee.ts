/**
 * Paystack's transaction fee, as charged to the customer.
 *
 * This account has "pass transaction fee to customer" enabled, so Paystack
 * collects more than the order total. Before this existed the storefront quoted
 * one number and the payment step asked for another — an unexpected cost at
 * payment is the most-cited reason people abandon checkout, and every order
 * this store has ever created died at exactly that step.
 *
 * The model is NOT `amount * 1.5% + 100`. Paystack grosses up so the merchant
 * still nets the full order value after its own percentage is taken:
 *
 *     charge = (amount + flat) / (1 - 0.015)
 *
 * Verified against Paystack's live checkout at two amounts — one below the fee
 * cap and one above it, which is what makes the pair meaningful:
 *
 *     ₦90,000   -> Paystack asked for ₦91,472.09   (uncapped; gross-up applies)
 *     ₦150,000  -> Paystack asked for ₦152,000.00  (fee capped at ₦2,000)
 *
 * The naive formula predicts ₦91,450 for the first, so the observed value rules
 * it out. If Paystack changes its pricing these constants must change with it;
 * a stale fee here reintroduces the very mismatch it exists to remove.
 *
 * Sources: Paystack support "Transactions pricing" (1.5% + ₦100, capped at
 * ₦2,000, the ₦100 waived below ₦2,500).
 */

/** Percentage Paystack takes on local transactions. */
const RATE = 0.015;
/** Flat component, waived on small transactions. */
const FLAT = 100;
/** The fee never exceeds this, however large the order. */
const CAP = 2000;
/** Below this order value the flat ₦100 is not charged. */
const FLAT_WAIVER_BELOW = 2500;

/** Round up to the kobo — Paystack showed ₦91,472.09 for a ₦91,472.081 charge. */
function ceilToKobo(value: number): number {
  return Math.ceil(value * 100) / 100;
}

/**
 * What Paystack adds on top of `amount` (NGN), as the customer will see it.
 *
 * Returns 0 for a non-positive amount, so an order fully covered by store
 * credit — which never reaches Paystack — shows no fee.
 */
export function paystackFee(amount: number): number {
  if (!Number.isFinite(amount) || amount <= 0) return 0;

  const flat = amount < FLAT_WAIVER_BELOW ? 0 : FLAT;
  const grossedUp = ceilToKobo((amount + flat) / (1 - RATE));
  const fee = ceilToKobo(grossedUp - amount);

  return Math.min(fee, CAP);
}

/** The total the customer is actually charged. */
export function totalWithPaystackFee(amount: number): number {
  return ceilToKobo(amount + paystackFee(amount));
}
