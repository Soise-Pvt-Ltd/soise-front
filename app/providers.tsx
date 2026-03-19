'use client';

import { CurrencyProvider } from '@/lib/currency-context';

export default function Providers({ children }: { children: React.ReactNode }) {
  return <CurrencyProvider>{children}</CurrencyProvider>;
}
