import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  BillingDisplayCurrency,
  BILLING_CURRENCY_LOCKED_KEY,
  BILLING_CURRENCY_STORAGE_KEY,
  BILLING_DISPLAY_CURRENCIES,
  defaultCurrencyForLanguage,
  isBillingDisplayCurrency,
} from './billingCurrency';

function readInitialCurrency(lang: string): BillingDisplayCurrency {
  if (typeof window === 'undefined') return defaultCurrencyForLanguage(lang);
  const locked = window.localStorage.getItem(BILLING_CURRENCY_LOCKED_KEY) === '1';
  const raw = window.localStorage.getItem(BILLING_CURRENCY_STORAGE_KEY);
  if (locked && raw && isBillingDisplayCurrency(raw)) {
    return raw;
  }
  return defaultCurrencyForLanguage(lang);
}

export function useBillingDisplayCurrency() {
  const { i18n } = useTranslation();
  const [currency, setCurrency] = useState<BillingDisplayCurrency>(() =>
    readInitialCurrency(i18n.language),
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const locked = window.localStorage.getItem(BILLING_CURRENCY_LOCKED_KEY) === '1';
    if (locked) return;
    const next = defaultCurrencyForLanguage(i18n.language);
    setCurrency(next);
    window.localStorage.setItem(BILLING_CURRENCY_STORAGE_KEY, next);
  }, [i18n.language]);

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
