'use client';

import { motion } from 'framer-motion';
import { useCurrency, type Currency } from '@/lib/currency-context';

/**
 * Compact currency pill in the always-visible top nav. Was a two-state ₦/$
 * toggle; the global layer brought GBP/EUR/CAD display currencies, so it now
 * CYCLES on tap — the black pill always shows the active symbol, so a
 * geo-defaulted Londoner sees £ up top without ever touching it. Reads the
 * shared currency context, so every instance stays in sync.
 */
const ORDER: Currency[] = ['NGN', 'USD', 'GBP', 'EUR', 'CAD'];
const LABEL: Record<Currency, string> = {
  NGN: '₦',
  USD: '$',
  GBP: '£',
  EUR: '€',
  CAD: 'CA$',
};

export default function CurrencyToggle({
  className = '',
}: {
  className?: string;
}) {
  const { currency, setCurrency } = useCurrency();
  const next = ORDER[(ORDER.indexOf(currency) + 1) % ORDER.length];
  return (
    <motion.button
      type="button"
      onClick={() => setCurrency(next)}
      className={`relative flex h-[26px] items-center rounded-full border border-[#AEAEB2] bg-white px-[3px] text-[10px] font-medium tracking-wide hover:cursor-pointer focus-visible:ring-2 focus-visible:ring-[#121212] focus-visible:ring-offset-2 focus-visible:outline-none ${className}`}
      title={`Prices in ${currency} — tap for ${next}`}
      whileTap={{ scale: 0.93 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      aria-label={`Prices shown in ${currency}. Switch to ${next}`}
    >
      <span className="relative z-10 flex h-[20px] min-w-[34px] items-center justify-center rounded-full bg-black px-[8px] text-white">
        {LABEL[currency]}
      </span>
      <span className="relative z-10 min-w-[26px] px-[4px] text-center text-[#8E8E93]">
        {LABEL[next]}
      </span>
    </motion.button>
  );
}
