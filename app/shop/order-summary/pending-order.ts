// Shared sessionStorage key for a just-placed order whose Paystack redirect may
// not have landed. The order-summary page writes it before navigating to
// Paystack and offers a "Complete payment" resume if the shopper returns; the
// thank-you page clears it once payment is confirmed. Single source of truth so
// the writer and the clearer can never drift apart.
export const PENDING_ORDER_KEY = 'soise_pending_order';
