import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { billingApi } from '@/shared/api';
import { SubscriptionPlan } from '@/shared/types';
import { authStore } from '@/features/auth/store/authStore';

export const useBilling = () => {
  const isAuthenticated = authStore((state) => state.isAuthenticated);
  const hasHydrated = authStore((state) => state._hasHydrated);
  const isEnabled = hasHydrated && isAuthenticated;
  

  return useQuery({
    queryKey: ['billing'],
    queryFn: () => {
      return billingApi.getSubscription();
    },
    staleTime: 1 * 60 * 1000, // 1 minute
    enabled: isEnabled,
  });
};

export const useUsage = () => {
  const isAuthenticated = authStore((state) => state.isAuthenticated);
  const hasHydrated = authStore((state) => state._hasHydrated);
  const isEnabled = hasHydrated && isAuthenticated;

  return useQuery({
    queryKey: ['billing', 'usage'],
    queryFn: () => billingApi.getUsage(),
    staleTime: 30 * 1000, // 30 seconds
    enabled: isEnabled,
  });
};

export const usePlans = () => {
  const isAuthenticated = authStore((state) => state.isAuthenticated);
  const hasHydrated = authStore((state) => state._hasHydrated);
  const isEnabled = hasHydrated && isAuthenticated;

  return useQuery({
    queryKey: ['billing', 'plans'],
    queryFn: () => billingApi.getPlans(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: isEnabled,
  });
};

export const usePayments = () => {
  const isAuthenticated = authStore((state) => state.isAuthenticated);
  const hasHydrated = authStore((state) => state._hasHydrated);
  const isEnabled = hasHydrated && isAuthenticated;

  return useQuery({
    queryKey: ['billing', 'payments'],
    queryFn: () => billingApi.getPayments(),
    staleTime: 1 * 60 * 1000, // 1 minute
    enabled: isEnabled,
  });
};

export const useSubscribe = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ plan, returnUrl }: { plan: SubscriptionPlan; returnUrl?: string }) =>
      billingApi.subscribe(plan, returnUrl),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billing'] });
    },
  });
};

export const usePurchaseSingleContract = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (returnUrl?: string) => billingApi.purchaseSingleContract(returnUrl),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billing', 'usage'] });
    },
  });
};

export const useCancelSubscription = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => billingApi.cancelSubscription(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billing'] });
    },
  });
};

export const useReactivateSubscription = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => billingApi.reactivateSubscription(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billing'] });
    },
  });
};

export const useConfirmPayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => billingApi.confirmPayment(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billing'] });
      queryClient.invalidateQueries({ queryKey: ['billing', 'usage'] });
    },
  });
};
