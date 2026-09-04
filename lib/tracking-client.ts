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

type MetaPixel = (command: 'track', event: string, properties?: TtqEventProperties) => void;

function metaPixel(): MetaPixel | null {
  if (typeof window === 'undefined') return null;
  // Like ttq, the fbq base snippet queues calls made before fbevents.js loads.
  const fbq = (window as unknown as { fbq?: MetaPixel }).fbq;
  return typeof fbq === 'function' ? fbq : null;
}

/** Report a browser-side pixel event. Never throws — tracking must not break the page. */
export function track(event: string, properties?: TtqEventProperties): void {
  try {
    pixel()?.track(event, properties);
  } catch {
    /* attribution is best-effort */
  }
}

/** Report a browser-side Meta pixel event. Never throws, like track(). */
export function metaTrack(event: string, properties?: TtqEventProperties): void {
  try {
    metaPixel()?.('track', event, properties);
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
        content_type: 'product_group',
        content_name: product.name,
      },
    ],
    content_name: product.name,
    currency: 'NGN',
    value: Number(product.base_price) || 0,
  });
  metaTrack('ViewContent', {
    content_ids: [product.id],
    content_type: 'product_group',
    content_name: product.name,
    currency: 'NGN',
    value: Number(product.base_price) || 0,
  });
}

export function trackAddToCart(item: {
  productId: string;
  variantId: string;
  name: string;
  price: number;
  quantity: number;
}): void {
  track('AddToCart', {
    contents: [
      {
        content_id: item.variantId,
        content_type: 'product',
        content_name: item.name,
        quantity: item.quantity,
        price: item.price,
      },
    ],
    content_name: item.name,
    currency: 'NGN',
    value: item.price * item.quantity,
  });
  metaTrack('AddToCart', {
    content_ids: [item.variantId],
    content_type: 'product',
    content_name: item.name,
    currency: 'NGN',
    value: item.price * item.quantity,
    contents: [{ id: item.variantId, quantity: item.quantity }],
  });
}

export function trackInitiateCheckout(items: {
  variantId: string;
  name: string;
  price: number;
  quantity: number;
}[]): void {
  const value = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  track('InitiateCheckout', {
    contents: items.map((i) => ({
      content_id: i.variantId,
      content_type: 'product',
      content_name: i.name,
      quantity: i.quantity,
      price: i.price,
    })),
    currency: 'NGN',
    value,
  });
  metaTrack('InitiateCheckout', {
    content_ids: items.map((i) => i.variantId),
    content_type: 'product',
    currency: 'NGN',
    value,
    num_items: items.length,
  });
}

export function trackPurchase(order: {
  orderId: string;
  value: number;
  items: { variantId: string; name: string; price: number; quantity: number }[];
}): void {
  track('CompletePayment', {
    contents: order.items.map((i) => ({
      content_id: i.variantId,
      content_type: 'product',
      content_name: i.name,
      quantity: i.quantity,
      price: i.price,
    })),
    currency: 'NGN',
    value: order.value,
  });
  metaTrack('Purchase', {
    content_ids: order.items.map((i) => i.variantId),
    content_type: 'product',
    currency: 'NGN',
    value: order.value,
    num_items: order.items.length,
  });
}
