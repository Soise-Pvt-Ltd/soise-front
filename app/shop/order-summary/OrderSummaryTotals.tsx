'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useCurrency } from '@/lib/currency-context';

interface OrderSummaryTotalsProps {
  subtotal: number;
  appliedDiscount: number;
  creditApplied: number;
  shipping: number;
  domestic: boolean;
  totalAfterCredit: number;
  showSavingsPulse: boolean;
}

/**
 * The money breakdown under the cart: subtotal, discount, store credit,
 * shipping and total. Pure props — the parent owns the arithmetic.
 */
export function OrderSummaryTotals({
  subtotal,
  appliedDiscount,
  creditApplied,
  shipping,
  domestic,
  totalAfterCredit,
  showSavingsPulse,
}: OrderSummaryTotalsProps) {
  const { formatPrice, currency, isDisplayOnly, formatBilledUsd } =
    useCurrency();

  return (
    <div className="pt-[24px] uppercase">
      <div className="flex items-center justify-between text-[12px] tracking-[0.08em] text-[#5C544A]">
        <div>Subtotal</div>
        <div>{formatPrice(subtotal)}</div>
      </div>
      <AnimatePresence>
        {appliedDiscount > 0 && (
          <motion.div
            className="flex items-center justify-between pt-[8px] text-[12px] text-green-600"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div>Discount</div>
            <div>-{formatPrice(appliedDiscount)}</div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {creditApplied > 0 && (
          <motion.div
            className="flex items-center justify-between pt-[8px] text-[12px] text-green-600"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div>Store credit</div>
            <div>-{formatPrice(creditApplied)}</div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Always shown, including when it's free. A shopper who can't see
          a shipping line assumes one is coming at the payment step — say
          it plainly here instead. */}
      <div className="flex items-center justify-between pt-[8px] text-[12px] tracking-[0.08em] text-[#5C544A]">
        <div>Shipping</div>
        {shipping > 0 ? (
          <div>{formatPrice(shipping)}</div>
        ) : (
          // Free delivery is the promise EVERYWHERE — Lagos or London, the
          // backend charges zero shipping and Soise absorbs the courier.
          <div className="font-bold tracking-[0.1em] text-[#B3101C]">Free</div>
        )}
      </div>
      {/* The total is the page's second-loudest object after PAY: serif,
          oversized, over a 2px ink rule — a printed invoice line. */}
      <div className="mt-[14px] flex items-baseline justify-between border-t-2 border-[#121212] pt-[12px]">
        <div className="text-[12px] font-bold tracking-[0.16em]">Total</div>
        <AnimatePresence mode="wait">
          <motion.div
            key={totalAfterCredit}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.25 }}
            className={`text-[26px] leading-none tracking-tight ${
              showSavingsPulse ? 'text-[#B3101C]' : 'text-[#121212]'
            }`}
            style={{ fontFamily: 'var(--font-display, Georgia, serif)' }}
          >
            {formatPrice(totalAfterCredit)}
          </motion.div>
        </AnimatePresence>
      </div>
      {shipping === 0 && (
        <p className="mt-[8px] text-[10px] text-[#8E8E93] normal-case">
          Free delivery, anywhere in the world. Nothing is added at payment.
        </p>
      )}
      {isDisplayOnly && (
        // GBP/EUR/CAD are display currencies; the card is charged in USD.
        // Same rate feed and round-up rule as the backend, so this figure
        // is what the Bachs page will show.
        <p className="mt-[4px] text-[10px] text-[#8E8E93] normal-case">
          {currency} prices are a guide — your card is billed in USD (
          {formatBilledUsd(totalAfterCredit)}).
        </p>
      )}
      {currency === 'USD' && (
        <p className="mt-[8px] text-[10px] text-[#8E8E93] normal-case">
          * Displayed in USD for reference. Payment is processed in NGN.
        </p>
      )}
    </div>
  );
}
