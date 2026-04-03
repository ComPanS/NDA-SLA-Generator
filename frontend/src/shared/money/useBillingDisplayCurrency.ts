import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { i18n as I18nInstance } from 'i18next';
import {
  BillingDisplayCurrency,
  BILLING_CURRENCY_LOCKED_KEY,
  BILLING_CURRENCY_STORAGE_KEY,
  BILLING_DISPLAY_CURRENCIES,
  defaultCurrencyForLanguage,
  isBillingDisplayCurrency,
} from './billingCurrency';

/** Base language code (e.g. en from en-US) for default display currency. */
function languageBaseForCurrency(i18n: I18nInstance): string {
  const raw = i18n.resolvedLanguage || i18n.language || 'ru';
  return raw.split('-')[0]?.toLowerCase() ?? 'ru';
}

function readInitialCurrency(i18n: I18nInstance): BillingDisplayCurrency {
  const langKey = languageBaseForCurrency(i18n);
  if (typeof window === 'undefined') return defaultCurrencyForLanguage(langKey);
  const locked = window.localStorage.getItem(BILLING_CURRENCY_LOCKED_KEY) === '1';
  const raw = window.localStorage.getItem(BILLING_CURRENCY_STORAGE_KEY);
  if (locked && raw && isBillingDisplayCurrency(raw)) {
    return raw;
  }
  return defaultCurrencyForLanguage(langKey);
}

export function useBillingDisplayCurrency() {
  const { i18n } = useTranslation();
  const [currency, setCurrency] = useState<BillingDisplayCurrency>(() =>
    readInitialCurrency(i18n),
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const locked = window.localStorage.getItem(BILLING_CURRENCY_LOCKED_KEY) === '1';
    if (locked) return;
    const next = defaultCurrencyForLanguage(languageBaseForCurrency(i18n));
    setCurrency(next);
    window.localStorage.setItem(BILLING_CURRENCY_STORAGE_KEY, next);
  }, [i18n.language, i18n.resolvedLanguage]);

  const setCurrencyExplicit = useCallback((next: BillingDisplayCurrency) => {
    setCurrency(next);
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(BILLING_CURRENCY_STORAGE_KEY, next);
    window.localStorage.setItem(BILLING_CURRENCY_LOCKED_KEY, '1');
  }, []);

  const isPaymentEnabled = currency === 'RUB';

  return {
    currency,
    setCurrency: setCurrencyExplicit,
    currencies: BILLING_DISPLAY_CURRENCIES,
    isPaymentEnabled,
  };
}
