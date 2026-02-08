/**
 * Centralized Subscription Configuration (Frontend Mirror)
 * Keep in sync with backend/src/config/subscriptions.ts
 */

import { SubscriptionPlan } from '@/shared/types';

export interface PlanLimits {
  price: number;
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

// One-time payment for extra contract when limit reached
export const SINGLE_CONTRACT_PRICE = 99;

export const SUBSCRIPTION_PLANS: Record<SubscriptionPlan, PlanLimits> = {
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
    firstMonthPrice: 100,
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
  standard: {
    price: 790,
    firstMonthPrice: 100,
    contractsPerMonth: 100,
    maxTemplates: 10,
    exportFormats: ['pdf', 'docx'],
    aiClarifications: 10,
    hasRiskCheck: true,
    hasSections: true,
    hasStatuses: true,
    hasVersions: false,
    hasPrioritySupport: false,
  },
  pro: {
    price: 1490,
    firstMonthPrice: 100,
    contractsPerMonth: -1,
    maxTemplates: -1,
    exportFormats: ['pdf', 'docx'],
    aiClarifications: -1,
    hasRiskCheck: true,
    hasSections: true,
    hasStatuses: true,
    hasVersions: true,
    hasPrioritySupport: true,
  },
};

export const SUBSCRIPTION_NAMES: Record<SubscriptionPlan, string> = {
  freemium: 'Freemium',
  basic: 'Basic',
  standard: 'Standard',
  pro: 'Pro',
};

export const SUBSCRIPTION_DESCRIPTIONS: Record<SubscriptionPlan, string> = {
  freemium: 'Базовый бесплатный доступ',
  basic: 'Для индивидуальных пользователей',
  standard: 'Для активных пользователей',
  pro: 'Безлимитный доступ для профессионалов',
};

export const SUBSCRIPTION_FEATURES: Record<SubscriptionPlan, string[]> = {
  freemium: [
    '3 договора в месяц',
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
  standard: [
    '100 договоров в месяц',
    '10 шаблонов',
    'Экспорт в PDF и DOCX',
    '10 уточнений на документ от нейросети',
    'Проверка на юридические риски',
    'Разделы договоров',
    'Статусы договоров',
  ],
  pro: [
    'Безлимит договоров',
    'Безлимит шаблонов',
    'Экспорт в PDF и DOCX',
    'Безлимит уточнений от нейросети',
    'Проверка на юридические риски',
    'Разделы договоров',
    'Статусы договоров',
    'Приоритетная поддержка',
    'История версий договоров',
  ],
};

// Helper to check if a limit is unlimited
export function isUnlimited(limit: number): boolean {
  return limit === -1;
}

// Helper to format limit display
export function formatLimit(limit: number): string {
  return isUnlimited(limit) ? 'Безлимит' : String(limit);
}

// Helper to get plan by name
export function getPlanLimits(plan: SubscriptionPlan): PlanLimits {
  return SUBSCRIPTION_PLANS[plan];
}

// Helper to get next upgrade plan
export function getNextPlan(currentPlan: SubscriptionPlan): SubscriptionPlan | null {
  const planOrder: SubscriptionPlan[] = ['freemium', 'basic', 'standard', 'pro'];
  const currentIndex = planOrder.indexOf(currentPlan);
  if (currentIndex === -1 || currentIndex === planOrder.length - 1) {
    return null;
  }
  return planOrder[currentIndex + 1] ?? null;
}

// Get all available upgrade options from current plan
export function getUpgradeOptions(currentPlan: SubscriptionPlan): SubscriptionPlan[] {
  const planOrder: SubscriptionPlan[] = ['freemium', 'basic', 'standard', 'pro'];
  const currentIndex = planOrder.indexOf(currentPlan);
  return planOrder.slice(currentIndex + 1);
}
