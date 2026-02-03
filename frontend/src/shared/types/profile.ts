import { SubscriptionPlan, SubscriptionStatus } from './billing';

export interface UserSubscriptionSummary {
  id: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  expiresAt: string | null;
  updatedAt: string;
}

export interface UserProfile {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  subscription: UserSubscriptionSummary | null;
}
