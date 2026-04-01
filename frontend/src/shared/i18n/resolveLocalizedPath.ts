import type { AppLocale } from './constants';
import i18n from './i18n';
import { isAppLocale } from './icuLocale';
import { toLocalizedPath } from './localePath';

/** Current UI locale from i18n (defaults to ru). Use for navigate() when hooks are awkward. */
export function currentAppLocaleFromI18n(): AppLocale {
  return (isAppLocale(i18n.language) ? i18n.language : 'ru') as AppLocale;
}

/** Build router pathname for a logical path using the active i18n language. */
export function resolveLocalizedPath(logicalPath: string): string {
  return toLocalizedPath(logicalPath, currentAppLocaleFromI18n());
}
