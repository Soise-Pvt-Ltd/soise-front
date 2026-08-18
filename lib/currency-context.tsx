'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';

/**
 * The global currency layer.
 *
 * NGN is canonical — every price in the catalog is naira. Bachs charges
 * exactly two currencies: NGN (Nigeria, local rails) and USD (cards from
 * 120+ countries). GBP / EUR / CAD are DISPLAY currencies: a Londoner
 * browses in pounds, and the checkout notes "billed in USD $X".
 *
 * Rounding is a brand rule, not arithmetic: every converted price rounds
 * UP to the nearest 5 whole units ($57.31 → $60, £43.20 → £45), so foreign
 * prices read like prices instead of exchange-rate output. The backend
 * applies the same rule to the charged USD amount (app/domain/fx.py), off
 * the same hourly rate feed, so what the shopper sees is what Bachs asks.
 *
 * On first visit (no saved preference) the currency is picked from the
 * visitor's country via /api/geo; a manual choice always wins and sticks.
 */
export type Currency = 'NGN' | 'USD' | 'GBP' | 'EUR' | 'CAD';

const CURRENCIES: Currency[] = ['NGN', 'USD', 'GBP', 'EUR', 'CAD'];

const SYMBOLS: Record<Currency, string> = {
  NGN: '₦',
  USD: '$',
  GBP: '£',
  EUR: '€',
  CAD: 'CA$',
};

// EU membership approximated by euro-area + close neighbours that price in €.
const EURO_COUNTRIES = new Set([
  'AT', 'BE', 'CY', 'DE', 'EE', 'ES', 'FI', 'FR', 'GR', 'HR', 'IE', 'IT',
  'LT', 'LU', 'LV', 'MT', 'NL', 'PT', 'SI', 'SK',
]);

function currencyForCountry(country: string): Currency {
  if (country === 'NG') return 'NGN';
  if (country === 'GB') return 'GBP';
  if (country === 'CA') return 'CAD';
  if (EURO_COUNTRIES.has(country)) return 'EUR';
  return 'USD'; // the card rail's native currency — the safe world default
}

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  formatPrice: (ngnAmount: number) => string;
  /** What Bachs will actually charge: NGN in Nigeria, USD everywhere else. */
  chargeCurrency: 'NGN' | 'USD';
  /** True when the shown currency is display-only (GBP/EUR/CAD → billed in USD). */
  isDisplayOnly: boolean;
  /** "$95" — the rounded USD figure Bachs will charge for an NGN amount. */
  formatBilledUsd: (ngnAmount: number) => string;
  isRateLoading: boolean;
}

const CurrencyContext = createContext<CurrencyContextType>({
  currency: 'NGN',
  setCurrency: () => {},
  formatPrice: (n) => `₦${Math.round(n).toLocaleString('en-NG')}`,
  chargeCurrency: 'NGN',
  isDisplayOnly: false,
  formatBilledUsd: () => '',
  isRateLoading: false,
});

const PREF_KEY = 'soise_currency';
const RATE_CACHE_KEY = 'soise_fx_cache_v2';
const RATE_TTL_MS = 60 * 60 * 1000; // 1 hour — matches the backend's cache

type Rates = Record<Exclude<Currency, 'NGN'>, number>;

// Deliberately slightly naira-pessimistic so a stale fallback can't show a
// price below what the backend would charge.
const FALLBACK_RATES: Rates = {
  USD: 0.00063, // ~₦1,590/$
  GBP: 0.0005, //  ~₦2,000/£
  EUR: 0.00058, // ~₦1,720/€
  CAD: 0.00086, // ~₦1,160/CA$
};

/** Round UP to the nearest 5 whole units — the international price rule. */
function roundUp5(value: number): number {
  return Math.ceil(value / 5) * 5;
}

