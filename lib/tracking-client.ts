'use client';

/**
 * Browser-side TikTok pixel events.
 *
 * The server-side CAPI helper (lib/tracking.ts) covers actions that go through
 * a server action — AddToCart, InitiateCheckout, Purchase. It cannot cover
 * ViewContent on the product page, for two reasons:
 *
 *  1. The product page is statically prerendered with ISR (`revalidate = 60`),
 *     so a real visitor never triggers a per-request backend call. The backend
 *     only fires ViewContent from `GET /products/:id`, and the page fetches the
 *     `/products` list at build/revalidate time instead. The event therefore
 *     never fired for ad traffic at all — TikTok reported 0 ViewContent against
 *     240 landing page views.
 *  2. Even if it did fire on the server, the first render of an ad click has no
 *     `ttclid` cookie yet: TikTokClickId copies it out of the URL in an effect,
 *     which runs after the server has already responded. The event would arrive
 *     unattributed.
 *
 * Firing from the browser fixes both — the pixel already holds `_ttp` and reads
 * the click id from the landing URL itself, so attribution comes for free and
 * ISR is left alone.
 */

type TtqEventProperties = Record<string, unknown>;

type TiktokPixel = {
  track: (event: string, properties?: TtqEventProperties) => void;
};

function pixel(): TiktokPixel | null {
  if (typeof window === 'undefined') return null;
  const ttq = (window as unknown as { ttq?: TiktokPixel }).ttq;
  // The base pixel stubs `track` into a queue before events.js loads, so this
  // is safe to call immediately on mount — calls made early are replayed.
  return ttq && typeof ttq.track === 'function' ? ttq : null;
}

/** Report a browser-side pixel event. Never throws — tracking must not break the page. */
export function track(event: string, properties?: TtqEventProperties): void {
  try {
    pixel()?.track(event, properties);
  } catch {
    /* attribution is best-effort */
  }
}

export function trackViewContent(product: {
  id: string;
  name: string;
  base_price: number;
}): void {
  track('ViewContent', {
    contents: [
      {
        content_id: product.id,
        content_type: 'product',
        content_name: product.name,
      },
    ],
    // Matches the backend's ViewContent payload (app/routes/products.py) so the
    // two sources stay comparable in TikTok's reporting.
    content_name: product.name,
    currency: 'NGN',
    value: Number(product.base_price) || 0,
  });
}
