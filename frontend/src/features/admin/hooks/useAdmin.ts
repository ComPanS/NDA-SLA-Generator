import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/shared/api';
import { AdminLoginRequest } from '@/shared/types';
import { adminStore } from '../store/adminStore';

export const useAdminStore = () => adminStore();

export const useAdminLogin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: AdminLoginRequest) => adminApi.login(payload),
    onSuccess: (data) => {
      adminStore.getState().setToken(data.token);
      queryClient.invalidateQueries({ queryKey: ['admin'] });
    },
  });
};

export const useAdminLogout = () => {
  const queryClient = useQueryClient();

  return () => {
    adminStore.getState().logout();
    queryClient.removeQueries({ queryKey: ['admin'] });
  };
};

export const useAdminOverview = (enabled: boolean) => {
  return useQuery({
    queryKey: ['admin', 'overview'],
    queryFn: () => adminApi.getOverview(),
    enabled,
  });
};

export const useAdminUsers = (enabled: boolean) => {
  return useQuery({
    queryKey: ['admin', 'users'],
    queryFn: () => adminApi.getUsers(),
    enabled,
  });
};
