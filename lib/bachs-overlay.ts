/**
 * Bachs overlay — open checkout in a modal instead of leaving the site.
 *
 * Why: every order this store created under the old full-page redirect went
 * unpaid. A bounce to a different domain is the step that loses people; the
 * overlay keeps the shopper on the page they trust.
 *
 * We open a server-created `checkout_url`, never a client-built one. The
 * session's amount and currency were fixed by the backend when it called
 * POST /v1/checkout-sessions with the secret key, so the price stays
 * server-authoritative — the browser can't change what gets charged.
 *
 * API per @bachs/js:
 *   const Bachs = await loadBachs();
 *   Bachs.Initialize({ baseUrl?, onEvent? })   — once per page load
 *   Bachs.Checkout.open({ checkoutUrl, onEvent })
 *     events: checkout.opened | loaded | ready | completed | failed |
 *             expired | closed | error   (each { type, data })
 *
 * These events drive UI only. Fulfilment happens on the backend's
 * collection.succeeded webhook, and /thank-you re-verifies server-side —
 * exactly as the redirect path always did.
 */

export type InlineOutcome =
  | { kind: 'success'; reference: string }
  | { kind: 'cancelled' }
  /** The overlay couldn't run at all — the caller should fall back to the redirect. */
  | { kind: 'unavailable'; reason: string };

let initialized = false;

/**
 * Open the Bachs overlay and resolve once the shopper finishes with it.
 *
 * Never throws: any failure resolves as `unavailable` so the caller can fall
 * back to the hosted redirect. Losing the overlay must never mean losing the
 * sale — the order already exists server-side either way.
 */
export async function openInlineCheckout(
  checkoutUrl: string,
): Promise<InlineOutcome> {
  if (typeof window === 'undefined') {
    return { kind: 'unavailable', reason: 'not-in-browser' };
  }
  if (!checkoutUrl) {
    return { kind: 'unavailable', reason: 'no-checkout-url' };
  }

  // The SDK origin-locks its iframe messaging to the checkout origin it is
  // configured with. Derive that origin from the session URL itself so
  // sandbox (sandbox-checkout.bachs.io) and live (checkout.bachs.io) both
  // work — but only ever for a bachs.io host. Anything else is not our
  // payment provider and must not be opened in an overlay we treat as one.
  let origin: string;
  try {
    const parsed = new URL(checkoutUrl);
    origin = parsed.origin;
    if (parsed.protocol !== 'https:' || !parsed.hostname.endsWith('.bachs.io')) {
      return { kind: 'unavailable', reason: 'not-a-bachs-url' };
    }
  } catch {
    return { kind: 'unavailable', reason: 'bad-checkout-url' };
  }

  let Bachs: Awaited<ReturnType<typeof import('@bachs/js').loadBachs>>;

  try {
    // Dynamic import: keeps the Bachs bundle off every other page, and means
    // a blocked/failed script degrades to the redirect rather than breaking
    // checkout.
    const mod = await import('@bachs/js');
    Bachs = await mod.loadBachs();
    if (!initialized) {
      Bachs.Initialize({ baseUrl: origin });
      initialized = true;
    }
  } catch (error) {
    return {
      kind: 'unavailable',
      reason: error instanceof Error ? error.message : 'import-failed',
    };
  }

  return new Promise<InlineOutcome>((resolve) => {
    // Resolve exactly once. The overlay emits several lifecycle events per
    // checkout, and the caller navigates on the first outcome.
    let settled = false;
    const settle = (outcome: InlineOutcome) => {
      if (settled) return;
      settled = true;
      clearTimeout(watchdog);
      resolve(outcome);
    };

    // Watchdog: if the overlay never becomes ready (expired session, dead
    // script, malformed token), settle as unavailable so the caller can fall
    // back instead of stranding the shopper behind a blank modal. Only runs
    // until the checkout is ready; once it is, the shopper is paying and we
    // must not yank it away from them.
    const watchdog = setTimeout(
      () => settle({ kind: 'unavailable', reason: 'load-timeout' }),
      12_000,
    );

    let paidReference = '';

    try {
      // open() resolves once the modal mounts and rejects on a bad token or a
      // URL on the wrong origin — a rejection is just another "fall back to
      // the redirect", not an exception to leak.
      Promise.resolve(
        Bachs.Checkout.open({
          checkoutUrl,
        onEvent: (event: { type: string; data?: Record<string, unknown> }) => {
          switch (event.type) {
            case 'checkout.ready':
              clearTimeout(watchdog);
              break;
            case 'checkout.completed':
              // The overlay auto-closes ~1.2s after success; settle now so
              // navigation to /thank-you doesn't wait on the close event.
              paidReference = String(event.data?.reference ?? '');
              settle({ kind: 'success', reference: paidReference });
              break;
            case 'checkout.failed':
              // A failed charge attempt — the hosted checkout shows its own
              // retry UI, so keep the overlay up. If the shopper gives up and
              // closes it, checkout.closed lands us in 'cancelled'.
              break;
            case 'checkout.expired':
              settle({ kind: 'unavailable', reason: 'session-expired' });
              break;
            case 'checkout.closed':
              settle(
                paidReference
                  ? { kind: 'success', reference: paidReference }
                  : { kind: 'cancelled' },
              );
              break;
            case 'checkout.error':
              settle({
                kind: 'unavailable',
                reason: String(event.data?.message ?? 'bachs-error'),
              });
              break;
          }
        },
        }),
      ).catch((error: unknown) => {
        settle({
          kind: 'unavailable',
          reason: error instanceof Error ? error.message : 'open-rejected',
        });
      });
    } catch (error) {
      settle({
        kind: 'unavailable',
        reason: error instanceof Error ? error.message : 'open-failed',
      });
    }
  });
}
