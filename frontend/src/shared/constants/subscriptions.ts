import { SubscriptionPlan } from '@/shared/types';

export const SUBSCRIPTION_LIMITS: Record<SubscriptionPlan, { documents: number; price: number }> = {
  free: {
    documents: 1,
    price: 0,
  },
  pro: {
    documents: -1, // unlimited
    price: 1990,
  },
  pay_per_use: {
    documents: -1, // unlimited
    price: 99, // per document
  },
};

export const SUBSCRIPTION_NAMES: Record<SubscriptionPlan, string> = {
  free: 'Free',
  pro: 'Pro',
  pay_per_use: 'Pay-per-use',
};

export const SUBSCRIPTION_DESCRIPTIONS: Record<SubscriptionPlan, string> = {
  free: '1 документ в месяц',
  pro: 'Безлимит документов',
  pay_per_use: 'Оплата по факту',
};
