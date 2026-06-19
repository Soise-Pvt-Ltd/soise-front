'use client';

import { CurrencyProvider, type Currency } from '@/lib/currency-context';

export default function Providers({
  children,
  initialCurrency,
}: {
  children: React.ReactNode;
  initialCurrency?: Currency;
}) {
  return (
    <CurrencyProvider initialCurrency={initialCurrency}>
      {children}
    </CurrencyProvider>
  );
}
