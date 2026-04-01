import type { AppLocale } from './constants';

/** BCP 47 tag for Intl / number formatting. */
export function icuLocaleFor(lang: string): string {
  switch (lang) {
    case 'ru':
      return 'ru-RU';
    case 'es':
      return 'es-ES';
    case 'th':
      return 'th-TH';
    case 'en':
    default:
      return 'en-US';
  }
}

export function isAppLocale(v: string): v is AppLocale {
  return v === 'ru' || v === 'en' || v === 'es' || v === 'th';
}
