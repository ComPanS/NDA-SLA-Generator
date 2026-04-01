export type BillingDisplayCurrency = 'RUB' | 'USD' | 'EUR' | 'GBP' | 'THB';

export const BILLING_DISPLAY_CURRENCIES: BillingDisplayCurrency[] = [
  'RUB',
  'USD',
  'EUR',
  'GBP',
  'THB',
];

export const BILLING_CURRENCY_STORAGE_KEY = 'billingDisplayCurrency';
export const BILLING_CURRENCY_LOCKED_KEY = 'billingDisplayCurrencyUserLocked';

export function isBillingDisplayCurrency(v: string): v is BillingDisplayCurrency {
  return (BILLING_DISPLAY_CURRENCIES as string[]).includes(v);
}

export function defaultCurrencyForLanguage(lang: string): BillingDisplayCurrency {
  const base = (lang || 'ru').split('-')[0]?.toLowerCase() ?? 'ru';
  if (base === 'en') return 'USD';
  if (base === 'es') return 'EUR';
  if (base === 'th') return 'THB';
  return 'RUB';
}

export function localeForCurrency(currency: BillingDisplayCurrency): string {
  switch (currency) {
    case 'RUB':
      return 'ru-RU';
    case 'EUR':
      return 'de-DE';
    case 'GBP':
      return 'en-GB';
    case 'THB':
      return 'th-TH';
    default:
      return 'en-US';
  }
}

/** rates from API: foreign currency units per 1 RUB */
export function convertRubToDisplay(
  amountRub: number,
  currency: BillingDisplayCurrency,
  rates: Partial<Record<BillingDisplayCurrency, number>> | undefined,
): number {
  if (currency === 'RUB') return amountRub;
  const r = rates?.[currency];
  if (r == null || !Number.isFinite(r)) return amountRub;
  return amountRub * r;
}

/** Rounded display amounts for subscription cards */
export function formatBillingMoney(amount: number, currency: BillingDisplayCurrency): string {
  const rounded =
    currency === 'RUB' || currency === 'THB'
      ? Math.round(amount)
      : Math.round(amount * 100) / 100;

  const maxFrac = rounded % 1 === 0 ? 0 : 2;

  try {
    return new Intl.NumberFormat(localeForCurrency(currency), {
      style: 'currency',
      currency,
      maximumFractionDigits: maxFrac,
      minimumFractionDigits: 0,
    }).format(rounded);
  } catch {
    return `${rounded} ${currency}`;
  }
}

export function formatRubAmountForUi(
  rub: number | null | undefined,
  options: {
    currency: BillingDisplayCurrency;
    rates: Partial<Record<BillingDisplayCurrency, number>> | undefined;
    fxFailed: boolean;
    locale: string;
    freeLabel: string;
  },
): string {
  const { currency, rates, fxFailed, locale, freeLabel } = options;
  if (rub === null || rub === undefined) return '—';
  if (rub === 0) return freeLabel;
  if (fxFailed || !rates || currency === 'RUB') {
    return `${new Intl.NumberFormat(locale).format(rub)} ₽`;
  }
  const conv = convertRubToDisplay(rub, currency, rates);
  return formatBillingMoney(conv, currency);
}
