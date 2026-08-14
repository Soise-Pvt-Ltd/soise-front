/**
 * Countries Soise ships to.
 *
 * Nigeria first because it's the bulk of orders, then the diaspora markets.
 * The checkout used to offer a country `<select>` with Nigeria as its only
 * option — which read like dead weight but was actually unfinished
 * international support. Removing it broke diaspora orders outright.
 */
export const SHIPPING_COUNTRIES = [
  'Nigeria',
  'United Kingdom',
  'United States',
  'Canada',
  'Ireland',
  'Germany',
  'France',
  'Netherlands',
  'Italy',
  'Spain',
  'Belgium',
  'Sweden',
  'Norway',
  'Denmark',
  'Switzerland',
  'Austria',
  'Portugal',
  'Australia',
  'New Zealand',
  'United Arab Emirates',
  'Qatar',
  'Saudi Arabia',
  'South Africa',
  'Ghana',
  'Kenya',
  'China',
  'Japan',
  'Malaysia',
] as const;

export const DEFAULT_COUNTRY = 'Nigeria';

export function isDomestic(country: string | null | undefined): boolean {
  return (country || DEFAULT_COUNTRY).trim().toLowerCase() === 'nigeria';
}

/**
 * Nigerian states. Only meaningful for domestic addresses — everywhere else
 * gets a free-text state/province/region field, because no fixed list covers
 * "county", "province", "prefecture" and "emirate" at once.
 */
export const NIGERIAN_STATES = [
  'Abia',
  'Adamawa',
  'Akwa Ibom',
  'Anambra',
  'Bauchi',
  'Bayelsa',
  'Benue',
  'Borno',
  'Cross River',
  'Delta',
  'Ebonyi',
  'Edo',
  'Ekiti',
  'Enugu',
  'FCT',
  'Gombe',
  'Imo',
  'Jigawa',
  'Kaduna',
  'Kano',
  'Katsina',
  'Kebbi',
  'Kogi',
  'Kwara',
  'Lagos',
  'Nasarawa',
  'Niger',
  'Ogun',
  'Ondo',
  'Osun',
  'Oyo',
  'Plateau',
  'Rivers',
  'Sokoto',
  'Taraba',
  'Yobe',
  'Zamfara',
];

/**
 * ISO 3166-1 alpha-2 codes for the shipping countries. Third parties
 * (carriers) speak codes, the checkout form speaks
 * names — this is the bridge. Unknown input falls back to NG, which is the
 * right guess for this store by an overwhelming margin.
 */
const COUNTRY_CODES: Record<string, string> = {
  Nigeria: 'NG',
  'United Kingdom': 'GB',
  'United States': 'US',
  Canada: 'CA',
  Ireland: 'IE',
  Germany: 'DE',
  France: 'FR',
  Netherlands: 'NL',
  Italy: 'IT',
  Spain: 'ES',
  Belgium: 'BE',
  Sweden: 'SE',
  Norway: 'NO',
  Denmark: 'DK',
  Switzerland: 'CH',
  Austria: 'AT',
  Portugal: 'PT',
  Australia: 'AU',
  'New Zealand': 'NZ',
  'United Arab Emirates': 'AE',
  Qatar: 'QA',
  'Saudi Arabia': 'SA',
  'South Africa': 'ZA',
  Ghana: 'GH',
  Kenya: 'KE',
  China: 'CN',
  Japan: 'JP',
  Malaysia: 'MY',
};

export function countryCode(name: string | null | undefined): string {
  return COUNTRY_CODES[(name || DEFAULT_COUNTRY).trim()] ?? 'NG';
}
