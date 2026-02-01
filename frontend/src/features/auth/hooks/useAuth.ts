import { useMutation } from '@tanstack/react-query';
import { authApi } from '@/shared/api';
import { authStore } from '../store/authStore';
import { LoginCredentials, RegisterCredentials, YandexCallbackPayload } from '@/shared/types';
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

export const useYandexCallback = () => {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (payload: YandexCallbackPayload) => authApi.yandexCallback(payload),
    onSuccess: (data) => {
      authStore.getState().setTokens(data.access_token, data.refresh_token);
      navigate('/dashboard');
    },
  });
};

export const useYandexSuggest = () => {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (accessToken: string) => authApi.yandexSuggest({ access_token: accessToken }),
    onSuccess: (data) => {
      authStore.getState().setTokens(data.access_token, data.refresh_token);
      navigate('/dashboard');
    },
  });
};
