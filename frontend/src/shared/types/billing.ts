export type SubscriptionPlan = 'free' | 'pro' | 'pay_per_use';
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due';

export interface Subscription {
  id: string;
  user_id: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface BillingInfo {
  subscription: Subscription | null;
  documents_generated: number;
  documents_limit: number;
}