export function CurrencyProvider({
  children,
  initialCurrency = 'NGN',
}: {
  children: React.ReactNode;
  initialCurrency?: Currency;
}) {
  const [currency, setCurrencyState] = useState<Currency>(initialCurrency);
  const [rates, setRates] = useState<Rates>(FALLBACK_RATES);
  const [isRateLoading, setIsRateLoading] = useState(false);

  // Restore the saved currency, or geo-detect on a first visit. A saved
  // preference (cookie, then legacy localStorage) always wins; only a
  // visitor with no preference at all gets the geo default, so a manual
  // choice is never overridden by an IP lookup.
  useEffect(() => {
    const fromCookie = document.cookie
      .split('; ')
      .find((row) => row.startsWith(`${PREF_KEY}=`))
      ?.split('=')[1];
    const saved = (
      CURRENCIES.includes(fromCookie as Currency)
        ? fromCookie
        : localStorage.getItem(PREF_KEY)
    ) as Currency | null;

    if (saved && CURRENCIES.includes(saved)) {
      if (saved !== currency) {
        setCurrencyState(saved);
        localStorage.setItem(PREF_KEY, saved);
        document.cookie = `${PREF_KEY}=${saved}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
      }
      return;
    }

    // First visit: let the country pick. Best-effort — a failed lookup
    // just leaves naira, exactly the pre-global behaviour.
    (async () => {
      try {
        const res = await fetch('/api/geo');
        if (!res.ok) return;
        const { country } = await res.json();
        const detected = currencyForCountry(String(country || ''));
        if (detected !== 'NGN') {
          setCurrencyState(detected);
          localStorage.setItem(PREF_KEY, detected);
          document.cookie = `${PREF_KEY}=${detected}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
        }
      } catch {
        /* geo is a nicety, never a blocker */
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // One fetch covers every display currency — same upstream and TTL as the
  // backend's charge-side conversion, so both sides agree.
  useEffect(() => {
    const fetchRates = async () => {
      try {
        const cached = localStorage.getItem(RATE_CACHE_KEY);
        if (cached) {
          const { rates: r, ts } = JSON.parse(cached);
          if (Date.now() - ts < RATE_TTL_MS && r?.USD) {
            setRates(r);
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
          const r: Rates = {
            USD: data?.rates?.USD ?? FALLBACK_RATES.USD,
            GBP: data?.rates?.GBP ?? FALLBACK_RATES.GBP,
            EUR: data?.rates?.EUR ?? FALLBACK_RATES.EUR,
            CAD: data?.rates?.CAD ?? FALLBACK_RATES.CAD,
          };
          setRates(r);
          localStorage.setItem(
            RATE_CACHE_KEY,
            JSON.stringify({ rates: r, ts: Date.now() }),
          );
        }
      } catch {
        // silently use fallback
      } finally {
        setIsRateLoading(false);
      }
    };

    fetchRates();
  }, []);

  const setCurrency = useCallback((c: Currency) => {
    setCurrencyState(c);
    localStorage.setItem(PREF_KEY, c);
    document.cookie = `${PREF_KEY}=${c}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
  }, []);

  const formatPrice = useCallback(
    (ngnAmount: number): string => {
      if (currency === 'NGN') {
        return `₦${Math.round(ngnAmount).toLocaleString('en-NG')}`;
      }
      const converted = roundUp5(ngnAmount * rates[currency]);
      return `${SYMBOLS[currency]}${converted.toLocaleString('en-US')}`;
    },
    [currency, rates],
  );

  const formatBilledUsd = useCallback(
    (ngnAmount: number): string =>
      `$${roundUp5(ngnAmount * rates.USD).toLocaleString('en-US')}`,
    [rates],
  );

  const chargeCurrency: 'NGN' | 'USD' = currency === 'NGN' ? 'NGN' : 'USD';
  const isDisplayOnly = currency !== 'NGN' && currency !== 'USD';

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        setCurrency,
        formatPrice,
        chargeCurrency,
        isDisplayOnly,
        formatBilledUsd,
        isRateLoading,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  return useContext(CurrencyContext);
}
