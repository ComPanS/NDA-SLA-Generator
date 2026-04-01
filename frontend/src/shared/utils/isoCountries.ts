/** ISO 3166-1 alpha-2 list for country pickers (uses Intl.supportedValuesOf when available). */

const FALLBACK_ALPHA2 = [
  'RU',
  'US',
  'GB',
  'DE',
  'FR',
  'ES',
  'IT',
  'PL',
  'NL',
  'BE',
  'AT',
  'CH',
  'SE',
  'NO',
  'FI',
  'DK',
  'IE',
  'PT',
  'GR',
  'CZ',
  'UA',
  'BY',
  'KZ',
  'UZ',
  'GE',
  'AM',
  'AZ',
  'TR',
  'IL',
  'AE',
  'SA',
  'IN',
  'CN',
  'JP',
  'KR',
  'SG',
  'MY',
  'TH',
  'VN',
  'ID',
  'PH',
  'AU',
  'NZ',
  'CA',
  'MX',
  'BR',
  'AR',
  'CL',
  'CO',
  'PE',
  'ZA',
  'EG',
  'NG',
  'KE',
  'RO',
  'HU',
  'BG',
  'HR',
  'SK',
  'SI',
  'LT',
  'LV',
  'EE',
];

export function listAlpha2Regions(): string[] {
  try {
    const supported = (
      Intl as typeof Intl & { supportedValuesOf?: (key: string) => string[] }
    ).supportedValuesOf;
    if (typeof supported === 'function') {
      return supported
        .call(Intl, 'region')
        .filter((c) => /^[A-Z]{2}$/.test(c) && c !== 'ZZ' && c !== 'EU');
    }
  } catch {
    /* ignore */
  }
  return [...FALLBACK_ALPHA2];
}

export type CountryOption = { code: string; label: string };

export function countryOptionsForLocale(displayLocale: string): CountryOption[] {
  const codes = listAlpha2Regions();
  try {
    const dn = new Intl.DisplayNames([displayLocale], { type: 'region' });
    return codes
      .map((code) => ({ code, label: dn.of(code) || code }))
      .sort((a, b) => a.label.localeCompare(b.label, displayLocale, { sensitivity: 'base' }));
  } catch {
    return codes.map((code) => ({ code, label: code })).sort((a, b) => a.code.localeCompare(b.code));
  }
}
