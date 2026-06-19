'use client';

import { CurrencyProvider, type Currency } from '@/lib/currency-context';
import RefCapture from '@/components/RefCapture';

export default function Providers({
  children,
  initialCurrency,
}: {
  children: React.ReactNode;
  initialCurrency?: Currency;
}) {
  return (
    <CurrencyProvider initialCurrency={initialCurrency}>
      <RefCapture />
      {children}
    </CurrencyProvider>
  );
}
