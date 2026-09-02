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
  // Naira is the house currency, so an unreadable country is not a reason to
  // leave it. This used to return USD, which meant every visitor whose IP the
  // edge couldn't place — a stripped header, a privacy proxy — was shown a
  // foreign price on a Nigerian brand's home page.
  return country ? 'USD' : 'NGN';
}

/**
 * Does the DEVICE say Nigeria?
 *
 * IP geolocation is a guess, and for Nigerian mobile it is a bad one: MTN /
 * Airtel / Glo hand out address space that the geo databases place in the
 * United Kingdom, so a shopper in Lagos on mobile data arrives looking British
 * and the site greeted them in pounds. The phone itself knows better — its
 * clock is set to Africa/Lagos and its locale list carries en-NG — and those
 * two signals cost nothing and travel with the browser rather than the packet
 * route.
 *
 * So the device gets the veto: if it says Nigeria, no IP lookup can move the
 * price off naira.
 */
function deviceSaysNigeria(): boolean {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    if (tz === 'Africa/Lagos') return true;
  } catch {
    /* Intl is universally available, but never let it break the page */
  }
  try {
    const langs = navigator.languages?.length
      ? navigator.languages
      : [navigator.language];
    return langs.some((l) => /-NG$/i.test(l || ''));
  } catch {
    return false;
  }
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
// Marks that the stuck-on-pounds repair below has already run for this browser,
// so a Nigerian who genuinely wants to browse in pounds keeps that choice.
const REPAIR_KEY = 'soise_currency_repair_v1';
const RATE_CACHE_KEY = 'soise_fx_cache_v3';
const RATE_TTL_MS = 60 * 60 * 1000; // 1 hour — matches the backend's cache

type Rates = Record<Exclude<Currency, 'NGN'>, number>;

// One Frankfurter v2 call covers everything: the naira leg via the Central
// Bank of Nigeria provider (official daily fix — the same feed the backend
// charges off, so shown-USD == charged-USD) and the ECB crosses for the
// display currencies. GBP price = naira × (NGN→USD) × (USD→GBP).
const RATES_URL =
  'https://api.frankfurter.dev/v2/rates?base=USD&quotes=NGN,CAD,EUR,GBP';

// ~₦1,360/$ (CBN, Aug 2026) + ECB-ballpark crosses. Matches the backend's
// fallback so a double feed failure still shows what it charges.
const FALLBACK_USD_PER_NGN = 0.000735;
const FALLBACK_CROSSES = { GBP: 0.74, EUR: 0.86, CAD: 1.39 }; // per USD

function buildRates(
  usdPerNgn: number,
  crosses: { GBP: number; EUR: number; CAD: number },
): Rates {
  return {
    USD: usdPerNgn,
    GBP: usdPerNgn * crosses.GBP,
    EUR: usdPerNgn * crosses.EUR,
    CAD: usdPerNgn * crosses.CAD,
  };
}

const FALLBACK_RATES: Rates = buildRates(FALLBACK_USD_PER_NGN, FALLBACK_CROSSES);

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

  // Restore the saved currency, or detect one on a first visit.
  //
  // Only a CHOICE is stored. A detected currency is applied to state and
  // nothing else, so a wrong guess lasts one page load instead of a year —
  // that persistence is what turned a single bad IP lookup into "I always see
  // pounds", since the stored value then satisfied the saved-preference branch
  // on every later visit and the guess was never re-examined.
  useEffect(() => {
    const fromCookie = document.cookie
      .split('; ')
      .find((row) => row.startsWith(`${PREF_KEY}=`))
      ?.split('=')[1];
    let saved = (
      CURRENCIES.includes(fromCookie as Currency)
        ? fromCookie
        : localStorage.getItem(PREF_KEY)
    ) as Currency | null;

    // Repair, once per browser: visitors already carrying a foreign currency
    // from the old auto-persisting behaviour. Their stored value is
    // indistinguishable from a deliberate one, so only clear it where the
    // device contradicts it — a phone on Lagos time showing pounds is the bug,
    // not a preference.
    try {
      if (
        saved &&
        saved !== 'NGN' &&
        !localStorage.getItem(REPAIR_KEY) &&
        deviceSaysNigeria()
      ) {
        localStorage.removeItem(PREF_KEY);
        document.cookie = `${PREF_KEY}=; path=/; max-age=0; samesite=lax`;
        saved = null;
      }
      localStorage.setItem(REPAIR_KEY, '1');
    } catch {
      /* storage can throw in private modes; the repair is best-effort */
    }

    if (saved && CURRENCIES.includes(saved)) {
      if (saved !== currency) {
        setCurrencyState(saved);
        localStorage.setItem(PREF_KEY, saved);
        document.cookie = `${PREF_KEY}=${saved}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
      }
      return;
    }

    // The device's own signals outrank the network's. A Nigerian shopper is
    // the default case for this store, and settling it here also spares them
    // the /api/geo round trip.
    if (deviceSaysNigeria()) return;

    // Otherwise let the country pick. Best-effort — a failed lookup just
    // leaves naira, exactly the pre-global behaviour.
    (async () => {
      try {
        const res = await fetch('/api/geo');
        if (!res.ok) return;
        const { country } = await res.json();
        const detected = currencyForCountry(String(country || ''));
        if (detected !== 'NGN') setCurrencyState(detected);
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
        const res = await fetch(RATES_URL);
        if (res.ok) {
          // v2 shape: [{base:"USD", quote:"NGN", rate:1355.76}, ...] —
          // quotes are per-USD, so the naira leg inverts into NGN→USD.
          const data: Array<{ quote: string; rate: number }> =
            await res.json();
          const byQuote = Object.fromEntries(
            (Array.isArray(data) ? data : []).map((r) => [r.quote, r.rate]),
          );
          const usdPerNgn =
            byQuote.NGN && byQuote.NGN > 0
              ? 1 / byQuote.NGN
              : FALLBACK_USD_PER_NGN;
          const crosses = {
            GBP: byQuote.GBP ?? FALLBACK_CROSSES.GBP,
            EUR: byQuote.EUR ?? FALLBACK_CROSSES.EUR,
            CAD: byQuote.CAD ?? FALLBACK_CROSSES.CAD,
          };
          const r = buildRates(usdPerNgn, crosses);
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
