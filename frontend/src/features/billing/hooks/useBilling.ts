import { useQuery } from '@tanstack/react-query';
import { billingApi } from '@/shared/api';

export const useBilling = () => {
  return useQuery({
    queryKey: ['billing'],
    queryFn: () => billingApi.getInfo(),
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};
