import type { AppLocale } from './constants';

/** Locales that appear as the first URL segment (Russian has no prefix). */
export const URL_PREFIX_LOCALES = ['en', 'es', 'th'] as const;
export type UrlPrefixLocale = (typeof URL_PREFIX_LOCALES)[number];

export function isUrlPrefixLocale(v: string): v is UrlPrefixLocale {
  return v === 'en' || v === 'es' || v === 'th';
}

/**
 * Logical pathname without /en|es|th prefix — always starts with `/`.
 * Examples: `/`, `/login`, `/contract/abc`.
 */
export function parseLocaleFromPath(pathname: string): {
  urlLocale: UrlPrefixLocale | null;
  logicalPath: string;
} {
  const normalized = pathname.startsWith('/') ? pathname : `/${pathname}`;
  const segments = normalized.split('/').filter(Boolean);
  if (segments.length === 0) {
    return { urlLocale: null, logicalPath: '/' };
  }
  const first = segments[0]!;
  if (isUrlPrefixLocale(first)) {
    const rest = segments.slice(1);
    return {
      urlLocale: first,
      logicalPath: rest.length ? `/${rest.join('/')}` : '/',
    };
  }
  return { urlLocale: null, logicalPath: normalized };
}

/** Map URL segment to AppLocale; missing prefix => Russian. */
export function appLocaleFromPath(pathname: string): AppLocale {
  const { urlLocale } = parseLocaleFromPath(pathname);
  return urlLocale ?? 'ru';
}

/**
 * Build pathname for the app router.
 * @param logicalPath e.g. `/login`, `/`, `/contract/x`
 * @param lang target UI locale
 */
export function toLocalizedPath(logicalPath: string, lang: AppLocale): string {
  const p = logicalPath.startsWith('/') ? logicalPath : `/${logicalPath}`;
  if (lang === 'ru') {
    return p === '' ? '/' : p;
  }
  if (p === '/') {
    return `/${lang}`;
  }
  return `/${lang}${p}`;
}

export function getLocaleFromBrowserPath(): UrlPrefixLocale | null {
  if (typeof window === 'undefined') return null;
  return parseLocaleFromPath(window.location.pathname).urlLocale;
}
