import apiClient from './client';
import { BillingInfo } from '@/shared/types';

export const billingApi = {
  getInfo: async (): Promise<BillingInfo> => {
    const response = await apiClient.get<BillingInfo>('/billing');
    return response.data;
  },
};
