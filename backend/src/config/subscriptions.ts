/**
 * Centralized Subscription Configuration
 * Edit this file to change all subscription limits and pricing
 */

export type SubscriptionPlanType = 'freemium' | 'basic' | 'pro';

export interface PlanLimits {
  price: number; // in rubles
  /** Optional discounted price for the first month */
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
}

// Billing interval in milliseconds
// For testing: 2 minutes
// For production: 30 * 24 * 60 * 60 * 1000 (30 days)
import { env } from './env';

export const SUBSCRIPTION_BILLING_INTERVAL_MS = env.subscriptionBillingIntervalMs;

// One-time payment for extra contract when limit reached
export const SINGLE_CONTRACT_PRICE = 99; // rubles

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
  },
  pro: {
    price: 990,
    firstMonthPrice: 290,
    contractsPerMonth: -1, // unlimited
    maxTemplates: -1, // unlimited
    exportFormats: ['pdf', 'docx'],
    aiClarifications: -1, // unlimited
    hasRiskCheck: true,
    hasSections: true,
    hasStatuses: true,
    hasVersions: true,
    hasPrioritySupport: true,
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
