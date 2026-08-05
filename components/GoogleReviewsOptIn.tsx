'use client';

import { useEffect } from 'react';
import { readCheckoutContact } from '@/app/shop/order-summary/checkout-contact';
import { countryCode } from '@/lib/countries';

/**
 * Google Customer Reviews opt-in, rendered on the confirmed thank-you page.
 * Google shows a small consent dialog; if the shopper opts in, they get a
 * post-delivery survey email and the ratings feed Merchant Center.
 *
 * Renders nothing itself — Google injects its own UI. Silently skips when the
 * checkout contact isn't available (private mode, cleared storage, >24h old):
 * a missing opt-in is invisible, a broken one on the money page is not.
 */

const MERCHANT_ID = 5834210416;
const SCRIPT_ID = 'gcr-platform';

// The store promises 3-5 business days domestically; +7 calendar days errs
// late, which Google prefers — the survey lands after the piece has.
const DELIVERY_DAYS = 7;

declare global {
  interface Window {
    renderOptIn?: () => void;
    gapi?: {
      load: (lib: string, cb: () => void) => void;
      surveyoptin: { render: (opts: Record<string, unknown>) => void };
    };
  }
}

export default function GoogleReviewsOptIn({ orderId }: { orderId: string }) {
  useEffect(() => {
    const contact = readCheckoutContact();
    if (!contact?.email || !orderId) return;

    const eta = new Date(Date.now() + DELIVERY_DAYS * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);

    window.renderOptIn = () => {
      window.gapi?.load('surveyoptin', () => {
        window.gapi?.surveyoptin.render({
          merchant_id: MERCHANT_ID,
          order_id: orderId,
          email: contact.email,
          delivery_country: countryCode(contact.country),
          estimated_delivery_date: eta,
          // Quietest placement Google offers — the confirmation page speaks
          // softly and its third parties should too.
          opt_in_style: 'BOTTOM_RIGHT_DIALOG',
        });
      });
    };

    // Reloads and strict-mode re-mounts: if the script is already on the page,
    // re-invoke the callback instead of injecting a duplicate tag.
    if (document.getElementById(SCRIPT_ID)) {
      if (window.gapi) window.renderOptIn();
      return;
    }
    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.src = 'https://apis.google.com/js/platform.js?onload=renderOptIn';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);
  }, [orderId]);

  return null;
}
