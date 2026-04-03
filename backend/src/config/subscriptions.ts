/**
 * Centralized Subscription Configuration
 * Edit this file to change all subscription limits and pricing.
 *
 * Charging (YooKassa) uses `price` / `firstMonthPrice` in RUB only.
 * `pricesByCurrency` is for UI display (PPP-oriented); each foreign amount must convert
 * to >= the RUB price at validation rates (see subscriptionDisplayValidation + tests).
 */

export type SubscriptionPlanType = 'freemium' | 'basic' | 'pro';

/** Currencies shown in the billing UI (must match frontend). */
export const BILLING_DISPLAY_CURRENCIES = ['RUB', 'USD', 'EUR', 'GBP', 'THB'] as const;
export type BillingDisplayCurrency = (typeof BILLING_DISPLAY_CURRENCIES)[number];

export interface PlanCurrencyAmounts {
  monthly: number;
  /** Same semantics as firstMonthPrice: null if no separate first-month promo row */
  first_month: number | null;
}

export interface PlanLimits {
  price: number; // charge amount in rubles
  /** Optional discounted first month (rubles), charged via YooKassa */
  firstMonthPrice?: number;
  contractsPerMonth: number; // -1 = unlimited
  maxTemplates: number; // -1 = unlimited
  exportFormats: readonly string[];
  aiClarifications: number; // -1 = unlimited
  hasRiskCheck: boolean;
  hasSections: boolean;
  hasStatuses: boolean;
  hasVersions: boolean;
  hasPrioritySupport: boolean;
  /** Display-only list prices per currency (monthly + first month). RUB must match price/firstMonthPrice. */
  pricesByCurrency: Record<BillingDisplayCurrency, PlanCurrencyAmounts>;
}

// Billing interval in milliseconds
// For testing: 2 minutes
// For production: 30 * 24 * 60 * 60 * 1000 (30 days)
import { env } from './env';

export const SUBSCRIPTION_BILLING_INTERVAL_MS = env.subscriptionBillingIntervalMs;

function amounts(monthly: number, firstMonth: number | null): PlanCurrencyAmounts {
  return { monthly, first_month: firstMonth };
}

const FREEMIUM_AMOUNTS: Record<BillingDisplayCurrency, PlanCurrencyAmounts> = {
  RUB: amounts(0, 0),
  USD: amounts(0, 0),
  EUR: amounts(0, 0),
  GBP: amounts(0, 0),
  THB: amounts(0, 0),
};

/** One-off contract purchase display/charge base in RUB; other keys are display-only. */
export const SINGLE_CONTRACT_PRICES_BY_CURRENCY: Record<BillingDisplayCurrency, number> = {
  RUB: 99,
  USD: 1.49,
  EUR: 1.29,
  GBP: 1.09,
  THB: 49,
};

/** @deprecated Use SINGLE_CONTRACT_PRICES_BY_CURRENCY.RUB */
export const SINGLE_CONTRACT_PRICE = SINGLE_CONTRACT_PRICES_BY_CURRENCY.RUB;

export const SUBSCRIPTION_PLANS: Record<SubscriptionPlanType, PlanLimits> = {
  freemium: {
    price: 0,
    firstMonthPrice: 0,
    contractsPerMonth: 3,
    maxTemplates: 1,
    exportFormats: ['pdf'],
    aiClarifications: 1,
    hasRiskCheck: false,
    hasSections: false,
    hasStatuses: false,
    hasVersions: false,
    hasPrioritySupport: false,
    pricesByCurrency: FREEMIUM_AMOUNTS,
  },
  basic: {
    price: 290,
    firstMonthPrice: 99,
    contractsPerMonth: 20,
    maxTemplates: 3,
    exportFormats: ['pdf', 'docx'],
    aiClarifications: 5,
    hasRiskCheck: false,
    hasSections: true,
    hasStatuses: true,
    hasVersions: false,
    hasPrioritySupport: false,
    pricesByCurrency: {
      RUB: amounts(290, 99),
      USD: amounts(4.99, 1.69),
      EUR: amounts(4.49, 1.49),
      GBP: amounts(3.99, 1.29),
      THB: amounts(129, 49),
    },
  },
  pro: {
    price: 990,
    firstMonthPrice: 290,
    contractsPerMonth: -1,
    maxTemplates: -1,
    exportFormats: ['pdf', 'docx'],
    aiClarifications: -1,
    hasRiskCheck: true,
    hasSections: true,
    hasStatuses: true,
    hasVersions: true,
    hasPrioritySupport: true,
    pricesByCurrency: {
      RUB: amounts(990, 290),
      USD: amounts(14.99, 4.99),
      EUR: amounts(13.99, 4.49),
      GBP: amounts(10.99, 3.99),
      THB: amounts(429, 129),
    },
  },
} as const;

