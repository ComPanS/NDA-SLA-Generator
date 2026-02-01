export interface AdminLoginRequest {
  login: string;
  password: string;
}

export interface AdminLoginResponse {
  token: string;
  token_type: 'bearer';
  expires_in: number;
}

export interface AdminOverview {
  users: {
    total: number;
    active: number;
    admin: number;
    new_last_30d: number;
  };
  documents: {
    total: number;
    by_status: Record<string, number>;
  };
  subscriptions: {
    total: number;
    by_plan_status: Array<{ plan: string; status: string; count: number }>;
  };
  guests: {
    total: number;
  };
}

export interface AdminUserSummary {
  id: string;
  email: string;
  isActive: boolean;
  isAdmin: boolean;
  createdAt: string;
  updatedAt: string;
  documentsCount: number;
  subscriptionsCount: number;
  subscriptionPlan: string | null;
  subscriptionStatus: string | null;
}
