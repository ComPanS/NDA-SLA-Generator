import apiClient from './client';
import {
  Subscription,
  UsageSummary,
  PlansResponse,
  SubscribeResponse,
  PaymentsResponse,
  PaymentStatusResponse,
  SubscriptionPlan,
  FxRatesResponse,
} from '@/shared/types';

export const billingApi = {
  // Get current subscription
  getSubscription: async (): Promise<Subscription> => {
    const response = await apiClient.get<Subscription>('/billing');
    return response.data;
  },

  // Get usage summary
  getUsage: async (): Promise<UsageSummary> => {
    const response = await apiClient.get<UsageSummary>('/billing/usage');
    return response.data;
  },

  // Get available plans
  getPlans: async (): Promise<PlansResponse> => {
    const response = await apiClient.get<PlansResponse>('/billing/plans');
    return response.data;
  },

  getFxRates: async (): Promise<FxRatesResponse> => {
    const response = await apiClient.get<FxRatesResponse>('/billing/fx-rates');
    return response.data;
  },

  // Subscribe to a plan
  subscribe: async (plan: SubscriptionPlan, returnUrl?: string): Promise<SubscribeResponse> => {
    const response = await apiClient.post<SubscribeResponse>('/billing/subscribe', {
      plan,
      return_url: returnUrl,
    });
    return response.data;
  },

  // Purchase single contract
  purchaseSingleContract: async (returnUrl?: string): Promise<SubscribeResponse> => {
    const response = await apiClient.post<SubscribeResponse>('/billing/single-contract', {
      return_url: returnUrl,
    });
    return response.data;
  },

  // Cancel auto-renewal
  cancelSubscription: async (): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.post<{ success: boolean; message: string }>('/billing/cancel');
    return response.data;
  },

  // Reactivate auto-renewal
  reactivateSubscription: async (): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.post<{ success: boolean; message: string }>('/billing/reactivate');
    return response.data;
  },

  // Get payment status
  getPaymentStatus: async (paymentId: string): Promise<PaymentStatusResponse> => {
    const response = await apiClient.get<PaymentStatusResponse>(`/billing/payment/${paymentId}`);
    return response.data;
  },

  // Get payment history
  getPayments: async (): Promise<PaymentsResponse> => {
    const response = await apiClient.get<PaymentsResponse>('/billing/payments');
    return response.data;
  },

  // Confirm payment (fallback for webhook)
  confirmPayment: async (): Promise<{
    success: boolean;
    status: string;
    type?: string;
    message: string;
  }> => {
    const response = await apiClient.post<{
      success: boolean;
      status: string;
      type?: string;
      message: string;
    }>('/billing/confirm-payment');
    return response.data;
  },
};
