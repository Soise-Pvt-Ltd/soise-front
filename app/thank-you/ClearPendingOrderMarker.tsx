'use client';

import { useEffect } from 'react';
import { PENDING_ORDER_KEY } from '@/app/shop/order-summary/pending-order';

/**
 * Clears the pending-order resume marker once payment is confirmed, so the
 * order-summary page stops offering to resume an order that's already paid.
 * Renders nothing. Only mounted on a confirmed thank-you page.
 */
export default function ClearPendingOrderMarker() {
  useEffect(() => {
    try {
      sessionStorage.removeItem(PENDING_ORDER_KEY);
    } catch {
      /* storage disabled — nothing to clear */
    }
  }, []);
  return null;
}
