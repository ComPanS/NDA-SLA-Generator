import { API_BASE_URL } from '@/shared/api/client';
import { LOCALE_USER_CHOICE_KEY, type AppLocale } from './constants';
import { isAppLocale } from './icuLocale';
import { localeFromCountryCode, localeFromNavigator } from './localeFromCountry';
import {
  getLocaleFromBrowserPath,
  parseLocaleFromPath,
  toLocalizedPath,
} from './localePath';
import i18n from './i18n';

function replaceUrlPreservingQuery(pathname: string) {
  if (typeof window === 'undefined') return;
  const target = pathname + window.location.search + window.location.hash;
  if (target !== window.location.pathname + window.location.search + window.location.hash) {
    window.history.replaceState(null, '', target);
  }
}

/**
 * Resolves initial language:
 * 1) URL prefix /en|es|th
 * 2) Else align URL with saved user choice (replace to prefixed path if non-ru)
 * 3) Else geo → optional replace to prefixed path
 * 4) Else navigator
 * Unprefixed URLs default to ru once resolved.
 */
export async function bootstrapLocale(): Promise<void> {
  const fromPath = getLocaleFromBrowserPath();
  if (fromPath) {
    await i18n.changeLanguage(fromPath);
    return;
  }

  const saved = localStorage.getItem(LOCALE_USER_CHOICE_KEY);
  if (saved && isAppLocale(saved)) {
    if (saved !== 'ru') {
      const { logicalPath } = parseLocaleFromPath(window.location.pathname);
      const target = toLocalizedPath(logicalPath, saved);
      replaceUrlPreservingQuery(target);
    }
    await i18n.changeLanguage(saved);
    return;
  }

  try {
    const res = await fetch(`${API_BASE_URL}/public/geo-hint`, {
      credentials: 'include',
    });
    if (res.ok) {
      const data = (await res.json()) as { countryCode?: string | null };
      const fromGeo = localeFromCountryCode(data.countryCode ?? null);
      if (fromGeo && fromGeo !== 'ru') {
        const { logicalPath } = parseLocaleFromPath(window.location.pathname);
        const target = toLocalizedPath(logicalPath, fromGeo);
        replaceUrlPreservingQuery(target);
        await i18n.changeLanguage(fromGeo);
        return;
      }
    }
  } catch {
    /* fall through */
  }

  const navLocale = localeFromNavigator();
  if (navLocale !== 'ru') {
    const { logicalPath } = parseLocaleFromPath(window.location.pathname);
    replaceUrlPreservingQuery(toLocalizedPath(logicalPath, navLocale));
    await i18n.changeLanguage(navLocale);
    return;
  }

  await i18n.changeLanguage('ru');
}

export function persistUserLocale(lang: AppLocale): void {
  localStorage.setItem(LOCALE_USER_CHOICE_KEY, lang);
}
