import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, type NavigateOptions } from 'react-router-dom';
import type { AppLocale } from './constants';
import { isAppLocale } from './icuLocale';
import { toLocalizedPath } from './localePath';

export function useCurrentAppLocale(): AppLocale {
  const { i18n } = useTranslation();
  return (isAppLocale(i18n.language) ? i18n.language : 'ru') as AppLocale;
}

/** Returns a function that maps a logical path (`/login`) to the current locale prefix. */
export function useLocalizedPath() {
  const lang = useCurrentAppLocale();
  return useCallback((logicalPath: string) => toLocalizedPath(logicalPath, lang), [lang]);
}

export function useLocalizedNavigate() {
  const navigate = useNavigate();
  const lp = useLocalizedPath();
  return useCallback(
    (logicalPath: string, options?: NavigateOptions) => navigate(lp(logicalPath), options),
    [navigate, lp],
  );
}
