import type { AppLocale } from './constants';

/** ISO 3166-1 alpha-2 codes where Spanish is the primary or a major official language. */
const SPANISH_SPEAKING = new Set([
  'ES',
  'MX',
  'AR',
  'CO',
  'CL',
  'PE',
  'VE',
  'EC',
  'GT',
  'CU',
  'BO',
  'DO',
  'HN',
  'PY',
  'SV',
  'NI',
  'CR',
  'PA',
  'UY',
  'PR',
  'GQ',
  'AD',
]);

const CIS_RUSSIAN = new Set(['RU', 'BY', 'KZ']);

export function localeFromCountryCode(countryCode: string | null | undefined): AppLocale | null {
  if (!countryCode) return null;
  const c = countryCode.trim().toUpperCase();
  if (c.length !== 2) return null;
  if (c === 'TH') return 'th';
  if (SPANISH_SPEAKING.has(c)) return 'es';
  if (CIS_RUSSIAN.has(c)) return 'ru';
  return 'en';
}

export function localeFromNavigator(): AppLocale {
  if (typeof navigator === 'undefined') return 'en';
  const raw = navigator.language || (navigator.languages && navigator.languages[0]) || 'en';
  const low = raw.toLowerCase();
  if (low.startsWith('ru')) return 'ru';
  if (low.startsWith('th')) return 'th';
  if (low.startsWith('es')) return 'es';
  return 'en';
}
