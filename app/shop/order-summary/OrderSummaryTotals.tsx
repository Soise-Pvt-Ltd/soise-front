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
  const { formatPrice, currency } = useCurrency();

  return (
    <div className="pt-[24px] uppercase">
      <div className="flex items-center justify-between text-[12px] text-[#8E8E93]">
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
      <div className="flex items-center justify-between pt-[8px] text-[12px] text-[#8E8E93]">
        <div>Shipping</div>
        {shipping > 0 ? (
          <div>{formatPrice(shipping)}</div>
        ) : domestic ? (
          <div className="font-medium text-green-600">Free</div>
        ) : (
          // Free delivery is a Nigeria-only promise. The backend charges
          // zero shipping for every order, so an international address
          // would otherwise be shown "Free" — a claim nobody made.
          <div className="text-[#8E8E93]">Confirmed after order</div>
        )}
      </div>
      <div className="flex items-center justify-between pt-[12px] text-[14px] font-medium text-[#121212]">
        <div>Total</div>
        <AnimatePresence mode="wait">
          <motion.div
            key={totalAfterCredit}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.25 }}
            className={showSavingsPulse ? 'text-green-600' : ''}
          >
            {formatPrice(totalAfterCredit)}
          </motion.div>
        </AnimatePresence>
      </div>
      {shipping === 0 && domestic && (
        <p className="mt-[8px] text-[10px] text-[#8E8E93] normal-case">
          Free delivery anywhere in Nigeria. Nothing is added at payment.
        </p>
      )}
      {shipping === 0 && !domestic && (
        <p className="mt-[8px] text-[10px] text-[#8E8E93] normal-case">
          International delivery — we&apos;ll confirm shipping with you
          after you order.
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
