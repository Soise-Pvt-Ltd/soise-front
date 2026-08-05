// The contact details of a just-placed order, written at checkout submit and
// read back on the thank-you page. Exists because the confirmation page only
// receives a payment reference in the URL — the customer's email never travels
// with it, and asking the backend to return an email for an enumerable
// reference (SOISE-0001-02, SOISE-0002-01, ...) would be an address-book leak.
// The shopper's own browser remembering what the shopper themselves just typed
// leaks nothing.
//
// Consumer today: the Google Customer Reviews opt-in, which requires the order
// email and delivery country on the confirmation page.
export const CHECKOUT_CONTACT_KEY = 'soise_checkout_contact';

// Same staleness window as the pending-order marker: past this the shopper is
// no longer landing on a thank-you page for THIS order.
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

export type CheckoutContact = { email: string; country: string; at: number };

export function writeCheckoutContact(email: string, country: string) {
  if (!email || typeof window === 'undefined') return;
  try {
    const payload: CheckoutContact = { email, country, at: Date.now() };
    localStorage.setItem(CHECKOUT_CONTACT_KEY, JSON.stringify(payload));
  } catch {
    /* private mode / quota — the review opt-in just won't show */
  }
}

export function readCheckoutContact(): CheckoutContact | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(CHECKOUT_CONTACT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CheckoutContact;
    if (!parsed?.email) return null;
    if (Date.now() - (parsed.at ?? 0) > MAX_AGE_MS) {
      clearCheckoutContact();
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearCheckoutContact() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(CHECKOUT_CONTACT_KEY);
  } catch {
    /* nothing to do */
  }
}
