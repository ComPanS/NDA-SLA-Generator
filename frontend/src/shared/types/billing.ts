export type SubscriptionPlan = 'freemium' | 'basic' | 'standard' | 'pro';
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due';
export type PaymentType = 'subscription' | 'single_contract';
export type PaymentStatus = 'pending' | 'succeeded' | 'canceled' | 'refunded';

export interface Subscription {
  id?: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  expires_at: string | null;
  auto_renew: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface UsageInfo {
  used: number;
  limit: number;
  extraPaid?: number;
  isUnlimited: boolean;
}

export interface FeaturesInfo {
  hasRiskCheck: boolean;
  hasSections: boolean;
  hasStatuses: boolean;
  hasDocxExport: boolean;
  hasVersions: boolean;
  hasPrioritySupport: boolean;
}

export interface UsageSummary {
  plan: SubscriptionPlan;
  planName: string;
  contracts: UsageInfo;
  clarifications: UsageInfo;
  templates: UsageInfo;
  features: FeaturesInfo;
  periodStart: string;
}

export interface UpgradeOption {
  plan: SubscriptionPlan;
  name: string;
  price: number;
  newLimit: number;
}

export interface LimitReachedError {
  detail: string;
  code: 'LIMIT_REACHED';
  limit_type: 'contracts' | 'clarifications' | 'templates';
  current_usage: number;
  limit: number;
  upgrade_options: UpgradeOption[];
  single_contract_price?: number;
}

export interface PlanLimits {
  contracts_per_month: number;
  max_templates: number;
  ai_clarifications: number;
  export_formats: string[];
  has_risk_check: boolean;
  has_sections: boolean;
  has_statuses: boolean;
  has_priority_support: boolean;
}

export interface PlanInfo {
  id: SubscriptionPlan;
  name: string;
  price: number;
  first_month_price?: number | null;
  first_month_discount_available?: boolean;
  features: string[];
  limits: PlanLimits;
}

export interface PlansResponse {
  plans: PlanInfo[];
  single_contract_price: number;
}

export interface Payment {
  id: string;
  amount: number;
  currency: string;
  type: PaymentType;
  status: PaymentStatus;
  description: string | null;
  created_at: string;
}

export interface PaymentsResponse {
  payments: Payment[];
}

export interface SubscribeResponse {
  payment_url: string;
  payment_id: string;
}

export interface PaymentStatusResponse {
  id: string;
  yookassa_id: string;
  status: string;
  amount: number;
  type: PaymentType;
  created_at: string;
}
