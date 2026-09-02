'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCurrency, type Currency } from '@/lib/currency-context';

/**
 * Compact currency pill in the always-visible top nav. The black pill always
 * shows the active symbol, so a geo-defaulted Londoner sees £ up top without
 * ever touching it.
 *
 * It used to CYCLE on tap: ₦ → $ → £ → € → CA$ → ₦. That was fine while there
 * were two states and cruel with five — a shopper who landed on the wrong
 * currency (or tapped the pill once out of curiosity) had to press it four
 * more times to get back to naira, with no way to see where they were going.
 * It opens a list instead: every currency reachable in one tap, the active one
 * marked, naira first.
 */
const ORDER: Currency[] = ['NGN', 'USD', 'GBP', 'EUR', 'CAD'];
const LABEL: Record<Currency, string> = {
  NGN: '₦',
  USD: '$',
  GBP: '£',
  EUR: '€',
  CAD: 'CA$',
};
const NAME: Record<Currency, string> = {
  NGN: 'Naira',
  USD: 'US Dollar',
  GBP: 'Pound',
  EUR: 'Euro',
  CAD: 'Canadian Dollar',
};

export default function CurrencyToggle({
  className = '',
}: {
  className?: string;
}) {
  const { currency, setCurrency } = useCurrency();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // Close on an outside tap or Escape — the pill sits in a nav that stays put
  // while the page scrolls, so a stray-open menu would follow the shopper down.
  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <motion.button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-[26px] items-center rounded-full border border-[#AEAEB2] bg-white px-[3px] text-[10px] font-medium tracking-wide hover:cursor-pointer focus-visible:ring-2 focus-visible:ring-[#121212] focus-visible:ring-offset-2 focus-visible:outline-none"
        title={`Prices in ${currency} — tap to change`}
        whileTap={{ scale: 0.93 }}
        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Prices shown in ${currency}. Change currency`}
      >
        <span className="relative z-10 flex h-[20px] min-w-[34px] items-center justify-center rounded-full bg-black px-[8px] text-white">
          {LABEL[currency]}
        </span>
        <span className="relative z-10 px-[5px] text-[#8E8E93]">
          <svg width="7" height="4" viewBox="0 0 7 4" aria-hidden="true">
            <path
              d="M1 1l2.5 2L6 1"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.ul
            role="listbox"
            aria-label="Currency"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
            className="absolute right-0 z-50 mt-[6px] w-[136px] overflow-hidden rounded-[10px] border border-[#E5E5EA] bg-white py-[4px] shadow-[0_8px_24px_rgba(0,0,0,0.12)]"
          >
            {ORDER.map((c) => (
              <li key={c}>
                <button
                  type="button"
                  role="option"
                  aria-selected={c === currency}
                  onClick={() => {
                    setCurrency(c);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center gap-x-[8px] px-[10px] py-[6px] text-left text-[11px] hover:cursor-pointer hover:bg-[#F2F2F7] ${
                    c === currency ? 'font-medium text-[#121212]' : 'text-[#3A3A3C]'
                  }`}
                >
                  <span className="w-[24px] text-[12px]">{LABEL[c]}</span>
                  <span className="flex-1">{NAME[c]}</span>
                  {c === currency && <span aria-hidden="true">✓</span>}
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