// Plan display names (Russian)
export const SUBSCRIPTION_NAMES: Record<SubscriptionPlanType, string> = {
  freemium: 'Стартовый',
  basic: 'Профессиональный',
  pro: 'Бизнес',
};

// Plan descriptions (Russian)
export const SUBSCRIPTION_DESCRIPTIONS: Record<SubscriptionPlanType, string> = {
  freemium: 'Бесплатный старт для первых договоров',
  basic: 'Все базовые функции без ограничений для фрилансера',
  pro: 'Максимум возможностей и поддержки для бизнеса',
};

// Plan features list for display (Russian)
export const SUBSCRIPTION_FEATURES: Record<SubscriptionPlanType, string[]> = {
  freemium: [
    '3 договоров в месяц',
    '1 шаблон',
    'Экспорт в PDF',
    '1 уточнение на документ от нейросети',
  ],
  basic: [
    '20 договоров в месяц',
    '3 шаблона',
    'Экспорт в PDF и DOCX',
    '5 уточнений на документ от нейросети',
    'Разделы договоров',
    'Статусы договоров',
  ],
  pro: [
    'Все из тарифа «Профессиональный»',
    'Безлимит договоров',
    'Безлимит шаблонов',
    'Экспорт в PDF и DOCX',
    'Безлимит уточнений от нейросети',
    'Проверка на юридические риски',
    'Разделы договоров',
    'Статусы договоров',
    'История версий договоров',
    'Приоритетная поддержка',
  ],
};

export function pricesByCurrencyToApi(limits: PlanLimits): Record<
  string,
  { monthly: number; first_month: number | null }
> {
  const out: Record<string, { monthly: number; first_month: number | null }> = {};
  for (const c of BILLING_DISPLAY_CURRENCIES) {
    const row = limits.pricesByCurrency[c];
    out[c] = { monthly: row.monthly, first_month: row.first_month };
  }
  return out;
}

export function singleContractPricesToApi(): Record<string, number> {
  const out: Record<string, number> = {};
  for (const c of BILLING_DISPLAY_CURRENCIES) {
    out[c] = SINGLE_CONTRACT_PRICES_BY_CURRENCY[c];
  }
  return out;
}

// Helper to check if a limit is unlimited
export function isUnlimited(limit: number): boolean {
  return limit === -1;
}

// Helper to get plan by name
export function getPlanLimits(plan: SubscriptionPlanType): PlanLimits {
  return SUBSCRIPTION_PLANS[plan];
}

// Helper to get next upgrade plan
export function getNextPlan(currentPlan: SubscriptionPlanType): SubscriptionPlanType | null {
  const planOrder: SubscriptionPlanType[] = ['freemium', 'basic', 'pro'];
  const currentIndex = planOrder.indexOf(currentPlan);
  if (currentIndex === -1 || currentIndex === planOrder.length - 1) {
    return null;
  }
  return planOrder[currentIndex + 1];
}

// Get all available upgrade options from current plan
export function getUpgradeOptions(currentPlan: SubscriptionPlanType): SubscriptionPlanType[] {
  const planOrder: SubscriptionPlanType[] = ['freemium', 'basic', 'pro'];
  const currentIndex = planOrder.indexOf(currentPlan);
  return planOrder.slice(currentIndex + 1);
}
