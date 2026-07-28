/**
 * Paystack Inline — open checkout in an overlay instead of leaving the site.
 *
 * Why: every order this store has ever created reached the Paystack redirect
 * and none were paid. A full-page redirect to a different domain is the step
 * that loses people; inline keeps the shopper on the page they trust.
 *
 * We use resumeTransaction(accessCode), NOT newTransaction({amount, ...}).
 * The access code comes from the server-side transaction initialize, so the
 * amount stays server-authoritative. newTransaction takes an amount from the
 * browser, which is exactly the client-sets-its-own-price hole that
 * shipping_total already was — not reopening it.
 *
 * API per @paystack/inline-js v2:
 *   popup.resumeTransaction(accessCode, { onSuccess, onCancel, onLoad, onError })
 *     onSuccess({ id, reference, message })
 *     onCancel()                            — no arguments
 *     onLoad({ id, customer, accessCode })
 *     onError({ message })
 */

export type PaystackSuccess = {
  id?: number;
  reference: string;
  message?: string;
};

export type InlineOutcome =
  | { kind: 'success'; reference: string }
  | { kind: 'cancelled' }
  /** Inline couldn't run at all — the caller should fall back to the redirect. */
  | { kind: 'unavailable'; reason: string };

/**
 * Open the Paystack overlay and resolve once the shopper finishes with it.
 *
 * Never throws: any failure resolves as `unavailable` so the caller can fall
 * back to the hosted redirect. Losing the overlay must never mean losing the
 * sale — the order already exists server-side either way.
 */
export async function openInlineCheckout(
  accessCode: string,
): Promise<InlineOutcome> {
  if (typeof window === 'undefined') {
    return { kind: 'unavailable', reason: 'not-in-browser' };
  }
  if (!accessCode) {
    return { kind: 'unavailable', reason: 'no-access-code' };
  }

  let PaystackPop: typeof import('@paystack/inline-js').default;

  try {
    // Dynamic import: keeps Paystack's bundle off every other page, and means
    // a blocked/failed script degrades to the redirect rather than breaking
    // checkout.
    const mod = await import('@paystack/inline-js');
    PaystackPop = mod.default;
  } catch (error) {
    return {
      kind: 'unavailable',
      reason: error instanceof Error ? error.message : 'import-failed',
    };
  }

  return new Promise<InlineOutcome>((resolve) => {
    // Resolve exactly once. Paystack can fire more than one callback for a
    // single transaction, and the caller navigates on the first outcome.
    let settled = false;
    const settle = (outcome: InlineOutcome) => {
      if (settled) return;
      settled = true;
      clearTimeout(watchdog);
      resolve(outcome);
    };

    // Watchdog. Tested against Paystack's live v2 script: a bad access code
    // does NOT fire onError — it fires onLoad with an empty payload and then
    // nothing else. Without this the promise never settles, so the shopper
    // sits behind a dead overlay with the pay button locked and no fallback.
    // Only runs until the form loads; once it has, the shopper is filling it
    // in and we must not yank it away from them.
    const watchdog = setTimeout(
      () => settle({ kind: 'unavailable', reason: 'load-timeout' }),
      12_000,
    );

    try {
      const popup = new PaystackPop();
      popup.resumeTransaction(accessCode, {
        onLoad: (event) => {
          // A real load carries an id/accessCode. An empty object is what a
          // rejected access code produces — treat it as unavailable and let
          // the caller fall back rather than stranding them.
          const loaded = Boolean(event?.id || event?.accessCode);
          if (!loaded) {
            settle({ kind: 'unavailable', reason: 'empty-load' });
            return;
          }
          clearTimeout(watchdog);
        },
        onSuccess: (transaction) =>
          settle({ kind: 'success', reference: transaction?.reference }),
        onCancel: () => settle({ kind: 'cancelled' }),
        onError: (error) =>
          settle({
            kind: 'unavailable',
            reason: error?.message || 'paystack-error',
          }),
      });
    } catch (error) {
      settle({
        kind: 'unavailable',
        reason: error instanceof Error ? error.message : 'popup-failed',
      });
    }
  });
}
