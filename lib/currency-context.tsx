'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';

export type Currency = 'NGN' | 'USD';

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  formatPrice: (ngnAmount: number) => string;
  isRateLoading: boolean;
}

const CurrencyContext = createContext<CurrencyContextType>({
  currency: 'NGN',
  setCurrency: () => {},
  formatPrice: (n) => `₦${Math.round(n).toLocaleString('en-NG')}`,
  isRateLoading: false,
});

const PREF_KEY = 'soise_currency';
const RATE_CACHE_KEY = 'soise_fx_cache';
const RATE_TTL_MS = 60 * 60 * 1000; // 1 hour
const FALLBACK_USD_RATE = 0.00063; // ~1600 NGN/USD fallback

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>('NGN');
  const [usdRate, setUsdRate] = useState<number>(FALLBACK_USD_RATE);
  const [isRateLoading, setIsRateLoading] = useState(false);

  // Restore saved preference on mount
  useEffect(() => {
    const saved = localStorage.getItem(PREF_KEY);
    if (saved === 'NGN' || saved === 'USD') setCurrencyState(saved);
  }, []);

  // Fetch live exchange rate (NGN → USD), with 1h cache
  useEffect(() => {
    const fetchRate = async () => {
      try {
        const cached = localStorage.getItem(RATE_CACHE_KEY);
        if (cached) {
          const { rate, ts } = JSON.parse(cached);
          if (Date.now() - ts < RATE_TTL_MS && typeof rate === 'number') {
            setUsdRate(rate);
            return;
          }
        }
      } catch {
        // ignore parse errors
      }

      setIsRateLoading(true);
      try {
        const res = await fetch('https://open.er-api.com/v6/latest/NGN');
        if (res.ok) {
          const data = await res.json();
          const rate: number = data?.rates?.USD ?? FALLBACK_USD_RATE;
          setUsdRate(rate);
          localStorage.setItem(
            RATE_CACHE_KEY,
            JSON.stringify({ rate, ts: Date.now() }),
          );
        }
      } catch {
        // silently use fallback
      } finally {
        setIsRateLoading(false);
      }
    };

    fetchRate();
  }, []);

  const setCurrency = useCallback((c: Currency) => {
    setCurrencyState(c);
    localStorage.setItem(PREF_KEY, c);
  }, []);

  const formatPrice = useCallback(
    (ngnAmount: number): string => {
      if (currency === 'USD') {
        const usd = ngnAmount * usdRate;
        return `$${usd.toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`;
      }
      return `₦${Math.round(ngnAmount).toLocaleString('en-NG')}`;
    },
    [currency, usdRate],
  );

  return (
    <CurrencyContext.Provider
      value={{ currency, setCurrency, formatPrice, isRateLoading }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  return useContext(CurrencyContext);
}
