'use client';

import { motion } from 'framer-motion';
import { useCurrency } from '@/lib/currency-context';

/**
 * Compact ₦/$ currency pill. Lives in the always-visible top nav bar so mobile
 * users can switch currency in one tap (previously it was stranded at the
 * bottom of the fullscreen menu). Reads the shared currency context, so every
 * instance stays in sync.
 */
export default function CurrencyToggle({
  className = '',
}: {
  className?: string;
}) {
  const { currency, setCurrency } = useCurrency();
  return (
    <motion.button
      type="button"
      onClick={() => setCurrency(currency === 'NGN' ? 'USD' : 'NGN')}
      className={`relative flex h-[26px] items-center rounded-full border border-[#AEAEB2] bg-white px-[3px] text-[10px] font-medium tracking-wide hover:cursor-pointer focus-visible:ring-2 focus-visible:ring-[#121212] focus-visible:ring-offset-2 focus-visible:outline-none ${className}`}
      title={`Switch to ${currency === 'NGN' ? 'USD' : 'NGN'}`}
      whileTap={{ scale: 0.93 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      aria-label={`Switch currency to ${currency === 'NGN' ? 'USD' : 'NGN'}`}
    >
      <motion.span
        className="absolute top-[2px] h-[20px] w-[28px] rounded-full bg-black"
        animate={{ left: currency === 'NGN' ? 3 : 31 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      />
      <span
        className={`relative z-10 w-[28px] text-center transition-colors duration-200 ${currency === 'NGN' ? 'text-white' : 'text-[#8E8E93]'}`}
      >
        ₦
      </span>
      <span
        className={`relative z-10 w-[28px] text-center transition-colors duration-200 ${currency === 'USD' ? 'text-white' : 'text-[#8E8E93]'}`}
      >
        $
      </span>
    </motion.button>
  );
}
