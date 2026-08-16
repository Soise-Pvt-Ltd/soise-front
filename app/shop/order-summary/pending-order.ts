// A just-placed order whose payment redirect may not have landed. The order
// summary writes it before navigating to payment and offers a "Complete
// payment" resume if the shopper returns; the thank-you page clears it once
// payment is confirmed. Single source of truth so the writer and the clearer
// can never drift apart.
//
// Backed by localStorage, not sessionStorage: the most common way this recovery
// was needed — shopper bounces to the payment page, something goes wrong, they close the
// tab and come back later — is exactly the case sessionStorage throws away. The
// order and a payable URL still exist server-side, so the marker is what stands
// between them and a silently abandoned paid-for order.
export const PENDING_ORDER_KEY = 'soise_pending_order';

// Beyond this the order is stale enough that resuming is more confusing than
// helpful (price changes, stock, backend expiry).
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

type StoredPendingOrder = { id: string; at: number; secret?: string };

export function writePendingOrder(orderId: string, secret?: string) {
  if (!orderId || typeof window === 'undefined') return;
  try {
    const payload: StoredPendingOrder = { id: orderId, at: Date.now(), ...(secret ? { secret } : {}) };
    localStorage.setItem(PENDING_ORDER_KEY, JSON.stringify(payload));
  } catch {
    /* private mode / quota — recovery is best-effort */
  }
}

// The per-order secret stored alongside the pending id (guest checkouts only;
// signed-in orders never mint one). Needed to present X-Order-Token when the
// shopper reaches Step 2's shipping-address endpoint. Returns null for legacy
// bare-id markers, which predate secret storage.
export function readPendingOrderSecret(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(PENDING_ORDER_KEY) ?? '';
    if (!raw.startsWith('{')) return null;
    const parsed = JSON.parse(raw) as StoredPendingOrder;
    return parsed.secret ?? null;
  } catch {
    return null;
  }
}

export function readPendingOrder(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw =
      localStorage.getItem(PENDING_ORDER_KEY) ??
      // Carry over markers written by the previous sessionStorage-backed build
      // so an in-flight checkout isn't stranded by the deploy.
      sessionStorage.getItem(PENDING_ORDER_KEY);
    if (!raw) return null;

    // Older builds stored the bare id rather than a JSON envelope.
    if (!raw.startsWith('{')) return raw;

    const parsed = JSON.parse(raw) as StoredPendingOrder;
    if (!parsed?.id) return null;
    if (Date.now() - (parsed.at ?? 0) > MAX_AGE_MS) {
      clearPendingOrder();
      return null;
    }
    return parsed.id;
  } catch {
    return null;
  }
}

export function clearPendingOrder() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(PENDING_ORDER_KEY);
    sessionStorage.removeItem(PENDING_ORDER_KEY);
  } catch {
    /* nothing to do */
  }
}
