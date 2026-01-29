import { api } from './http';
import { BillingInfo } from '../types/billing';

export async function getBilling(): Promise<BillingInfo> {
  const { data } = await api.get<BillingInfo>('/billing');
  return data;
}
