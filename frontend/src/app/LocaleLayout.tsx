import { useEffect } from 'react';
import { Outlet, useParams } from 'react-router-dom';
import i18n from '@/shared/i18n/i18n';
import { isUrlPrefixLocale } from '@/shared/i18n/localePath';
import { NotFound } from '@/pages/NotFound';

/**
 * Syncs i18n to URL prefix (en|es|th). Invalid first segment falls through to 404.
 */
export const LocaleLayout = () => {
  const { locale } = useParams<{ locale: string }>();

  useEffect(() => {
    if (locale && isUrlPrefixLocale(locale)) {
      void i18n.changeLanguage(locale);
    }
  }, [locale]);

  if (!locale || !isUrlPrefixLocale(locale)) {
    return <NotFound />;
  }

  return <Outlet />;
};
