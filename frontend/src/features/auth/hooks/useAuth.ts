import { useMutation } from '@tanstack/react-query';
import { authApi } from '@/shared/api';
import { authStore } from '../store/authStore';
import { LoginCredentials, RegisterCredentials } from '@/shared/types';
import { useNavigate } from 'react-router-dom';

export const useLogin = () => {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (credentials: LoginCredentials) => authApi.login(credentials),
    onSuccess: (data) => {
      authStore.getState().setTokens(data.access_token, data.refresh_token);
      navigate('/dashboard');
    },
  });
};

export const useRegister = () => {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (credentials: RegisterCredentials) => authApi.register(credentials),
    onSuccess: (data) => {
      authStore.getState().setTokens(data.access_token, data.refresh_token);
      navigate('/dashboard');
    },
  });
};

export const useLogout = () => {
  const navigate = useNavigate();

  return () => {
    authStore.getState().logout();
    navigate('/');
  };
};

export const useAuthStore = () => authStore();
