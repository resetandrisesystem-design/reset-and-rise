import { DEFAULT_CURRENCY, currencyForCountry } from "@/lib/currency";

/**
 * Countries where Stripe's Adaptive Pricing shows the buyer their local
 * currency at checkout. Copied from the "Supported currencies" section of
 * https://docs.stripe.com/payments/currencies/localize-prices/adaptive-pricing
 * on 22 October 2026. Stripe's list does not include Nigeria, Ghana, Egypt or
 * Ethiopia, so visitors there see and pay the GBP price.
 */
export const ADAPTIVE_PRICING_COUNTRIES = new Set([
  // North America
  "AG", "AW", "BS", "BB", "BZ", "BM", "CA", "KY", "CR", "DM", "DO", "GD", "GT", "HT", "HN", "MX", "JM", "PA", "KN", "LC", "VC", "TT", "US",
  // South America
  "BR", "BO", "CO", "CL", "FK", "GY", "PY", "PE", "UY",
  // Europe
  "AL", "AD", "AT", "BE", "BA", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GI", "GR", "HU", "IS", "IE", "IT", "LV", "LT", "LU", "MT", "MC", "MD", "ME", "NL", "MK", "NO", "PL", "PT", "RO", "SM", "RS", "SK", "SI", "ES", "SE", "CH", "UA", "GB", "VA",
  // Asia
  "AF", "AM", "AZ", "BD", "BN", "KH", "CN", "GE", "HK", "IN", "ID", "IL", "JP", "KZ", "KG", "MO", "MY", "MV", "MN", "NP", "PK", "PH", "QA", "SA", "SG", "KR", "LK", "TW", "TJ", "TH", "TR", "AE", "UZ", "VN", "YE",
  // Oceania
  "AU", "PF", "NC", "NZ", "WF",
  // Africa
  "AO", "DZ", "BJ", "BW", "BF", "BI", "CM", "CV", "CF", "TD", "CI", "DJ", "GQ", "GA", "GM", "GN", "GW", "KE", "LR", "MG", "ML", "MU", "MA", "MZ", "NA", "NE", "CG", "RW", "SH", "ST", "SN", "ZA", "TZ", "TG", "UG", "ZM",
]);

/** The currency Stripe Checkout will present to a visitor from this country,
 *  or null when checkout stays in GBP: the UK itself, a country Stripe does
 *  not localise for, or one whose currency this app cannot name. */
export function checkoutCurrencyFor(country: string | null | undefined): string | null {
  if (!country || !ADAPTIVE_PRICING_COUNTRIES.has(country.toUpperCase())) return null;
  const code = currencyForCountry(country);
  return code && code !== DEFAULT_CURRENCY ? code : null;
}
