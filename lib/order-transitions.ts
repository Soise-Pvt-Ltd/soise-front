/**
 * Mirrors VALID_ORDER_TRANSITIONS in the backend (app/domain/admin.py).
 *
 * Shared because it used to be duplicated: the Orders page had it right, while
 * the home dashboard's quick-action menu carried its own table offering
 * `created -> processing` and `paid -> shipped`. The backend rejects both, so
 * those menu items 400'd every time.
 */
export const VALID_ORDER_TRANSITIONS: Record<string, string[]> = {
  created: ['pending_payment', 'cancelled'],
  pending_payment: ['paid', 'cancelled'],
  paid: ['processing', 'cancelled', 'refunded'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: ['refunded'],
  cancelled: [],
  refunded: [],
};

/**
 * Transitions that carry customer-facing side effects and need details a
 * one-click menu can't collect.
 *
 * `shipped` needs a tracking number and carrier; `delivered` needs a date. The
 * backend defaults them to "N/A" and a tracking URL of "#", then emails that
 * to the customer — so a one-click "Mark as shipped" sends a shipping
 * confirmation with a dead link. These belong behind the Orders page's modals.
 */
export const TRANSITIONS_NEEDING_DETAILS = ['shipped', 'delivered'] as const;

export function quickTransitionsFor(status: string): string[] {
  return (VALID_ORDER_TRANSITIONS[status] ?? []).filter(
    (s) => !TRANSITIONS_NEEDING_DETAILS.includes(s as never),
  );
}

export function detailedTransitionsFor(status: string): string[] {
  return (VALID_ORDER_TRANSITIONS[status] ?? []).filter((s) =>
    TRANSITIONS_NEEDING_DETAILS.includes(s as never),
  );
}
